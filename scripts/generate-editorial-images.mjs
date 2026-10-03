#!/usr/bin/env node
/** WaveSpeed editorial masters: explicit paid submission, resumable reads, no automatic rerolls. */
import { createHash, randomUUID } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { createWriteStream } from 'node:fs';
import { link, mkdir, open, readFile, realpath, rename, rm, stat } from 'node:fs/promises';
import https from 'node:https';
import { isIP } from 'node:net';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MODEL = 'bytedance/seedream-v5.0-pro';
const API = 'https://api.wavespeed.ai/api/v3';
const TERMINAL = new Set(['completed', 'failed', 'cancelled', 'timeout', 'deleted']);
const ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
const PREDICTION_ID = /^[A-Za-z0-9_-]{1,160}$/;
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const HELP = `Usage: node scripts/generate-editorial-images.mjs [action] [options]

Actions (choose one; default --plan):
  --plan                Print reviewed prompts; no key or network required.
  --submit              Submit NEW selected images once. This can incur charges.
  --status              Read existing prediction status; never submits images.
  --download            Save completed image masters; never submits images.
  --adopt ID=PREDICTION  Recover an existing prediction from WaveSpeed History.

Options:
  --ids ID,ID           Select manifest image IDs (default: all manifest images).
  --output-dir PATH     Masters directory, outside the repository.
  --polls N             Status sweeps, 1–5 (default: 1; 60-second total budget).
  --interval-ms N       Delay between sweeps, 2000–10000 (default: 2000).
  --help                Show this help.

Default masters: ../editorial-image-masters relative to the repository.
State: .cache/editorial-images/jobs.json. Keep it to avoid duplicate charges.
Set WAVESPEED_API_KEY securely in the environment for --submit or --status.
There are no automatic paid retries; an uncertain submission requires History recovery.`;

class WorkflowError extends Error {}

function requireThat(condition, message) {
  if (!condition) throw new WorkflowError(message);
}

function parseArgs(argv) {
  const options = {
    action: 'plan',
    ids: null,
    polls: 1,
    interval: 2000,
    outputDir: resolve(ROOT, '..', 'editorial-image-masters'),
  };
  let actionChosen = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help') return { action: 'help' };
    if (['--plan', '--submit', '--status', '--download', '--adopt'].includes(arg)) {
      requireThat(!actionChosen, 'Choose exactly one action.');
      options.action = arg.slice(2);
      actionChosen = true;
      if (arg === '--adopt') options.adopt = argv[++index];
    } else if (['--ids', '--output-dir', '--polls', '--interval-ms'].includes(arg)) {
      const value = argv[++index];
      requireThat(typeof value === 'string' && !value.startsWith('--'), `${arg} requires a value.`);
      if (arg === '--ids') options.ids = value.split(',');
      if (arg === '--output-dir') options.outputDir = resolve(value);
      if (arg === '--polls') options.polls = Number(value);
      if (arg === '--interval-ms') options.interval = Number(value);
    } else throw new WorkflowError('Unknown option. Run --help.');
  }
  requireThat(
    Number.isInteger(options.polls) && options.polls >= 1 && options.polls <= 5,
    '--polls must be 1–5.'
  );
  requireThat(
    Number.isInteger(options.interval) && options.interval >= 2000 && options.interval <= 10000,
    '--interval-ms must be 2000–10000.'
  );
  requireThat(
    options.action !== 'adopt' || typeof options.adopt === 'string',
    '--adopt requires ID=PREDICTION.'
  );
  return options;
}

async function loadManifest(path) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(path, 'utf8'));
  } catch {
    throw new WorkflowError('Cannot read the editorial manifest as JSON.');
  }
  requireThat(
    manifest.schema_version === 1 &&
      manifest.provider === 'WaveSpeedAI' &&
      manifest.model === MODEL,
    'Unsupported editorial manifest provider, model, or version.'
  );
  requireThat(
    Array.isArray(manifest.images) && manifest.images.length > 0,
    'Manifest has no images.'
  );
  const seen = new Set();
  const defaults = manifest.defaults || {};
  requireThat(['1k', '1.5k', '2k'].includes(defaults.resolution), 'Invalid resolution tier.');
  requireThat(['jpeg', 'png'].includes(defaults.output_format), 'Invalid output format.');
  requireThat(
    ['standard', 'fast'].includes(defaults.prompt_optimization_mode),
    'Invalid prompt optimization mode.'
  );
  return manifest.images.map((image) => {
    requireThat(
      ID.test(image.id || '') && !seen.has(image.id),
      'Manifest IDs must be unique lowercase names.'
    );
    seen.add(image.id);
    requireThat(
      ['4:5', '4:3'].includes(image.aspect_ratio),
      `Unsupported editorial ratio for ${image.id}.`
    );
    requireThat(
      typeof image.prompt === 'string' &&
        image.prompt.trim().length >= 80 &&
        image.prompt.length <= 10000,
      `Invalid prompt for ${image.id}.`
    );
    const input = {
      prompt: image.prompt,
      aspect_ratio: image.aspect_ratio,
      resolution: defaults.resolution,
      output_format: defaults.output_format,
      prompt_optimization_mode: defaults.prompt_optimization_mode,
      enable_sync_mode: false,
      enable_base64_output: false,
    };
    return {
      ...image,
      input,
      requestHash: createHash('sha256')
        .update(JSON.stringify({ model: MODEL, input }))
        .digest('hex'),
    };
  });
}

function selectImages(images, ids) {
  if (!ids) return images;
  requireThat(
    ids.length > 0 && new Set(ids).size === ids.length && ids.every((id) => ID.test(id)),
    'Invalid or repeated --ids.'
  );
  const selected = ids.map((id) => images.find((image) => image.id === id));
  requireThat(selected.every(Boolean), 'A selected image ID is absent from the manifest.');
  return selected;
}

async function readRegistry(path) {
  try {
    const data = JSON.parse(await readFile(path, 'utf8'));
    requireThat(
      data.version === 1 &&
        data.model === MODEL &&
        data.jobs &&
        typeof data.jobs === 'object' &&
        !Array.isArray(data.jobs),
      'Unsupported jobs registry.'
    );
    for (const [id, job] of Object.entries(data.jobs)) {
      requireThat(ID.test(id) && job && typeof job === 'object', 'Invalid saved image job.');
      requireThat(
        !job.predictionId || PREDICTION_ID.test(job.predictionId),
        'Invalid saved prediction ID.'
      );
    }
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') return { version: 1, model: MODEL, jobs: {} };
    if (error instanceof WorkflowError) throw error;
    throw new WorkflowError(
      'Cannot read jobs registry. Preserve it and recover from WaveSpeed History before submitting again.'
    );
  }
}

async function saveRegistry(path, data) {
  data.updatedAt = new Date().toISOString();
  const temporary = `${path}.${randomUUID()}.tmp`;
  const handle = await open(temporary, 'wx', 0o600);
  try {
    await handle.writeFile(`${JSON.stringify(data, null, 2)}\n`);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
  // Persist the directory entry as well as the prediction record before continuing.
  let directory;
  try {
    directory = await open(dirname(path), 'r');
    await directory.sync();
  } catch (error) {
    if (!['EINVAL', 'ENOTSUP', 'EISDIR', 'EPERM'].includes(error.code)) throw error;
  } finally {
    if (directory) await directory.close();
  }
}

async function withRegistry(directory, callback) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const lockPath = resolve(directory, 'jobs.lock');
  let lock;
  try {
    lock = await open(lockPath, 'wx', 0o600);
  } catch (error) {
    if (error.code === 'EEXIST')
      throw new WorkflowError(
        'An image workflow lock exists. Check whether it is running before manually removing a stale jobs.lock; keep jobs.json.'
      );
    throw error;
  }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    await lock.sync();
    const path = resolve(directory, 'jobs.json');
    const registry = await readRegistry(path);
    return await callback(registry, () => saveRegistry(path, registry));
  } finally {
    await lock.close();
    await rm(lockPath, { force: true });
  }
}

function safeOutputUrl(value) {
  requireThat(typeof value === 'string', 'Provider returned a non-URL image output.');
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new WorkflowError('Provider returned an invalid image URL.');
  }
  requireThat(
    url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      (!url.port || url.port === '443'),
    'Image outputs must use HTTPS without credentials.'
  );
  const host = url.hostname.toLowerCase();
  requireThat(
    host.includes('.') &&
      !isIP(host.replace(/^\[|\]$/g, '')) &&
      !['localhost', 'local', 'internal', 'test', 'invalid'].some(
        (suffix) => host === suffix || host.endsWith(`.${suffix}`)
      ),
    'Image output host is not a public CDN hostname.'
  );
  return url;
}

async function apiJson(path, key, fetchImpl, { input, timeout = 30000 } = {}) {
  let response;
  try {
    response = await fetchImpl(`${API}/${path}`, {
      method: input ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
        ...(input ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(input ? { body: JSON.stringify(input) } : {}),
      redirect: 'error',
      signal: AbortSignal.timeout(Math.max(1, timeout)),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new WorkflowError(
        `WaveSpeed request returned HTTP ${response.status}. No automatic retry was made.`
      );
    }
    const reader = response.body.getReader();
    const chunks = [];
    let length = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 1024 * 1024) {
        await reader.cancel();
        throw new WorkflowError('WaveSpeed response exceeded the JSON size limit.');
      }
      chunks.push(Buffer.from(value));
    }
    let parsed;
    try {
      parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      throw new WorkflowError('WaveSpeed returned malformed JSON.');
    }
    requireThat(
      !parsed.code || Number(parsed.code) === 200,
      'WaveSpeed reported an unsuccessful request.'
    );
    const task = parsed.data ?? parsed;
    requireThat(
      task && typeof task === 'object' && !Array.isArray(task),
      'WaveSpeed returned an invalid prediction object.'
    );
    return task;
  } catch (error) {
    if (error instanceof WorkflowError) throw error;
    throw new WorkflowError('WaveSpeed request failed or timed out. No automatic retry was made.');
  }
}

function updateJob(job, task) {
  requireThat(
    !task.id || task.id === job.predictionId,
    'Result prediction ID does not match the saved job.'
  );
  const status = typeof task.status === 'string' ? task.status.toLowerCase() : 'submitted';
  requireThat(
    /^[a-z_][a-z0-9_-]{0,39}$/.test(status),
    'Provider returned an invalid prediction status.'
  );
  let outputs;
  if (status === 'completed') {
    requireThat(
      Array.isArray(task.outputs) && task.outputs.length > 0 && task.outputs.length <= 8,
      'Completed prediction has no valid image outputs.'
    );
    outputs = task.outputs.map((output) => safeOutputUrl(output).href);
  }
  job.status = status;
  job.checkedAt = new Date().toISOString();
  if (outputs) job.outputs = outputs;
  delete job.lastError;
}

async function submit(images, registry, save, key, fetchImpl) {
  const existing = images.filter((image) => Object.hasOwn(registry.jobs, image.id));
  requireThat(
    existing.length === 0,
    `Selected images already have saved jobs: ${existing.map((image) => image.id).join(', ')}. Use --status/--download or select only new manifest IDs; paid resubmission is refused.`
  );
  for (const image of images) {
    const job = {
      predictionId: null,
      status: 'submitting',
      requestHash: image.requestHash,
      input: image.input,
      submittedAt: new Date().toISOString(),
      outputs: [],
    };
    registry.jobs[image.id] = job;
    // A crash after this durable checkpoint cannot silently cause another paid POST.
    await save();
    try {
      const task = await apiJson(MODEL, key, fetchImpl, { input: image.input });
      requireThat(
        PREDICTION_ID.test(task.id || ''),
        'Submission response has no usable prediction ID.'
      );
      job.predictionId = task.id;
      job.status = 'submitted';
      await save();
      updateJob(job, task);
      await save();
      console.log(`${image.id}: ${job.status}; prediction ${job.predictionId}`);
      requireThat(
        !TERMINAL.has(job.status) || job.status === 'completed',
        `Prediction ended with ${job.status}; remaining paid submissions were stopped.`
      );
    } catch (error) {
      job.status = job.predictionId ? job.status : 'submission_unknown';
      job.lastError = 'Submission needs manual review; do not resubmit this ID.';
      await save();
      throw new WorkflowError(
        `Submission stopped at ${image.id}. Its state was preserved. ${error instanceof WorkflowError ? error.message : 'Local state persistence failed.'} Check WaveSpeed History; use --adopt if the prediction ID was not saved.`
      );
    }
  }
}

async function checkStatus(images, registry, save, key, fetchImpl, options) {
  const deadline = Date.now() + 60000;
  let failed = false;
  for (let sweep = 0; sweep < options.polls; sweep += 1) {
    for (const image of images) {
      const job = registry.jobs[image.id];
      if (!job) {
        console.log(`${image.id}: not submitted`);
        continue;
      }
      if (!job.predictionId) {
        console.log(`${image.id}: ${job.status}; recover from History using --adopt`);
        failed = true;
        continue;
      }
      if (!TERMINAL.has(job.status)) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
          console.log('Status time budget reached; rerun --status to continue.');
          return failed;
        }
        const task = await apiJson(
          `predictions/${encodeURIComponent(job.predictionId)}/result`,
          key,
          fetchImpl,
          { timeout: Math.min(30000, remaining) }
        );
        updateJob(job, task);
        await save();
      }
      console.log(`${image.id}: ${job.status}`);
      if (TERMINAL.has(job.status) && job.status !== 'completed') failed = true;
    }
    const pending = images.some((image) => {
      const job = registry.jobs[image.id];
      return job?.predictionId && !TERMINAL.has(job.status);
    });
    if (!pending || sweep + 1 === options.polls || Date.now() + options.interval >= deadline) break;
    await new Promise((done) => setTimeout(done, options.interval));
  }
  return failed;
}

function isPublicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && [0, 168].includes(b)) ||
      (a === 198 && [18, 19].includes(b))
    );
  }
  // Use only global-unicast IPv6; DNS answers in loopback/private/mapped ranges are denied.
  return (
    isIP(address) === 6 && /^[23]/i.test(address) && !address.toLowerCase().startsWith('2001:db8:')
  );
}

async function imageResponse(url, deadline, redirects = 0) {
  safeOutputUrl(url.href);
  let addresses;
  let dnsTimer;
  try {
    const remaining = deadline - Date.now();
    requireThat(remaining > 0, 'Image download timed out.');
    addresses = await Promise.race([
      lookup(url.hostname, { all: true, verbatim: true }),
      new Promise((_done, reject) => {
        dnsTimer = setTimeout(
          () => reject(new WorkflowError('Image DNS lookup timed out.')),
          remaining
        );
      }),
    ]);
  } catch {
    throw new WorkflowError('Image CDN hostname could not be resolved.');
  } finally {
    clearTimeout(dnsTimer);
  }
  requireThat(
    addresses.length > 0 && addresses.every((entry) => isPublicAddress(entry.address)),
    'Image CDN resolved to a non-public address.'
  );
  const timeout = deadline - Date.now();
  requireThat(timeout > 0, 'Image download timed out.');
  const address = addresses.find((entry) => entry.family === 4) || addresses[0];
  let response;
  try {
    response = await new Promise((done, reject) => {
      const request = https.get(
        url,
        {
          signal: AbortSignal.timeout(timeout),
          headers: { Accept: 'image/jpeg,image/png' },
          // Pin the validated DNS answer, retaining TLS hostname verification; never send API credentials to a CDN.
          lookup: (_host, options, callback) =>
            options.all
              ? callback(null, [address])
              : callback(null, address.address, address.family),
        },
        done
      );
      request.on('error', reject);
    });
  } catch {
    throw new WorkflowError('Image CDN request failed or timed out.');
  }
  if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
    const location = response.headers.location;
    response.destroy();
    requireThat(
      redirects < 3 && typeof location === 'string',
      'Image CDN redirect limit or missing location.'
    );
    let next;
    try {
      next = new URL(location, url);
    } catch {
      throw new WorkflowError('Image CDN redirect is invalid.');
    }
    return imageResponse(next, deadline, redirects + 1);
  }
  if (response.statusCode !== 200) {
    response.destroy();
    throw new WorkflowError(`Image CDN returned HTTP ${response.statusCode}.`);
  }
  const contentType = (response.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const contentLength = Number(response.headers['content-length'] || 0);
  if (!['image/jpeg', 'image/png'].includes(contentType) || contentLength > MAX_IMAGE_BYTES) {
    response.destroy();
    throw new WorkflowError('Image CDN returned an unsupported format or an oversized image.');
  }
  return { response, contentType };
}

function inside(parent, path) {
  const rel = relative(parent, path);
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`));
}

async function download(images, registry, save, outputDir) {
  requireThat(
    images.every(
      (image) =>
        registry.jobs[image.id]?.status === 'completed' && registry.jobs[image.id].outputs?.length
    ),
    'Every selected image must have completed outputs. Run --status, then select completed IDs with --ids.'
  );
  await mkdir(outputDir, { recursive: true, mode: 0o700 });
  const destination = await realpath(outputDir);
  requireThat(
    !inside(await realpath(ROOT), destination),
    'Keep masters outside the repository; choose another --output-dir.'
  );
  for (const image of images) {
    const job = registry.jobs[image.id];
    for (const [index, output] of job.outputs.entries()) {
      const extension = job.input.output_format === 'png' ? 'png' : 'jpg';
      const suffix = job.outputs.length === 1 ? '' : `-${String(index + 1).padStart(2, '0')}`;
      const path = resolve(destination, `${image.id}${suffix}.${extension}`);
      const prior = job.downloads?.find(
        (entry) => entry.path === path && entry.outputIndex === index
      );
      try {
        await stat(path);
        const bytes = await readFile(path);
        requireThat(
          prior && prior.sha256 === createHash('sha256').update(bytes).digest('hex'),
          `Refusing to overwrite an untracked or modified master for ${image.id}. Choose a fresh output directory.`
        );
        console.log(`${image.id}: already downloaded and verified`);
        continue;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      const temporary = `${path}.${randomUUID()}.part`;
      let size = 0;
      let prefix = Buffer.alloc(0);
      const digest = createHash('sha256');
      try {
        const { response, contentType } = await imageResponse(
          safeOutputUrl(output),
          Date.now() + 30000
        );
        if (contentType !== (extension === 'png' ? 'image/png' : 'image/jpeg')) {
          response.destroy();
          throw new WorkflowError(
            'Downloaded image format does not match the requested master format.'
          );
        }
        const counter = new Transform({
          transform(chunk, _encoding, callback) {
            size += chunk.length;
            if (size > MAX_IMAGE_BYTES) {
              callback(new WorkflowError('Image exceeded the download size limit.'));
              return;
            }
            if (prefix.length < 8) prefix = Buffer.concat([prefix, chunk]).subarray(0, 8);
            digest.update(chunk);
            callback(null, chunk);
          },
        });
        await pipeline(
          response,
          counter,
          createWriteStream(temporary, { flags: 'wx', mode: 0o600 })
        );
        const valid =
          extension === 'png'
            ? prefix.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            : prefix[0] === 255 && prefix[1] === 216 && prefix[2] === 255;
        requireThat(valid && size > 8, 'Downloaded bytes are not a valid JPEG or PNG master.');
        // Publish without replacing a file created by another process during the download.
        await link(temporary, path);
        const entry = {
          outputIndex: index,
          path,
          bytes: size,
          sha256: digest.digest('hex'),
          downloadedAt: new Date().toISOString(),
        };
        job.downloads = [...(job.downloads || []).filter((saved) => saved.path !== path), entry];
        await save();
        console.log(`${image.id}: saved ${path}`);
      } catch (error) {
        if (error instanceof WorkflowError) throw error;
        throw new WorkflowError(
          `Download or local persistence failed for ${image.id}. Existing paid prediction was preserved.`
        );
      } finally {
        await rm(temporary, { force: true });
      }
    }
  }
}

/** Injectable transport and state paths let offline verification exercise charge protection. */
export async function run({
  argv = process.argv.slice(2),
  env = process.env,
  fetchImpl = globalThis.fetch,
  manifestPath = resolve(ROOT, 'docs/editorial-images.json'),
  registryDir = resolve(ROOT, '.cache/editorial-images'),
} = {}) {
  const options = parseArgs(argv);
  if (options.action === 'help') {
    console.log(HELP);
    return;
  }
  const images = selectImages(await loadManifest(manifestPath), options.ids);
  if (options.action === 'plan') {
    console.log(
      JSON.stringify(
        {
          model: MODEL,
          paidRequests: images.length,
          images: images.map(({ id, placement, alt_text, input, requestHash }) => ({
            id,
            placement,
            alt_text,
            input,
            requestHash,
          })),
        },
        null,
        2
      )
    );
    return;
  }
  const key = typeof env.WAVESPEED_API_KEY === 'string' ? env.WAVESPEED_API_KEY.trim() : '';
  if (['submit', 'status'].includes(options.action))
    requireThat(
      key && !/\s/.test(key),
      'Set WAVESPEED_API_KEY securely in the environment. It is never written or printed.'
    );
  await withRegistry(registryDir, async (registry, save) => {
    if (options.action === 'adopt') {
      const [id, predictionId, extra] = options.adopt.split('=');
      requireThat(
        !extra && ID.test(id || '') && PREDICTION_ID.test(predictionId || ''),
        '--adopt requires a manifest ID and valid prediction ID.'
      );
      const image = images.find((entry) => entry.id === id);
      requireThat(image, 'Adoption ID is not in the selected manifest images.');
      const prior = registry.jobs[id];
      requireThat(
        !prior?.predictionId || prior.predictionId === predictionId,
        'A different prediction is already saved for this image; adoption cannot replace it.'
      );
      requireThat(
        !prior || prior.requestHash === image.requestHash,
        'Prompt changed after submission. Restore its original manifest input before adoption.'
      );
      registry.jobs[id] = prior?.predictionId
        ? prior
        : {
            ...(prior || {}),
            predictionId,
            status: 'submitted',
            requestHash: image.requestHash,
            input: image.input,
            outputs: [],
            adoptedAt: new Date().toISOString(),
          };
      await save();
      console.log(`${id}: existing prediction adopted; run --status. No image was submitted.`);
    } else if (options.action === 'submit') await submit(images, registry, save, key, fetchImpl);
    else if (options.action === 'status') {
      if (await checkStatus(images, registry, save, key, fetchImpl, options)) process.exitCode = 1;
    } else await download(images, registry, save, options.outputDir);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    // Do not print raw provider bodies, fetch errors, URLs with signatures, environment values, or stack traces.
    console.error(
      error instanceof WorkflowError
        ? error.message
        : 'Image workflow failed locally. Preserve jobs.json and inspect configuration before retrying.'
    );
    process.exitCode = 1;
  });
}
