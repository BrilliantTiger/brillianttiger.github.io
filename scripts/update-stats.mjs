#!/usr/bin/env node
// Refreshes content/stats.json from the public GitHub API.
//
//   npm run stats
//
// Everything on the site that is a number about our public repositories comes from
// this file, so the page never claims more than the git history shows.
// Uses GITHUB_TOKEN / GH_TOKEN if set, otherwise `gh auth token`, otherwise anonymous
// requests (60/hour is enough). On any failure the existing file is left untouched.

import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const site = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));
const OUT = new URL('../content/stats.json', import.meta.url);

function token() {
  for (const k of ['GITHUB_TOKEN', 'GH_TOKEN']) if (process.env[k]) return process.env[k];
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const TOKEN = token();
const headers = {
  accept: 'application/vnd.github+json',
  'user-agent': 'brilliant-tiger-site-stats',
  'x-github-api-version': '2022-11-28',
  ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
};

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${path}`);
  return res.json();
}

async function paginate(path) {
  const all = [];
  for (let page = 1; page < 40; page++) {
    const items = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    all.push(...items);
    if (items.length < 100) break;
  }
  return all;
}

const CLAUDE_TRAILER = /^co-authored-by:\s*claude\b/im;
const day = (iso) => iso.slice(0, 10);

function weekStart(iso) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // Monday
  return d.toISOString().slice(0, 10);
}

try {
  const repos = {};
  const weekly = new Map();

  for (const product of site.products.filter((p) => p.repo)) {
    const [owner, name] = product.repo.split('/');
    const [info, commits, releases] = await Promise.all([
      api(`/repos/${owner}/${name}`),
      paginate(`/repos/${owner}/${name}/commits`),
      paginate(`/repos/${owner}/${name}/releases`),
    ]);
    if (info.private) throw new Error(`${product.repo} is private; refusing to publish its numbers`);

    let claude = 0;
    for (const c of commits) {
      const isClaude = CLAUDE_TRAILER.test(c.commit.message);
      if (isClaude) claude++;
      const w = weekStart(c.commit.author?.date ?? c.commit.committer.date);
      const row = weekly.get(w) ?? { week: w, total: 0, claude: 0 };
      row.total++;
      if (isClaude) row.claude++;
      weekly.set(w, row);
    }

    const published = releases.filter((r) => !r.draft).sort((a, b) => a.published_at.localeCompare(b.published_at));
    repos[product.id] = {
      repo: product.repo,
      stars: info.stargazers_count,
      license: info.license?.spdx_id ?? null,
      createdAt: day(info.created_at),
      commits: commits.length,
      claudeCommits: claude,
      releases: published.length,
      downloads: published.reduce((n, r) => n + r.assets.reduce((m, a) => m + a.download_count, 0), 0),
      firstRelease: published[0] ? { tag: published[0].tag_name, date: day(published[0].published_at) } : null,
      latestRelease: published.at(-1) ? { tag: published.at(-1).tag_name, date: day(published.at(-1).published_at) } : null,
    };
    console.log(`${product.id}: ${commits.length} commits (${claude} with a Claude trailer), ${published.length} releases`);
  }

  // continuous weekly series, zero-filled
  const keys = [...weekly.keys()].sort();
  const series = [];
  for (let t = Date.parse(keys[0]); t <= Date.parse(keys.at(-1)); t += 7 * 864e5) {
    const k = new Date(t).toISOString().slice(0, 10);
    series.push(weekly.get(k) ?? { week: k, total: 0, claude: 0 });
  }

  const commits = Object.values(repos).reduce((n, r) => n + r.commits, 0);
  const claudeCommits = Object.values(repos).reduce((n, r) => n + r.claudeCommits, 0);
  const pet = repos['claude-pet'];
  const spanDays = pet?.firstRelease && pet?.latestRelease
    ? (Date.parse(pet.latestRelease.date) - Date.parse(pet.firstRelease.date)) / 864e5
    : 0;

  const stats = {
    asOf: new Date().toISOString().slice(0, 10),
    repos,
    totals: { commits, claudeCommits, claudePct: Math.round((claudeCommits / commits) * 100) },
    petReleaseSpanWeeks: Math.round(spanDays / 7),
    weekly: series,
  };

  await writeFile(OUT, JSON.stringify(stats, null, 2) + '\n');
  console.log(`wrote content/stats.json  (${claudeCommits}/${commits} = ${stats.totals.claudePct}% co-authored, ${series.length} weeks)`);
} catch (err) {
  console.error(`stats not updated: ${err.message}`);
  process.exitCode = 1;
}
