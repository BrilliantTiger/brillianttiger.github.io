// Static site build. No dependencies:  node src/build.mjs
//   content/*.json  +  public/  ->  dist/
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { diffShape, fmt, fmtDate } from './lib.mjs';
import { renderHome, render404, buildVars, pathFor } from './render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const readJson = async (p) => JSON.parse(await readFile(path.join(ROOT, p), 'utf8'));
const write = async (rel, data) => {
  const file = path.join(DIST, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, String(data));
};

function validate(site, stats, copies) {
  const problems = [];
  const [first, ...rest] = Object.values(copies);
  for (const other of rest) problems.push(...diffShape(first, other).map((p) => `en/ko mismatch ${p}`));
  for (const [lang, t] of Object.entries(copies)) {
    for (const p of site.products) if (!t.products.items[p.id]) problems.push(`${lang}: no copy for product ${p.id}`);
    for (const e of site.timeline) if (!t.progress.items[e.id]) problems.push(`${lang}: no copy for timeline item ${e.id}`);
  }
  if (!stats.repos['claude-pet']?.latestRelease) problems.push('stats.json has no Claude Pet release; run `npm run stats`');
  if (problems.length) throw new Error(`Content problems:\n  - ${problems.join('\n  - ')}`);
}

function llmsTxt(site, t, stats) {
  const v = buildVars(site, stats, 'en');
  const base = site.url;
  const lines = [
    `# ${site.company.name} (${site.company.nameKo})`,
    '',
    `> ${t.meta.description}`,
    '',
    `Founded ${fmtDate(site.company.founded, 'en', { year: 'numeric', month: 'long', day: 'numeric' })} in Korea. AI is part of how we build, and our products are designed to work with AI agents through MCP servers, hooks and open file formats.`,
    '',
    '## Products',
    '',
  ];
  for (const p of site.products) {
    const it = t.products.items[p.id];
    const link = p.links.find((l) => l.key === 'website') ?? p.links.find((l) => l.key === 'github');
    const status = t.status[p.status];
    const head = link ? `[${it.name}](${link.url})` : it.name;
    lines.push(`- ${head} (${status}${p.private ? ', private preview' : ''}): ${fmt(it.tagline, v)} ${fmt(it.summary, v).replace(/`/g, '')}`);
  }
  lines.push(
    '',
    `## Figures (public repositories, as of ${stats.asOf})`,
    '',
    `- Claude Pet: ${v.releases} releases in ${v.weeks} weeks, latest ${v.version}. MIT licensed.`,
    `- ${v.claudeCommits} of ${v.commits} commits in the public claude-pet and llmwiki_json repositories carry an AI co-author trailer (${v.claudePct}%).`,
    `- Moshim's MCP server exposes ${v.moshimTools} tools, ${v.moshimResources} resources and ${v.moshimPrompts} prompts.`,
    '',
    '## Links',
    '',
    `- [Website, English](${base}/)`,
    `- [Website, 한국어](${base}/ko/)`,
    `- [GitHub organization](${site.contact.github})`,
    '',
    '## 한국어 요약',
    '',
    `빛나는 범(Brilliant Tiger)은 AI 네이티브 플랫폼과 소프트웨어를 만드는 대한민국 프로덕트 컴퍼니입니다. 제품은 Claude Pet(출시), llmwiki_json(오픈소스), 모심(프로토타입), K-Factory Hub와 Instructor Platform(기획 중) 다섯 가지입니다.`,
    '',
  );
  return lines.join('\n');
}

export async function build() {
  const t0 = performance.now();
  const site = await readJson('content/site.json');
  const stats = await readJson('content/stats.json');
  const copies = Object.fromEntries(await Promise.all(site.langs.map(async (l) => [l, await readJson(`content/${l}.json`)])));
  validate(site, stats, copies);

  const [markSvg, iconSvg, css, js] = await Promise.all([
    readFile(path.join(ROOT, 'public/assets/logo/logo-mark.svg'), 'utf8'),
    readFile(path.join(ROOT, 'public/assets/logo/logo-icon.svg'), 'utf8'),
    readFile(path.join(ROOT, 'public/assets/styles.css')),
    readFile(path.join(ROOT, 'public/assets/main.js')),
  ]);
  const version = createHash('sha1').update(css).update(js).digest('hex').slice(0, 8);

  await rm(DIST, { recursive: true, force: true });
  await cp(path.join(ROOT, 'public'), DIST, { recursive: true });

  const ctxFor = (lang) => ({
    lang,
    t: copies[lang],
    site,
    stats,
    vars: buildVars(site, stats, lang),
    version,
    logoMark: markSvg.trim(),
    logoIcon: iconSvg.trim(),
  });

  for (const lang of site.langs) {
    await write(`${pathFor(site, lang).slice(1)}index.html`, renderHome(ctxFor(lang)));
  }
  await write('404.html', render404(ctxFor(site.defaultLang)));

  const urls = site.langs.map((l) => ({ lang: l, loc: site.url + pathFor(site, l) }));
  await write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${stats.asOf}</lastmod>\n${urls
            .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.loc}"/>`)
            .join('\n')}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${site.url + pathFor(site, site.defaultLang)}"/>\n  </url>`,
      )
      .join('\n')}\n</urlset>\n`,
  );
  await write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
  await write('llms.txt', llmsTxt(site, copies.en, stats));
  await write('CNAME', new URL(site.url).hostname + '\n');
  await write('.nojekyll', '');
  await write(
    'site.webmanifest',
    JSON.stringify(
      {
        name: site.company.name,
        short_name: site.company.name,
        start_url: '/',
        background_color: '#FBF8F2',
        theme_color: '#FF6A13',
        icons: [
          { src: '/assets/logo/logo-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/assets/logo/logo-icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      null,
      2,
    ) + '\n',
  );

  console.log(`built ${site.langs.length} pages in ${Math.round(performance.now() - t0)} ms  (assets v=${version}) -> dist/`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  build().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
