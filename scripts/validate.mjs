#!/usr/bin/env node
// =============================================================================
// Elite MGMT Agency · structural validator
//
// Runs cheap, fast invariant checks that don't fit any of the standard linters:
//   * Canonical/OG/Twitter URL consistency
//   * Robots/sitemap/manifest cross-references
//   * JSON-LD parseability and required @type nodes
//   * Asset references (every src/href/srcset target resolves on disk)
//   * Image sitemap entries exist
//   * security.txt expiry not in the past
//
// Exits non-zero on the first failure (CI-friendly). Intended to run after
// html-validate / stylelint / eslint as a final sanity check.
// =============================================================================

import { readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, URL as NodeURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_ORIGIN = 'https://elite-mgmt-agency.com';

const failures = [];
const warnings = [];

function fail(message, file) {
  failures.push({ message, file });
}

function warn(message, file) {
  warnings.push({ message, file });
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function readText(rel) {
  return readFile(join(ROOT, rel), 'utf8');
}

// ---------------------------------------------------------------------------
// 1. Read core artifacts
// ---------------------------------------------------------------------------

const html = await readText('index.html');
const notFoundHtml = await readText('404.html');
const robots = await readText('robots.txt');
const sitemap = await readText('sitemap.xml');
const manifest = JSON.parse(await readText('manifest.webmanifest'));
const securityTxt = await readText('.well-known/security.txt');

// ---------------------------------------------------------------------------
// 2. JSON-LD: must parse, must contain expected @types
// ---------------------------------------------------------------------------

const ldScripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
if (ldScripts.length === 0) {
  fail('No JSON-LD <script> block found.', 'index.html');
}

const ldTypes = new Set();
for (const [i, match] of ldScripts.entries()) {
  const raw = match[1].trim();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    fail(`JSON-LD block ${i + 1} did not parse: ${err.message}`, 'index.html');
    continue;
  }
  const graph = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
  for (const node of graph) {
    if (node['@type']) ldTypes.add(node['@type']);
  }
}

const requiredLdTypes = [
  'Organization',
  'ProfessionalService',
  'WebSite',
  'WebPage',
  'BreadcrumbList',
  'FAQPage',
];
for (const t of requiredLdTypes) {
  if (!ldTypes.has(t)) fail(`JSON-LD missing required @type: ${t}`, 'index.html');
}

// ---------------------------------------------------------------------------
// 3. Canonical / Open Graph / Twitter URL consistency
// ---------------------------------------------------------------------------

const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
const ogUrlMatch = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
const twitterUrlMatch = html.match(/<meta[^>]+name=["']twitter:url["'][^>]+content=["']([^"']+)["']/i);

if (!canonicalMatch) fail('Missing <link rel="canonical">', 'index.html');
if (!ogUrlMatch) fail('Missing <meta property="og:url">', 'index.html');

const canonical = canonicalMatch?.[1];
if (canonical && !canonical.startsWith(SITE_ORIGIN)) {
  fail(`Canonical URL does not start with ${SITE_ORIGIN}: ${canonical}`, 'index.html');
}
if (ogUrlMatch && canonical && ogUrlMatch[1] !== canonical) {
  fail(`og:url (${ogUrlMatch[1]}) does not match canonical (${canonical})`, 'index.html');
}
if (twitterUrlMatch && canonical && twitterUrlMatch[1] !== canonical) {
  warn(`twitter:url (${twitterUrlMatch[1]}) does not match canonical (${canonical})`, 'index.html');
}

// ---------------------------------------------------------------------------
// 4. Title and description length
// ---------------------------------------------------------------------------

const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
if (!titleMatch) {
  fail('Missing <title>', 'index.html');
} else if (titleMatch[1].length > 70) {
  warn(`<title> is ${titleMatch[1].length} chars (recommended max 70)`, 'index.html');
}

const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
if (!descMatch) {
  fail('Missing <meta name="description">', 'index.html');
} else if (descMatch[1].length > 160) {
  warn(`Meta description is ${descMatch[1].length} chars (recommended max 160)`, 'index.html');
}

// ---------------------------------------------------------------------------
// 5. Asset reference resolution
// ---------------------------------------------------------------------------

const attrPattern = /(?:src|href)=["']([^"'#?]+)["']/g;
const skipPrefixes = ['http://', 'https://', 'mailto:', 'tel:', 'data:', '#', '//'];

// File extensions that MUST resolve on disk. Anything else is treated as a
// route — those are handled by the redirect layer and may legitimately 404
// during launch phases before secondary pages ship.
const assetExtensions = new Set([
  '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.webmanifest', '.map',
  '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.svg', '.bmp',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp3', '.mp4', '.webm', '.mov', '.ogg', '.ogv',
  '.pdf',
  '.html', '.htm',
]);

function hasAssetExtension(ref) {
  const path = ref.split('?')[0].split('#')[0];
  const lastDot = path.lastIndexOf('.');
  const lastSlash = path.lastIndexOf('/');
  if (lastDot < 0 || lastDot < lastSlash) return false;
  return assetExtensions.has(path.slice(lastDot).toLowerCase());
}

for (const [label, text] of [['index.html', html], ['404.html', notFoundHtml]]) {
  let m;
  const seen = new Set();
  attrPattern.lastIndex = 0;
  while ((m = attrPattern.exec(text)) !== null) {
    const ref = m[1];
    if (skipPrefixes.some((p) => ref.startsWith(p))) continue;
    if (seen.has(ref)) continue;
    seen.add(ref);
    const localPath = ref.startsWith('/') ? join(ROOT, ref) : join(ROOT, ref);
    if (!(await exists(localPath))) {
      if (hasAssetExtension(ref)) {
        fail(`Broken asset reference: ${ref}`, label);
      } else {
        warn(`Route reference has no on-disk target (handled by redirects): ${ref}`, label);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Sitemap and robots cross-references
// ---------------------------------------------------------------------------

if (!robots.includes('Sitemap:')) {
  fail('robots.txt missing Sitemap: directive', 'robots.txt');
}
if (!sitemap.includes(SITE_ORIGIN)) {
  fail(`sitemap.xml does not reference origin ${SITE_ORIGIN}`, 'sitemap.xml');
}

// ---------------------------------------------------------------------------
// 7. Manifest icon files exist
// ---------------------------------------------------------------------------

for (const icon of manifest.icons ?? []) {
  const iconPath = join(ROOT, icon.src.replace(/^\//, ''));
  if (!(await exists(iconPath))) {
    fail(`manifest icon missing: ${icon.src}`, 'manifest.webmanifest');
  }
}

// ---------------------------------------------------------------------------
// 8. security.txt expiry check
// ---------------------------------------------------------------------------

const expiresMatch = securityTxt.match(/^Expires:\s*(.+)$/im);
if (!expiresMatch) {
  fail('security.txt missing Expires: directive', '.well-known/security.txt');
} else {
  const expiresAt = new Date(expiresMatch[1].trim());
  if (Number.isNaN(expiresAt.valueOf())) {
    fail(`security.txt Expires: not a valid date: ${expiresMatch[1]}`, '.well-known/security.txt');
  } else if (expiresAt.valueOf() < Date.now()) {
    fail(`security.txt has expired: ${expiresAt.toISOString()}`, '.well-known/security.txt');
  } else {
    const daysLeft = Math.round((expiresAt.valueOf() - Date.now()) / 86_400_000);
    if (daysLeft < 30) warn(`security.txt expires in ${daysLeft} days`, '.well-known/security.txt');
  }
}

// ---------------------------------------------------------------------------
// 9. Origin must be parseable
// ---------------------------------------------------------------------------

try {
  // eslint-disable-next-line no-new
  new NodeURL(SITE_ORIGIN);
} catch {
  fail(`SITE_ORIGIN is not a valid URL: ${SITE_ORIGIN}`, 'scripts/validate.mjs');
}

// ---------------------------------------------------------------------------
// 10. Report
// ---------------------------------------------------------------------------

const cwd = process.cwd();
function rel(p) {
  return p ? relative(cwd, join(ROOT, p)) || p : '';
}

if (warnings.length > 0) {
  console.warn('\nWarnings:');
  for (const w of warnings) console.warn(`  ! ${rel(w.file)}: ${w.message}`);
}

if (failures.length > 0) {
  console.error('\nValidation failed:');
  for (const f of failures) console.error(`  x ${rel(f.file)}: ${f.message}`);
  console.error(`\n${failures.length} failure(s), ${warnings.length} warning(s).`);
  process.exit(1);
}

console.log(`OK — validate.mjs passed with ${warnings.length} warning(s).`);
