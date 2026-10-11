// Page templates. All copy comes from content/*.json; all numbers from content/site.json + stats.json.

import { html, raw, join, md, fmt, fmtDate, icon, productIcon, esc } from './lib.mjs';
import { artLlmwiki, artMoshim, artKFactory, artInstructor, commitChart } from './art.mjs';

/* ------------------------------------------------------------------ utils */

export const pathFor = (site, lang) => (lang === site.defaultLang ? '/' : `/${lang}/`);

export function buildVars(site, stats, lang) {
  const pet = stats.repos['claude-pet'];
  const wiki = stats.repos.llmwiki;
  const moshim = site.products.find((p) => p.id === 'moshim').facts;
  const month = { year: 'numeric', month: 'short' };
  return {
    asOf: fmtDate(stats.asOf, lang),
    year: Number(stats.asOf.slice(0, 4)),
    products: site.products.length,
    ossCount: site.products.filter((p) => p.license).length,
    releases: pet.releases,
    weeks: stats.petReleaseSpanWeeks,
    version: pet.latestRelease.tag,
    commits: stats.totals.commits,
    claudeCommits: stats.totals.claudeCommits,
    claudePct: stats.totals.claudePct,
    petSince: fmtDate(pet.firstRelease.date, lang, month),
    wikiSince: fmtDate(wiki.createdAt, lang, month),
    moshimTools: moshim.tools,
    moshimResources: moshim.resources,
    moshimPrompts: moshim.prompts,
    moshimTests: moshim.tests,
    moshimPilot: moshim.pilotMembers,
    moshimKickoff: fmtDate(moshim.kickoff, lang),
  };
}

const withClass = (svg, cls) =>
  raw(svg.replace(/ role="img" aria-label="[^"]*"| aria-hidden="true"/g, '').replace('<svg ', `<svg class="${cls}" aria-hidden="true" focusable="false" `));
const T = (c, s) => md(fmt(s, c.vars));
const chip = (status, text) => html`<span class="chip chip--${status}"><i aria-hidden="true"></i>${text}</span>`;
const newTab = (c) => html`<span class="sr-only"> ${c.t.a11y.opensNewTab}</span>`;

const mailto = (c, subject) =>
  c.site.contact.email ? `mailto:${c.site.contact.email}?subject=${encodeURIComponent(subject)}` : '';

function sectionHead(id, eyebrow, title, lede) {
  return html`<header class="section__head">
    <p class="eyebrow">${eyebrow}</p>
    <h2 id="${id}">${title}</h2>
    ${lede ? html`<p class="lede">${lede}</p>` : ''}
  </header>`;
}

/* ------------------------------------------------------------------- head */

const THEME_INIT = `(function(){var d=document.documentElement;d.classList.add('js');try{var s=localStorage.getItem('bt-theme');if(s==='light'||s==='dark')d.setAttribute('data-theme',s)}catch(e){}})()`;

function jsonLd(c) {
  const { site, t, lang } = c;
  const base = site.url;
  const pet = site.products.find((p) => p.id === 'claude-pet');
  const wiki = site.products.find((p) => p.id === 'llmwiki');
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${base}/#org`,
        name: site.company.name,
        legalName: site.company.legalName,
        alternateName: [site.company.nameKo],
        url: `${base}/`,
        logo: `${base}/assets/logo/logo-icon-512.png`,
        foundingDate: site.company.founded,
        foundingLocation: { '@type': 'Country', name: site.company.countryCode },
        description: t.meta.description,
        sameAs: [site.contact.github],
        ...(site.contact.email ? { email: site.contact.email } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: `${base}/`,
        name: site.company.name,
        inLanguage: site.langs,
        publisher: { '@id': `${base}/#org` },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Claude Pet',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'macOS 12+, Windows 10/11',
        url: (pet.links.find((l) => l.key === 'website') ?? pet.links.find((l) => l.key === 'github')).url,
        license: 'https://opensource.org/license/mit',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${base}/#org` },
      },
      {
        '@type': 'SoftwareSourceCode',
        name: 'llmwiki_json',
        codeRepository: wiki.links.find((l) => l.key === 'github').url,
        license: 'https://opensource.org/license/mit',
        programmingLanguage: 'Python',
        publisher: { '@id': `${base}/#org` },
      },
    ],
  };
  return raw(`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`);
}

function head(c, { title, description, path, noindex = false, withLd = false }) {
  const { site, lang, t } = c;
  const canonical = site.url + path;
  const og = `${site.url}/assets/og/og-${lang}.png`;
  return html`<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
${noindex ? html`<meta name="robots" content="noindex">` : ''}
<link rel="canonical" href="${canonical}">
${site.langs.map((l) => html`<link rel="alternate" hreflang="${l}" href="${site.url + pathFor(site, l)}">\n`)}<link rel="alternate" hreflang="x-default" href="${site.url + pathFor(site, site.defaultLang)}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#FBF8F2" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E0B08" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.company.name}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="${t.ogLocale}">
${site.langs.filter((l) => l !== lang).map((l) => html`<meta property="og:locale:alternate" content="${l === 'ko' ? 'ko_KR' : 'en_US'}">\n`)}<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${t.meta.ogAlt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${og}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<script>${raw(THEME_INIT)}</script>
<link rel="preload" href="/assets/fonts/pretendard/woff2-dynamic-subset/PretendardVariable.subset.91.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts/pretendard/pretendardvariable-dynamic-subset.css">
<link rel="stylesheet" href="/assets/styles.css?v=${c.version}">
${withLd ? jsonLd(c) : ''}
</head>`;
}

/* ---------------------------------------------------------------- chrome */

function nav(c) {
  const { t, site, lang } = c;
  const other = site.langs.find((l) => l !== lang);
  const home = pathFor(site, lang);
  return html`<header class="nav" data-nav>
  <div class="wrap nav__inner">
    <a class="brand" href="${home}" aria-label="${t.a11y.home}">
      <span class="brand__mark">${withClass(c.logoIcon, 'brand__icon')}</span>
      <span class="brand__text"><span class="brand__name">Brilliant Tiger</span><span class="brand__ko" lang="ko">${site.company.nameKo}</span></span>
    </a>
    <nav class="nav__links" id="nav-links" aria-label="${t.a11y.primaryNav}">
      ${t.nav.map((n) => html`<a href="#${n.id}" data-spy="${n.id}">${n.label}</a>`)}
      <a class="nav__links-cta" href="#contact">${t.cta.contact}</a>
    </nav>
    <div class="nav__tools">
      <a class="nav__lang" href="${pathFor(site, other)}" hreflang="${t.switch.hreflang}" lang="${t.switch.hreflang}" title="${t.switch.title}" aria-label="${t.switch.title}">${icon.globe}<span>${t.switch.label}</span></a>
      <button class="iconbtn theme-toggle" type="button" aria-label="${t.a11y.theme}" data-theme-toggle>
        <span class="theme-toggle__sun">${icon.sun}</span><span class="theme-toggle__moon">${icon.moon}</span>
      </button>
      <a class="btn btn--small btn--primary nav__cta" href="#contact">${t.cta.contact}</a>
      <button class="iconbtn nav__menu" type="button" aria-label="${t.a11y.menu}" aria-expanded="false" aria-controls="nav-links" data-menu-toggle>
        <span class="nav__menu-open">${icon.menu}</span><span class="nav__menu-close">${icon.close}</span>
      </button>
    </div>
  </div>
</header>`;
}

function footer(c) {
  const { t, site, vars, lang } = c;
  const other = site.langs.find((l) => l !== lang);
  return html`<footer class="footer">
  <div class="wrap footer__grid">
    <div class="footer__brand">
      <a class="brand brand--footer" href="${pathFor(site, lang)}" aria-label="${t.a11y.home}">
        <span class="brand__mark">${withClass(c.logoMark, 'brand__tiger')}</span>
        <span class="brand__text"><span class="brand__name">Brilliant Tiger</span><span class="brand__ko" lang="ko">${site.company.nameKo}</span></span>
      </a>
      <p class="footer__copy">${fmt(t.footer.copyright, vars)}</p>
    </div>
    <div class="footer__links">
      ${site.products.flatMap((p) => p.links.filter((l) => l.key === 'github' || l.key === 'website').slice(0, 1).map((l) => html`<a href="${l.url}" target="_blank" rel="noopener">${t.products.items[p.id].name}${newTab(c)}</a>`))}
      <a href="${site.contact.github}" target="_blank" rel="noopener">GitHub${newTab(c)}</a>
      <a href="${pathFor(site, other)}" hreflang="${t.switch.hreflang}" lang="${t.switch.hreflang}">${t.switch.label}</a>
    </div>
  </div>
</footer>`;
}

/* ------------------------------------------------------------------- hero */

function hero(c) {
  const { t, vars, site } = c;
  const board = site.products.map((p) => {
    const it = t.products.items[p.id];
    return html`<li>
      <a class="board__row" href="#p-${p.id}">
        <span class="board__icon board__icon--${p.hue}">${productIcon[p.id]}</span>
        <span class="board__text"><span class="board__name">${it.name}</span><span class="board__short">${fmt(it.short, vars)}</span></span>
        ${chip(p.status, t.status[p.status])}
      </a>
    </li>`;
  });
  return html`<section class="hero" aria-labelledby="hero-title">
  <div class="hero__bg" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="wrap hero__grid">
    <div class="hero__copy">
      <p class="eyebrow">${t.hero.eyebrow}</p>
      <h1 id="hero-title" class="hero__title">${join(t.hero.title.map((line, i) => html`<span class="hero__line${i === 1 ? ' hero__line--mark' : ''}">${line}</span>`), ' ')}</h1>
      <p class="hero__lede">${T(c, t.hero.lede)}</p>
      <div class="hero__cta">
        <a class="btn btn--primary btn--lg" href="#products">${t.hero.ctaPrimary}${icon.arrowDown}</a>
        <a class="btn btn--ghost btn--lg" href="#ai">${t.hero.ctaSecondary}</a>
      </div>
    </div>
    <aside class="stage" aria-label="${t.hero.board.title}">
      <div class="stage__top" aria-hidden="true">
        <span class="stage__glow"></span>
        ${withClass(c.logoMark, 'stage__mark')}
      </div>
      <div class="stage__head"><span>${t.hero.board.title}</span><span>${fmt(t.hero.board.asOf, vars)}</span></div>
      <ul class="board">${board}</ul>
    </aside>
  </div>
  <div class="wrap">
    <dl class="stats">${t.hero.stats.map((s) => html`<div class="stat"><dt>${T(c, s.label)}</dt><dd>${fmt(s.value, vars)}</dd></div>`)}</dl>
    <p class="stats__note">${fmt(t.hero.statsNote, vars)}</p>
  </div>
</section>`;
}

/* --------------------------------------------------------------- products */

function art(c, p, it) {
  const tag = p.private ? html`<span class="art__tag">${icon.lock}${c.t.products.privateTitle}</span>` : '';
  switch (p.id) {
    case 'claude-pet':
      return html`<div class="art art--${p.hue}" role="img" aria-label="${it.imageAlt}">
        <div class="petart" aria-hidden="true">
          <div class="petpill">
            <p class="petpill__a"><span>${it.pill.session}</span> <b>11%</b> <i>·</i> <span>${it.pill.weekly}</span> <b>21%</b> <i>·</i> <span>Fable</span> <b>38%</b></p>
            <p class="petpill__b">${it.pill.reset}</p>
          </div>
          <img class="petart__cat" src="${p.image}" width="132" height="210" alt="" loading="lazy" decoding="async">
        </div>
      </div>`;
    case 'llmwiki':
      return html`<div class="art art--${p.hue}">${artLlmwiki()}</div>`;
    case 'moshim':
      return html`<div class="art art--${p.hue}">${artMoshim()}${tag}</div>`;
    case 'instructor':
      return html`<div class="art art--${p.hue}">${artInstructor()}${tag}</div>`;
    default:
      return html`<div class="art art--${p.hue}">${artKFactory()}${tag}</div>`;
  }
}

const LINK_ICON = { website: icon.globe, github: icon.github, download: icon.download };

function extra(c, p, it) {
  const { t, vars } = c;
  if (it.sides) {
    return html`<div class="sides">${it.sides.map((s) => html`<div class="side"><h4>${s.title}</h4><p>${s.text}</p></div>`)}</div>`;
  }
  if (it.steps) {
    return html`<div class="steps">
      <p class="card__label">${it.stepsLabel}</p>
      <ol class="steps__list">${it.steps.map((s, i) => html`<li class="step${i < 3 ? ' is-next' : ''}"><span class="step__id">${s.id}</span><span class="step__label">${s.label}</span><span class="step__span">${s.span}</span></li>`)}</ol>
      <p class="steps__note">${it.stepsNote}</p>
    </div>`;
  }
  if (it.docs) {
    return html`<p class="works"><span>${it.docsLabel}</span>${it.docs.map((d) => html`<b>${d}</b>`)}</p>`;
  }
  if (p.works) {
    return html`<p class="works"><span>${t.products.labels.works}</span>${p.works.map((w) => html`<b>${w}</b>`)}</p>`;
  }
  return '';
}

function productCard(c, p) {
  const { t, vars } = c;
  const it = t.products.items[p.id];
  const links = p.links.map(
    (l) => html`<a class="link" href="${l.url}" target="_blank" rel="noopener">${LINK_ICON[l.key]}<span>${t.products.links[l.key]}</span>${newTab(c)}</a>`,
  );
  const stackLabel = p.stackKind === 'planned' ? t.products.labels.plannedStack : t.products.labels.stack;
  const email = mailto(c, `${it.name}`);
  return html`<article class="card card--${p.hue}${p.wide ? ' card--wide' : ''}" id="p-${p.id}" data-reveal>
  ${art(c, p, it)}
  <div class="card__body">
    <header class="card__head">
      <h3 class="card__name">${it.name}${it.nameNote ? html` <span class="card__note" ${/[가-힣]/.test(it.nameNote) ? raw('lang="ko"') : ''}>${it.nameNote}</span>` : ''}</h3>
      ${chip(p.status, t.status[p.status])}
    </header>
    <p class="card__tag">${it.tagline}</p>
    <p class="card__sum">${T(c, it.summary)}</p>
    ${extra(c, p, it)}
    ${it.bulletsLabel ? html`<p class="card__label">${it.bulletsLabel}</p>` : ''}
    <ul class="ticks">${it.bullets.map((b) => html`<li>${icon.check}<span>${T(c, b)}</span></li>`)}</ul>
    <p class="card__meta">${fmt(it.meta, vars)}</p>
    <div class="stack"><span class="stack__label">${stackLabel}</span><ul class="tags">${p.stack.map((s) => html`<li>${s}</li>`)}</ul></div>
    ${links.length || p.private
      ? html`<div class="card__actions">
          ${links}
          ${p.private ? html`<p class="card__private">${icon.lock}<span>${it.privateNote}</span></p>` : ''}
          ${p.private && email ? html`<a class="link" href="${email}">${icon.mail}<span>${t.contact.email}</span></a>` : ''}
        </div>`
      : ''}
  </div>
</article>`;
}

function products(c) {
  const { t, site } = c;
  return html`<section class="section" id="products" aria-labelledby="products-title">
  <div class="wrap">
    ${sectionHead('products-title', t.products.eyebrow, t.products.title, t.products.lede)}
    <div class="cards">${site.products.map((p) => productCard(c, p))}</div>
  </div>
</section>`;
}

/* --------------------------------------------------------------------- ai */

function aiSection(c) {
  const { t, vars, stats, lang } = c;
  const k = t.ai;
  return html`<section class="section section--dark" id="ai" aria-labelledby="ai-title">
  <div class="wrap">
    ${sectionHead('ai-title', k.eyebrow, k.title, k.lede)}
    <div class="bento">
      <article class="tile tile--a" data-reveal>
        <h3 class="tile__title">${k.a.title}</h3>
        <div class="bigstat">
          <span class="bigstat__n">${vars.claudePct}<small>%</small></span>
          <p class="bigstat__l">${T(c, k.a.statLabel)}</p>
        </div>
        <figure class="chartfig">
          <figcaption class="chartfig__top">
            <span>${k.a.chartNote}</span>
            <span class="legend"><i class="sw sw--claude"></i>${k.a.legendClaude}<i class="sw sw--other"></i>${k.a.legendOther}</span>
          </figcaption>
          ${commitChart(stats.weekly, k.a, lang)}
        </figure>
        <p class="tile__foot">${T(c, k.a.footnote)}</p>
      </article>

      <article class="tile tile--b" data-reveal>
        <h3 class="tile__title">${k.b.title}</h3>
        <p class="tile__text">${T(c, k.b.text)}</p>
        <ul class="counts">${k.b.counts.map((n) => html`<li><b>${fmt(n.n, vars)}</b><span>${n.l}</span></li>`)}</ul>
        <div class="chat" role="group" aria-label="${k.b.caption}">
          <p class="msg msg--user">${k.b.user}</p>
          <p class="msg msg--tools"><code>add_career</code>${icon.arrowRight}<code>publish</code></p>
          <p class="msg msg--bot">${k.b.assistant}</p>
        </div>
        <p class="tile__foot">${k.b.caption}</p>
      </article>

      <article class="tile tile--c" data-reveal>
        <h3 class="tile__title">${k.c.title}</h3>
        <p class="tile__text">${T(c, k.c.text)}</p>
        <ol class="flow">${k.c.flow.map((s, i) => html`<li class="${i === k.c.flow.length - 1 ? 'is-last' : ''}">${s}</li>`)}</ol>
      </article>

      <article class="tile tile--d" data-reveal>
        <h3 class="tile__title">${k.d.title}</h3>
        <p class="tile__text">${T(c, k.d.text)}</p>
        <ul class="chips">${k.d.chips.map((s) => html`<li>${s}</li>`)}</ul>
      </article>

      <article class="tile tile--e" data-reveal>
        <span class="tile__spark" aria-hidden="true">${icon.spark}</span>
        <div><h3 class="tile__title">${k.e.title}</h3><p class="tile__text">${T(c, k.e.text)}</p></div>
      </article>
    </div>
  </div>
</section>`;
}

/* --------------------------------------------------------------- progress */

function progress(c) {
  const { t, site, lang } = c;
  const pg = t.progress;
  const label = (id) => (id === 'company' ? pg.company : t.products.items[id].name);
  const hue = (id) => (id === 'company' ? 'tiger' : site.products.find((p) => p.id === id).hue);
  return html`<section class="section" id="progress" aria-labelledby="progress-title">
  <div class="wrap progress">
    <div class="progress__side">
      ${sectionHead('progress-title', pg.eyebrow, pg.title, pg.lede)}
      <aside class="next" data-reveal>
        <h3 class="next__title">${pg.next.title}</h3>
        <ul>${pg.next.items.map((n) => html`<li><span class="dot dot--${hue(n.product)}" aria-hidden="true"></span><div><b>${label(n.product)}</b><p>${T(c, n.text)}</p></div></li>`)}</ul>
      </aside>
    </div>
    <ol class="timeline">${site.timeline.map((e) => {
      const it = pg.items[e.id];
      return html`<li class="tl tl--${hue(e.product)}" data-reveal>
        <time class="tl__date" datetime="${e.date}">${e.date}</time>
        <div class="tl__body">
          <span class="tl__tag">${label(e.product)}</span>
          <h3 class="tl__title">${it.title}</h3>
          <p>${T(c, it.text)}</p>
        </div>
      </li>`;
    })}</ol>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ about */

function about(c) {
  const { t, site, lang } = c;
  const a = t.about;
  const ko = (s) => html`<span lang="ko">${s}</span>`;
  const company = lang === 'ko' ? html`${ko(site.company.nameKo)} (${site.company.name})` : html`${site.company.name} (${ko(site.company.nameKo)})`;
  const names = join(site.products.map((p) => html`<span class="nb">${t.products.items[p.id].name}</span>`), ' · ');
  const founded = fmtDate(site.company.founded, lang, { year: 'numeric', month: 'long', day: 'numeric' });
  return html`<section class="section section--tint" id="about" aria-labelledby="about-title">
  <div class="wrap about">
    <div class="about__main" data-reveal>
      ${sectionHead('about-title', a.eyebrow, a.title, '')}
      <p class="about__text">${T(c, a.text)}</p>
    </div>
    <div class="about__side">
      <dl class="facts" data-reveal>
        <div><dt>${a.labels.company}</dt><dd>${company}</dd></div>
        <div><dt>${a.labels.founded}</dt><dd>${founded}</dd></div>
        <div><dt>${a.labels.location}</dt><dd>${a.values.location}</dd></div>
        <div><dt>${a.labels.focus}</dt><dd>${a.values.focus}</dd></div>
        <div><dt>${a.labels.products}</dt><dd>${names}</dd></div>
      </dl>
      <aside class="namenote" data-reveal>
        <h3>${T(c, a.nameNote.title)}</h3>
        <p>${T(c, a.nameNote.text)}</p>
      </aside>
    </div>
  </div>
</section>`;
}

/* ---------------------------------------------------------------- contact */

function contact(c) {
  const { t, site } = c;
  const k = t.contact;
  const email = site.contact.email;
  return html`<section class="section section--cta" id="contact" aria-labelledby="contact-title">
  <div class="wrap cta">
    <div class="cta__copy">
      <p class="eyebrow">${k.eyebrow}</p>
      <h2 id="contact-title" class="cta__title">${k.title}</h2>
      <p class="cta__text">${k.text}</p>
    </div>
    <div class="cta__actions">
      ${email ? html`<a class="btn btn--primary btn--lg" href="mailto:${email}">${icon.mail}${k.email}</a>` : ''}
      <a class="btn ${email ? 'btn--ghost-dark' : 'btn--primary'} btn--lg" href="${site.contact.github}" target="_blank" rel="noopener">${icon.github}${k.github}${newTab(c)}</a>
      ${email ? html`<p class="cta__mail mono">${email}</p>` : ''}
    </div>
  </div>
</section>`;
}

/* ------------------------------------------------------------------- page */

export function renderHome(c) {
  const { t, lang, site } = c;
  return html`<!doctype html>
<html lang="${t.htmlLang}">
${head(c, { title: t.meta.title, description: t.meta.description, path: pathFor(site, lang), withLd: true })}
<body>
<a class="skip" href="#main">${t.a11y.skip}</a>
${nav(c)}
<main id="main">
${hero(c)}
${products(c)}
${aiSection(c)}
${progress(c)}
${about(c)}
${contact(c)}
</main>
${footer(c)}
<script src="/assets/main.js?v=${c.version}" defer></script>
</body>
</html>
`;
}

export function render404(c) {
  const { t, site, lang } = c;
  return html`<!doctype html>
<html lang="${t.htmlLang}">
${head(c, { title: `${t.notFound.title} — Brilliant Tiger`, description: t.notFound.text, path: '/404.html', noindex: true })}
<body class="body--404">
<main class="nf" id="main">
  <a class="brand" href="${pathFor(site, lang)}" aria-label="${t.a11y.home}">
    <span class="brand__mark">${withClass(c.logoIcon, 'brand__icon')}</span>
    <span class="brand__text"><span class="brand__name">Brilliant Tiger</span><span class="brand__ko" lang="ko">${site.company.nameKo}</span></span>
  </a>
  <p class="nf__code mono">404</p>
  <h1 class="nf__title">${t.notFound.title}</h1>
  <p class="nf__text">${t.notFound.text}</p>
  <a class="btn btn--primary btn--lg" href="${pathFor(site, lang)}">${t.notFound.back}${icon.arrowRight}</a>
</main>
<script src="/assets/main.js?v=${c.version}" defer></script>
</body>
</html>
`;
}
