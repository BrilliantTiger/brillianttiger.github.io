// Static checks on dist/ (run after the build):  npm run check
//   - HTML sanity: lang, one <h1>, alt text, unique ids, working #anchors, no leftover {placeholders}
//   - every internal link / asset exists, external _blank links have rel=noopener
//   - hreflang pairs, JSON-LD parses, sitemap URLs exist
//   - WCAG contrast of the colour tokens in styles.css (light and dark)
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const site = JSON.parse(await readFile(path.join(ROOT, 'content/site.json'), 'utf8'));
const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}
const exists = (p) => stat(p).then(() => true, () => false);

async function resolveInternal(href) {
  const clean = decodeURIComponent(href.split('#')[0].split('?')[0]);
  let p = path.join(DIST, clean);
  if (clean.endsWith('/')) p = path.join(p, 'index.html');
  if (await exists(p)) return !(await stat(p)).isDirectory() || (await exists(path.join(p, 'index.html')));
  return false;
}

const files = await walk(DIST);
const pages = files.filter((f) => f.endsWith('.html'));

for (const file of pages) {
  const rel = path.relative(DIST, file);
  const src = await readFile(file, 'utf8');
  const body = src.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');

  if (!/<html lang="[a-z-]+"/.test(src)) fail(rel, 'missing <html lang>');
  const h1 = (body.match(/<h1[\s>]/g) || []).length;
  if (rel !== '404.html' || h1) if (h1 !== 1) fail(rel, `expected one <h1>, found ${h1}`);
  const title = (src.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
  if (!title || title.length > 75) fail(rel, `title missing or too long (${title.length})`);
  const desc = (src.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (rel !== '404.html' && (desc.length < 70 || desc.length > 175)) fail(rel, `description length ${desc.length} (want 70-175)`);
  if (!/<link rel="canonical" href="https:\/\//.test(src)) fail(rel, 'missing canonical');

  const leftovers = body.replace(/<[^>]+>/g, ' ').match(/\{[\w.]+\}/g);
  if (leftovers) fail(rel, `unreplaced placeholders: ${[...new Set(leftovers)].join(', ')}`);

  for (const m of body.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(m[0])) fail(rel, `<img> without alt: ${m[0].slice(0, 70)}`);
    if (!/\swidth="/.test(m[0]) || !/\sheight="/.test(m[0])) fail(rel, `<img> without width/height: ${m[0].slice(0, 70)}`);
  }

  const ids = [...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) fail(rel, `duplicate ids: ${[...new Set(dup)].join(', ')}`);

  for (const m of src.matchAll(/<a\b[^>]*>/g)) {
    const tag = m[0];
    const href = (tag.match(/\shref="([^"]*)"/) || [])[1];
    if (href == null) continue;
    if (href.startsWith('#')) {
      if (href.length > 1 && !ids.includes(href.slice(1))) fail(rel, `anchor ${href} has no target`);
    } else if (href.startsWith('/')) {
      if (!(await resolveInternal(href))) fail(rel, `broken internal link ${href}`);
    } else if (/^https?:/.test(href)) {
      if (/target="_blank"/.test(tag) && !/rel="[^"]*noopener/.test(tag)) fail(rel, `_blank link without noopener: ${href}`);
    }
  }
  for (const m of src.matchAll(/\s(?:src|href)="(\/[^"]*)"/g)) {
    const v = m[1];
    if (v.startsWith('//')) continue;
    if (!(await resolveInternal(v))) fail(rel, `missing asset/link target ${v}`);
  }

  for (const m of src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      fail(rel, `invalid JSON-LD: ${e.message}`);
    }
  }
  if (rel === 'index.html' || rel === 'ko/index.html') {
    for (const lang of site.langs) if (!src.includes(`hreflang="${lang}"`)) fail(rel, `missing hreflang=${lang}`);
    if (!src.includes('hreflang="x-default"')) fail(rel, 'missing hreflang=x-default');
  }
}

const sitemap = await readFile(path.join(DIST, 'sitemap.xml'), 'utf8');
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const u = new URL(m[1]);
  if (u.origin !== site.url) fail('sitemap.xml', `unexpected origin ${u.origin}`);
  if (!(await resolveInternal(u.pathname))) fail('sitemap.xml', `${u.pathname} does not exist`);
}
for (const f of ['robots.txt', 'llms.txt', 'CNAME', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'site.webmanifest']) {
  if (!(await exists(path.join(DIST, f)))) fail(f, 'missing from dist');
}
for (const lang of site.langs) {
  if (!(await exists(path.join(DIST, `assets/og/og-${lang}.png`)))) fail(`og-${lang}.png`, 'missing; run scripts/brand/make_og.py');
}

/* ---------------------------------------------------------------- contrast */

const css = await readFile(path.join(ROOT, 'public/assets/styles.css'), 'utf8');
const light = {};
const dark = {};
for (const m of css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,6})\s*;/gi)) light[m[1]] ??= dark[m[1]] = m[2];
for (const m of css.matchAll(/--([\w-]+):\s*light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)/gi)) {
  light[m[1]] = m[2];
  dark[m[1]] = m[3];
}
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const col = (theme, v) => (v.startsWith('#') ? v : theme[v]);

const PAIRS = [
  ['ink', 'bg', 7], ['ink-2', 'bg', 4.5], ['ink-3', 'bg', 4.5], ['ink-3', 'bg-tint', 4.5], ['ink-2', 'surface', 4.5], ['ink-3', 'surface', 4.5],
  ['accent-ink', 'bg', 4.5], ['accent-ink', 'bg-tint', 4.5], ['accent-ink', 'accent-soft', 4.5], ['accent-ink', 'surface', 4.5],
  ['mint-ink', 'mint-soft', 4.5], ['violet-ink', 'violet-soft', 4.5], ['magenta-ink', 'magenta-soft', 4.5], ['blue-ink', 'blue-soft', 4.5],
  ['mint-ink', 'surface', 4.5], ['amber-ink', 'amber-soft', 4.5], ['amber-ink', 'surface', 4.5], ['violet-ink', 'surface', 4.5], ['magenta-ink', 'surface', 4.5], ['blue-ink', 'surface', 4.5],
  ['on-accent', 'accent', 4.5], ['on-accent', 'accent-hi', 4.5],
];
const PANEL = [
  ['panel-ink', 'panel', 7], ['panel-ink-2', 'panel', 4.5], ['panel-ink-2', 'panel-2', 4.5], ['panel-ink-3', 'panel', 4.5], ['panel-ink-3', 'panel-2', 4.5],
  ['#ff9a5c', 'panel', 4.5], ['#ff9a5c', 'panel-2', 4.5], ['#ff7a2b', 'panel-2', 3], ['#5fe0a5', '#1d1814', 4.5], ['#f5b544', '#1d1814', 4.5], ['#ffc9a3', '#2a211a', 4.5],
  ['#6ee7b7', '#1f3d33', 4.5], ['#b8aeff', '#2c2757', 4.5], ['#ffa066', '#3d2616', 4.5], ['#9cc4ff', '#17130f', 4.5],
];
const rows = [];
for (const [name, theme] of [['light', light], ['dark', dark]]) {
  for (const [fg, bg, min] of PAIRS) {
    const r = ratio(col(theme, fg), col(theme, bg));
    rows.push([name, fg, bg, r, min]);
  }
}
for (const [fg, bg, min] of PANEL) rows.push(['panel', fg, bg, ratio(col(light, fg), col(light, bg)), min]);
let worst = Infinity;
for (const [theme, fg, bg, r, min] of rows) {
  worst = Math.min(worst, r / min);
  if (r < min) fail('contrast', `${theme}: ${fg} on ${bg} = ${r.toFixed(2)} (need ${min})`);
}

if (problems.length) {
  console.error(`check failed (${problems.length}):\n  - ${problems.join('\n  - ')}`);
  process.exitCode = 1;
} else {
  console.log(`check ok: ${pages.length} pages, ${rows.length} contrast pairs (tightest margin x${worst.toFixed(2)} of requirement)`);
}
