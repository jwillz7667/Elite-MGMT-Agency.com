#!/usr/bin/env node
// Stage only public website artifacts. Never upload the repository checkout.
import {
  copyFile,
  lstat,
  mkdir,
  readdir,
  readFile,
  writeFile,
  rename,
  rm,
  mkdtemp,
} from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { transform } from 'esbuild';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'site-dist');
const PAGE_DIRECTORIES = [
  '2257',
  'careers',
  'cookies',
  'creator-economy-agency',
  'creator-management-agency-nyc',
  'dmca',
  'fansly-management-agency',
  'journal',
  'journal/scale-onlyfans-2026',
  'ofm-agency-for-women',
  'onlyfans-management-agency',
  'portal',
  'press',
  'privacy',
  'referrals',
  'services',
  'services/chat-operations',
  'services/marketing',
  'terms',
];
const PUBLIC_FILES = [
  'index.html',
  '404.html',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'manifest.webmanifest',
  'browserconfig.xml',
  'humans.txt',
  'llms.txt',
  '_headers',
  '_redirects',
  '.well-known/security.txt',
  ...PAGE_DIRECTORIES.map((directory) => `${directory}/index.html`),
];
const ASSET_EXTENSIONS = new Set([
  '.css',
  '.js',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
]);

async function validateSource() {
  await new Promise((resolveValidation, rejectValidation) => {
    const child = spawn(process.execPath, [join(ROOT, 'scripts/validate.mjs')], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    child.once('error', rejectValidation);
    child.once('exit', (code) => {
      if (code === 0) resolveValidation();
      else
        rejectValidation(
          new Error('Source validation failed; no deployment artifact was produced.')
        );
    });
  });
}

async function collectAssets(directory = 'assets') {
  const files = [];
  for (const entry of await readdir(join(ROOT, directory), { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Public assets cannot be symlinks: ${file}`);
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) files.push(...(await collectAssets(file)));
    else if (entry.isFile()) {
      const publicPath = file.split(sep).join('/');
      if (
        !ASSET_EXTENSIONS.has(extname(file).toLowerCase()) &&
        publicPath !== 'assets/fonts/LICENSE.txt'
      ) {
        throw new Error(`Unexpected asset type requires an explicit publication decision: ${file}`);
      }
      files.push(file);
    } else throw new Error(`Unsupported public asset: ${file}`);
  }
  return files.sort();
}

async function stageFile(source, target, file) {
  const extension = extname(file).toLowerCase();
  if (!['.css', '.js'].includes(extension)) {
    await copyFile(source, target);
    return null;
  }
  const input = await readFile(source, 'utf8');
  // Transform only the staged copy. Stable public paths and source files are
  // preserved, and no source maps or unminified companion files are emitted.
  const result = await transform(input, {
    loader: extension === '.css' ? 'css' : 'js',
    minify: true,
    target: extension === '.js' ? 'es2020' : ['chrome100', 'edge100', 'firefox100', 'safari15'],
    platform: 'browser',
    sourcemap: false,
    legalComments: 'none',
    charset: 'utf8',
    sourcefile: file.split(sep).join('/'),
    logLevel: 'silent',
  });
  for (const warning of result.warnings)
    console.warn(`Minifier warning in ${file}: ${warning.text}`);
  await writeFile(target, result.code, 'utf8');
  return { file, before: Buffer.byteLength(input), after: Buffer.byteLength(result.code) };
}

async function main() {
  // Removing only this fixed, generated directory prevents stale files from
  // surviving a failed build or accidentally entering a later deployment.
  await rm(OUTPUT, { recursive: true, force: true });
  await validateSource();
  const files = [...PUBLIC_FILES, ...(await collectAssets())];
  const included = new Set(files.map((file) => file.split(sep).join('/')));
  const sitemap = await readFile(join(ROOT, 'sitemap.xml'), 'utf8');
  for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const path = decodeURIComponent(new URL(match[1]).pathname);
    const file = path === '/' ? 'index.html' : `${path.slice(1)}index.html`;
    if (!included.has(file)) {
      throw new Error(`Sitemap route is missing from the public page allowlist: ${path}`);
    }
  }
  const staging = await mkdtemp(join(ROOT, '.site-dist-'));
  const minified = [];
  try {
    for (const file of files) {
      const source = join(ROOT, file);
      if (!(await lstat(source)).isFile())
        throw new Error(`Public file must be a regular file: ${file}`);
      const target = join(staging, file);
      await mkdir(dirname(target), { recursive: true });
      const stats = await stageFile(source, target, file);
      if (stats) minified.push(stats);
    }
    await rename(staging, OUTPUT);
    console.log(`Packaged ${files.length} public files into ${relative(ROOT, OUTPUT)}/.`);
    for (const { file, before, after } of minified) {
      console.log(`Minified ${file}: ${before} → ${after} bytes.`);
    }
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`Site packaging failed: ${error.message}`);
  process.exitCode = 1;
});
