// Small, dependency-free helpers shared by the build.

/** Marks a string as already-safe HTML. */
export class Raw {
  constructor(s) {
    this.s = s;
  }
  toString() {
    return this.s;
  }
}
export const raw = (s) => new Raw(String(s ?? ''));

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

function toHtml(v) {
  if (v == null || v === false || v === true) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(toHtml).join('');
  return esc(v);
}

/** Tagged template: interpolations are escaped unless they are Raw (or arrays of Raw). */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += toHtml(values[i]) + strings[i + 1];
  return new Raw(out);
}

export const join = (items, sep = '') => raw(items.map(toHtml).join(sep));

/** Tiny inline markup for copy: `code`, **bold**, [[ko:한글]] and [label](url). Everything else is escaped. */
export function md(text) {
  let s = esc(text);
  s = s.replace(/\[\[ko:([^\]]+)\]\]/g, '<span lang="ko">$1</span>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*|#[^)\s]*|mailto:[^)\s]+)\)/g, '<a href="$2">$1</a>');
  return raw(s);
}

/** Replaces {a.b} placeholders using vars. Unknown placeholders are left in place (the check script flags them). */
export function fmt(str, vars) {
  return String(str).replace(/\{([\w.]+)\}/g, (m, key) => {
    const v = key.split('.').reduce((o, k) => (o == null ? o : o[k]), vars);
    return v == null ? m : String(v);
  });
}

const LOCALE = { en: 'en-US', ko: 'ko-KR' };

export function fmtDate(iso, lang, opts = { year: 'numeric', month: 'short', day: 'numeric' }) {
  return new Intl.DateTimeFormat(LOCALE[lang] ?? lang, { timeZone: 'UTC', ...opts }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}

/** Walks two JSON trees and reports every place where their shape differs. */
export function diffShape(a, b, path = '') {
  const problems = [];
  if (Array.isArray(a) !== Array.isArray(b)) return [`${path || '/'}: array vs non-array`];
  if (Array.isArray(a)) {
    if (a.length !== b.length) problems.push(`${path || '/'}: length ${a.length} vs ${b.length}`);
    for (let i = 0; i < Math.min(a.length, b.length); i++) problems.push(...diffShape(a[i], b[i], `${path}[${i}]`));
    return problems;
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object') return [`${path || '/'}: object vs ${typeof b}`];
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in a)) problems.push(`${path}/${k}: missing on the left`);
      else if (!(k in b)) problems.push(`${path}/${k}: missing on the right`);
      else problems.push(...diffShape(a[k], b[k], `${path}/${k}`));
    }
    return problems;
  }
  if (typeof a !== typeof b) problems.push(`${path}: ${typeof a} vs ${typeof b}`);
  return problems;
}

/* ------------------------------------------------------------------ icons */

const stroke = (body, extra = '') =>
  `<svg class="icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${body}</svg>`;

export const icon = {
  arrowRight: raw(stroke('<path d="M5 12h14M13 6l6 6-6 6"/>')),
  arrowDown: raw(stroke('<path d="M12 5v14M6 13l6 6 6-6"/>')),
  arrowUpRight: raw(stroke('<path d="M7 17 17 7M8 7h9v9"/>')),
  check: raw(stroke('<path d="m5 12.5 4.5 4.5L19 7.5"/>')),
  spark: raw(stroke('<path d="M12 3.5l1.9 5.4L19.5 11l-5.6 2.1L12 18.5l-1.9-5.4L4.5 11l5.6-2.1L12 3.5Z"/><path d="M19 17v4M17 19h4"/>')),
  mail: raw(stroke('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7.5 8 6 8-6"/>')),
  download: raw(stroke('<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>')),
  globe: raw(stroke('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>')),
  lock: raw(stroke('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>')),
  menu: raw(stroke('<path d="M4 7h16M4 12h16M4 17h16"/>')),
  close: raw(stroke('<path d="M6 6l12 12M18 6 6 18"/>')),
  sun: raw(stroke('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>')),
  moon: raw(stroke('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>')),
  github: raw(
    '<svg class="icon" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
  ),
};

/** Small glyphs for each product (24px, stroke). */
export const productIcon = {
  'claude-pet': raw(
    stroke(
      '<path d="M5.2 9.4 4.6 4.4l4.6 2.4a8.6 8.6 0 0 1 5.6 0l4.6-2.4-.6 5c1 1.2 1.5 2.7 1.5 4.3 0 3.8-3.6 6.7-8.5 6.7s-8.5-2.9-8.5-6.7c0-1.6.5-3.1 1.5-4.3Z"/><circle cx="9.3" cy="13" r=".9" fill="currentColor" stroke="none"/><circle cx="14.7" cy="13" r=".9" fill="currentColor" stroke="none"/><path d="M10.9 16.2h2.2"/>',
    ),
  ),
  llmwiki: raw(
    stroke(
      '<circle cx="6" cy="7" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="17.4" r="2.7"/><path d="m8.2 7.3 7.6-.9M7.2 9l3.7 6.1M16.9 8.1l-3.6 7.3"/>',
    ),
  ),
  moshim: raw(
    stroke(
      '<circle cx="10" cy="8.6" r="3.5"/><path d="M3.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="m18.6 3.4.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"/>',
    ),
  ),
  instructor: raw(
    stroke(
      '<path d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z"/><path d="M7 12v4.2c0 .8 2.2 2.3 5 2.3s5-1.5 5-2.3V12"/><path d="M21 9.5v5"/>',
    ),
  ),
  'k-factory': raw(
    stroke(
      '<path d="M3.5 20.5v-10l5 3v-3l5 3V8.4h3V4.5h3.5v16h-16.5Z"/><path d="M8 17h1.6M12 17h1.6M16 17h1.6"/>',
    ),
  ),
};
