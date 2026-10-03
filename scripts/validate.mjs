#!/usr/bin/env node
// Validate every published page, local route, responsive image and SEO reference.
// Uses Node built-ins so structural checks also work before npm install.
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://elite-mgmt-agency.com';
const ignored = new Set([
  'node_modules',
  'site-dist',
  'extracted',
  'coverage',
  'pa11y-results',
  'work',
  'outputs',
]);
const failures = [];
const warnings = [];
const pages = new Map();
const redirects = new Map();
const fail = (message, file) => failures.push({ message, file });
const warn = (message, file) => warnings.push({ message, file });
const readText = (file) => readFile(join(ROOT, file), 'utf8');

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}
async function collectFiles(directory = '') {
  const files = [];
  for (const entry of await readdir(join(ROOT, directory), { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && !ignored.has(entry.name))
        files.push(...(await collectFiles(path)));
    } else if (entry.isFile() && /\.(?:html|css)$/.test(entry.name)) files.push(path);
  }
  return files.sort();
}
function decodeEntities(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#(\d+)|#x([\da-f]+));/gi, (match, dec, hex) => {
    if (dec || hex) {
      const point = Number.parseInt(dec || hex, hex ? 16 : 10);
      return point <= 0x10ffff ? String.fromCodePoint(point) : match;
    }
    return { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' }[
      match.toLowerCase()
    ];
  });
}
function attributes(source) {
  const result = {};
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of source.matchAll(pattern))
    result[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  return result;
}
function tags(html) {
  // Script/style text is not markup; retain opening tags for src validation.
  const markup = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi, '$1</script>')
    .replace(/(<style\b[^>]*>)[\s\S]*?<\/style>/gi, '$1</style>');
  return [...markup.matchAll(/<([a-z][a-z\d:-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)].map(
    (match) => ({ name: match[1].toLowerCase(), attrs: attributes(match[2]) })
  );
}
function routeFor(file) {
  const path = file.split(sep).join('/');
  if (path === 'index.html') return '/';
  if (path.endsWith('/index.html')) return `/${path.slice(0, -'index.html'.length)}`;
  return `/${path.replace(/\.html$/, '')}/`;
}
async function targetFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const path = resolve(ROOT, `.${decoded}`);
  if (path !== ROOT && !path.startsWith(`${ROOT}${sep}`)) return null;
  const candidates = [path, join(path, 'index.html')];
  if (!extname(path)) candidates.push(`${path.replace(/\/$/, '')}.html`);
  for (const candidate of candidates) if (await isFile(candidate)) return relative(ROOT, candidate);
  return null;
}
async function checkReference(ref, file, base, { fragment = true, allowRedirect = true } = {}) {
  if (!ref || /^(?:mailto:|tel:|data:|blob:)/i.test(ref)) return;
  let url;
  try {
    url = new URL(ref, base);
  } catch {
    fail(`Invalid URL: ${ref}`, file);
    return;
  }
  if (url.origin !== ORIGIN) return;
  const target = await targetFile(url.pathname);
  if (!target && allowRedirect && redirects.has(url.pathname)) {
    return checkReference(redirects.get(url.pathname), file, ORIGIN, {
      fragment,
      allowRedirect: false,
    });
  }
  if (!target) {
    fail(`Broken local reference: ${ref}`, file);
    return;
  }
  if (fragment && url.hash && pages.has(target)) {
    let id;
    try {
      id = decodeURIComponent(url.hash.slice(1)).split(':~:text=')[0];
    } catch {
      fail(`Invalid fragment: ${ref}`, file);
      return;
    }
    if (id && !pages.get(target).ids.has(id)) fail(`Missing anchor in ${target}: ${ref}`, file);
  }
  return target;
}
function walkSchema(value, visit) {
  if (Array.isArray(value)) for (const item of value) walkSchema(item, visit);
  else if (value && typeof value === 'object') {
    visit(value);
    for (const item of Object.values(value)) walkSchema(item, visit);
  }
}

function srcsetCandidates(value) {
  const candidates = [];
  let position = 0;
  while (position < value.length) {
    while (/[\s,]/.test(value[position] ?? '') && position < value.length) position += 1;
    const start = position;
    while (position < value.length && !/\s/.test(value[position])) position += 1;
    let url = value.slice(start, position);
    if (!url) break;
    let descriptors = [];
    if (url.endsWith(',')) url = url.replace(/,+$/, '');
    else {
      const descriptorStart = position;
      while (position < value.length && value[position] !== ',') position += 1;
      descriptors = value.slice(descriptorStart, position).trim().split(/\s+/).filter(Boolean);
    }
    candidates.push({ url, descriptors });
  }
  return candidates;
}

const files = await collectFiles();
for (const file of files.filter((path) => path.endsWith('.html'))) {
  const html = await readText(file);
  const elements = tags(html);
  const ids = new Set();
  for (const { name, attrs } of elements) {
    if (attrs.id) {
      if (ids.has(attrs.id)) fail(`Duplicate element ID: ${attrs.id}`, file);
      ids.add(attrs.id);
    }
    if (name === 'a' && attrs.name) ids.add(attrs.name);
  }
  const meta = elements.filter((tag) => tag.name === 'meta');
  const canonicalLinks = elements.filter(
    (tag) => tag.name === 'link' && tag.attrs.rel?.split(/\s+/).includes('canonical')
  );
  const noindex = meta.some(
    (tag) =>
      /^(?:robots|googlebot|bingbot)$/.test(tag.attrs.name ?? '') &&
      /(?:^|[\s,])noindex(?:$|[\s,])/.test(tag.attrs.content ?? '')
  );
  pages.set(file, {
    html,
    elements,
    ids,
    meta,
    noindex,
    canonicalLinks,
    canonical: canonicalLinks[0]?.attrs.href,
    expected: `${ORIGIN}${routeFor(file)}`,
  });
}

// Prevent host redirects from shadowing real pages and validate their destinations.
const vercel = JSON.parse(await readText('vercel.json'));
const netlify = await readText('netlify.toml');
const redirectSources = [
  ['vercel.json', (vercel.redirects ?? []).map((rule) => [rule.source, rule.destination])],
  [
    'netlify.toml',
    [...netlify.matchAll(/\[\[redirects\]\]([\s\S]*?)(?=\[\[|$)/g)].map((match) => [
      match[1].match(/\bfrom\s*=\s*"([^"]+)"/)?.[1],
      match[1].match(/\bto\s*=\s*"([^"]+)"/)?.[1],
    ]),
  ],
  [
    '_redirects',
    (await readText('_redirects'))
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const [source, destination, status = '302'] = line.split(/\s+/);
        if (![200, 301, 302, 303, 307, 308].includes(Number(status)))
          fail(`Unsupported Cloudflare Pages redirect status: ${status}`, '_redirects');
        return [source, destination];
      }),
  ],
];
for (const [file, rules] of redirectSources) {
  const seen = new Set();
  for (const [source, destination] of rules) {
    if (!source || !destination) {
      fail('Redirect is missing its source or destination.', file);
      continue;
    }
    if (/[*:()]/.test(source)) continue;
    if (seen.has(source)) fail(`Duplicate redirect source: ${source}`, file);
    seen.add(source);
    if (redirects.has(source) && redirects.get(source) !== destination)
      fail(`Inconsistent redirect destination for ${source}`, file);
    redirects.set(source, destination);
    const sourceFile = await targetFile(source);
    const target = new URL(destination, ORIGIN);
    if (
      sourceFile &&
      pages.has(sourceFile) &&
      pages.get(sourceFile).expected !== `${target.origin}${target.pathname}`
    )
      fail(`Redirect shadows a published page: ${source} → ${destination}`, file);
    await checkReference(destination, file, ORIGIN);
  }
}
if (vercel.trailingSlash !== true)
  fail('trailingSlash must match directory-page canonicals (true).', 'vercel.json');
for (const file of ['_headers', 'netlify.toml', 'vercel.json']) {
  if (/immutable/.test(await readText(file)))
    fail('Stable asset filenames must revalidate instead of using immutable caching.', file);
}

for (const [file, page] of pages) {
  const { html, elements, meta, canonical, canonicalLinks, expected, noindex } = page;
  if (!noindex && canonicalLinks.length !== 1) fail('Expected exactly one canonical link.', file);
  if (canonical && canonical !== expected)
    fail(`Canonical must match ${expected}: ${canonical}`, file);
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  if (!title) fail('Missing page title.', file);
  else if (decodeEntities(title).length > 70) warn('Page title exceeds 70 characters.', file);
  const description = meta.find((tag) => tag.attrs.name === 'description')?.attrs.content;
  if (!description) fail('Missing meta description.', file);
  else if (description.length > 160) warn('Meta description exceeds 160 characters.', file);
  if (elements.filter((tag) => tag.name === 'h1').length !== 1)
    fail('Expected exactly one h1.', file);
  for (const key of ['og:url', 'twitter:url']) {
    const value = meta.find((tag) => (tag.attrs.property ?? tag.attrs.name) === key)?.attrs.content;
    if (key === 'og:url' && !noindex && !value) fail('Missing og:url.', file);
    if (value && value !== canonical) fail(`${key} must match the canonical.`, file);
  }
  const checked = new Set();
  for (const { name, attrs } of elements) {
    for (const key of ['src', 'href', 'poster']) {
      if (attrs[key] && !checked.has(attrs[key])) {
        checked.add(attrs[key]);
        await checkReference(attrs[key], file, expected);
      }
    }
    for (const key of ['srcset', 'imagesrcset']) {
      if (!attrs[key]) continue;
      // URLs can contain commas (including data URLs); commas after descriptors
      // delimit candidates. Keep checking local candidates beside embedded data.
      for (const { url, descriptors } of srcsetCandidates(attrs[key])) {
        const [descriptor, ...extra] = descriptors;
        if (
          !url ||
          extra.length ||
          (descriptor && !/^(?:[1-9]\d*w|(?:\d+\.)?\d+x)$/.test(descriptor))
        ) {
          fail(`Invalid ${key} candidate: ${url} ${descriptors.join(' ')}`, file);
          continue;
        }
        await checkReference(url, file, expected);
      }
    }
    if (name === 'img' && !Object.hasOwn(attrs, 'alt')) fail('Image is missing alt text.', file);
    if (
      name === 'meta' &&
      /^(?:og:image|og:image:secure_url|twitter:image)$/.test(attrs.property ?? attrs.name ?? '')
    )
      await checkReference(attrs.content, file, expected);
    // Runtime APIs cannot be verified by static file resolution.
    if (
      name === 'form' &&
      attrs.action &&
      !/^(?:mailto:|https:)/i.test(attrs.action) &&
      !(await targetFile(new URL(attrs.action, expected).pathname))
    )
      warn(`Form backend requires deployment verification: ${attrs.action}`, file);
  }
  const types = new Set();
  const blocks = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(
    (match) => attributes(match[1]).type === 'application/ld+json'
  );
  if (!noindex && !blocks.length) fail('Missing JSON-LD structured data.', file);
  for (const [index, block] of blocks.entries()) {
    let data;
    try {
      data = JSON.parse(block[2]);
    } catch (error) {
      fail(`JSON-LD block ${index + 1} is invalid: ${error.message}`, file);
      continue;
    }
    const references = [];
    walkSchema(data, (node) => {
      const nodeTypes = [].concat(node['@type'] ?? []);
      for (const type of nodeTypes) types.add(type);
      if (
        nodeTypes.some((type) =>
          ['WebPage', 'CollectionPage', 'ContactPage', 'Article', 'BlogPosting'].includes(type)
        ) &&
        node.url &&
        node.url !== canonical
      )
        fail(`JSON-LD page URL must match canonical: ${node.url}`, file);
      for (const key of ['url', 'contentUrl', 'image', 'logo', 'primaryImageOfPage', 'item']) {
        for (const ref of [].concat(node[key] ?? []))
          if (typeof ref === 'string' && /^(?:https?:\/\/|\/)/.test(ref)) references.push(ref);
      }
    });
    // JSON-LD fragments name schema entities, not HTML anchors.
    for (const ref of new Set(references))
      await checkReference(ref, file, expected, { fragment: false });
  }
  if (file === 'index.html')
    for (const type of ['Organization', 'WebSite', 'WebPage', 'BreadcrumbList'])
      if (!types.has(type)) fail(`Homepage JSON-LD is missing ${type}.`, file);
}
for (const file of files.filter((path) => path.endsWith('.css'))) {
  for (const match of (await readText(file)).matchAll(
    /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi
  ))
    await checkReference((match[1] ?? match[2] ?? match[3]).trim(), file, `${ORIGIN}/${file}`);
}

const sitemap = await readText('sitemap.xml');
const sitemapUrls = new Set();
for (const block of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const loc = decodeEntities(block[1].match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '');
  if (!loc || !loc.startsWith(`${ORIGIN}/`)) {
    fail(`Sitemap entry must use the site origin: ${loc}`, 'sitemap.xml');
    continue;
  }
  if (sitemapUrls.has(loc)) fail(`Duplicate sitemap URL: ${loc}`, 'sitemap.xml');
  sitemapUrls.add(loc);
  const file = await checkReference(loc, 'sitemap.xml', ORIGIN, { allowRedirect: false });
  if (!file || !pages.has(file))
    fail(`Sitemap URL does not resolve to HTML: ${loc}`, 'sitemap.xml');
  else if (pages.get(file).noindex || pages.get(file).canonical !== loc)
    fail(`Sitemap must contain an indexable canonical URL: ${loc}`, 'sitemap.xml');
  const lastmod = block[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  if (
    lastmod &&
    (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(lastmod) ||
      Number.isNaN(Date.parse(lastmod)) ||
      Date.parse(lastmod) > Date.now())
  )
    fail(`Invalid or future sitemap lastmod: ${lastmod}`, 'sitemap.xml');
  for (const image of block[1].matchAll(/<image:loc>([^<]+)<\/image:loc>/g))
    await checkReference(decodeEntities(image[1]), 'sitemap.xml', ORIGIN);
}
if (!sitemapUrls.size) fail('Sitemap contains no page entries.', 'sitemap.xml');
for (const [file, page] of pages)
  if (!page.noindex && !sitemapUrls.has(page.canonical))
    fail('Indexable page is absent from sitemap.', file);
const robots = await readText('robots.txt');
if (!robots.match(/^Sitemap:\s*https:\/\/elite-mgmt-agency\.com\/sitemap\.xml\s*$/m))
  fail('robots.txt must point to the canonical sitemap.', 'robots.txt');
if (/^Disallow:\s*\/portal\/?\s*$/m.test(robots))
  fail('The noindex portal must be crawlable so robots metadata can be read.', 'robots.txt');

const manifest = JSON.parse(await readText('manifest.webmanifest'));
await checkReference(manifest.start_url, 'manifest.webmanifest', `${ORIGIN}/`);
for (const icon of [...(manifest.icons ?? []), ...(manifest.screenshots ?? [])])
  await checkReference(icon.src, 'manifest.webmanifest', `${ORIGIN}/`);
for (const shortcut of manifest.shortcuts ?? []) {
  await checkReference(shortcut.url, 'manifest.webmanifest', `${ORIGIN}/`);
  for (const icon of shortcut.icons ?? [])
    await checkReference(icon.src, 'manifest.webmanifest', ORIGIN);
}
const security = await readText('.well-known/security.txt');
const expiry = security.match(/^Expires:\s*(.+)$/m)?.[1];
if (!expiry || Number.isNaN(Date.parse(expiry)))
  fail('Missing or invalid security.txt expiry.', '.well-known/security.txt');
else if (Date.parse(expiry) <= Date.now())
  fail(`security.txt has expired: ${expiry}`, '.well-known/security.txt');
else if (Date.parse(expiry) - Date.now() < 30 * 86400000)
  warn('security.txt expires within 30 days.', '.well-known/security.txt');
for (const match of security.matchAll(
  /^(?:Contact|Canonical|Policy|Acknowledgments|Hiring):\s*(\S+)/gm
))
  await checkReference(match[1], '.well-known/security.txt', ORIGIN);
for (const { message, file } of warnings) console.warn(`! ${file}: ${message}`);
for (const { message, file } of failures) console.error(`x ${file}: ${message}`);
if (failures.length) {
  console.error(`\n${failures.length} failure(s), ${warnings.length} warning(s).`);
  process.exitCode = 1;
} else
  console.log(
    `OK — ${pages.size} HTML pages, routes/assets/srcsets, schema and sitemap checked; ${warnings.length} warning(s).`
  );
