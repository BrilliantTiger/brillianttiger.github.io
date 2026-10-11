// Inline SVG artwork for the product cards and the commit chart.
// Colours come from CSS classes (see public/assets/styles.css), so everything follows the theme.

import { raw, esc, fmtDate } from './lib.mjs';

const svg = (inner, label = '') =>
  raw(
    `<svg class="art__svg" viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet" ${
      label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'
    } focusable="false">${inner}</svg>`,
  );

/* ---------------------------------------------------------------- llmwiki */

const NODES = {
  H: [300, 130, 11, 'a'],
  a: [232, 82, 7, 'a'],
  b: [362, 72, 8, 'a'],
  c: [392, 152, 7, 'v'],
  d: [332, 206, 9, 'c'],
  e: [240, 178, 7, 'a'],
  f: [170, 128, 9, 'c'],
  g: [108, 78, 6, 'v'],
  h: [96, 186, 7, 'v'],
  i: [178, 226, 5, 'c'],
  j: [432, 96, 5, 'w'],
  k: [440, 212, 6, 'v'],
  l: [270, 36, 5, 'c'],
  m: [58, 132, 5, 'w'],
  n: [150, 38, 5, 'v'],
  o: [402, 34, 4, 'w'],
};
const EDGES = [
  ['H', 'a', 1], ['H', 'b', 1], ['H', 'e', 1], ['H', 'c'], ['H', 'd'], ['a', 'f'], ['e', 'f'], ['f', 'g'], ['f', 'h'],
  ['h', 'i'], ['e', 'i'], ['b', 'j'], ['c', 'j'], ['c', 'k'], ['d', 'k'], ['a', 'l'], ['g', 'n'], ['g', 'm'], ['m', 'h'],
  ['l', 'n'], ['b', 'o'], ['l', 'b'],
];
const DUST = [[40, 50], [76, 230], [130, 160], [210, 252], [214, 118], [286, 246], [352, 128], [374, 244], [456, 150], [462, 52], [330, 24], [196, 60], [24, 190], [420, 178]];

export function artLlmwiki() {
  const edges = EDGES.map(([p, q, hot]) => {
    const [x1, y1] = NODES[p];
    const [x2, y2] = NODES[q];
    return `<line class="w-edge${hot ? ' is-hot' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join('');
  const nodes = Object.values(NODES)
    .map(([x, y, r, tone]) => `<circle class="w-node w-node--${tone}" cx="${x}" cy="${y}" r="${r}"/>`)
    .join('');
  const dust = DUST.map(([x, y]) => `<circle class="w-dust" cx="${x}" cy="${y}" r="1.6"/>`).join('');
  return svg(`${dust}${edges}<circle class="w-ring" cx="300" cy="130" r="24"/>${nodes}`);
}

/* ----------------------------------------------------------------- moshim */

export function artMoshim() {
  return svg(`
    <g class="m-flows">
      <path d="M166 112C198 112 204 60 232 60"/>
      <path d="M166 136H232"/>
      <path d="M166 160C198 160 204 210 232 210"/>
      <path class="is-dash" d="M372 118C362 118 362 60 352 60"/>
      <path class="is-dash" d="M372 128C362 128 362 137 352 137"/>
    </g>
    <g>
      <rect class="m-card" x="34" y="48" width="132" height="176" rx="16"/>
      <circle class="m-acc" cx="100" cy="96" r="25"/>
      <circle class="m-air" cx="150" cy="66" r="4.5"/>
      <rect class="m-line" x="60" y="134" width="80" height="9" rx="4.5"/>
      <rect class="m-dim" x="70" y="151" width="60" height="6" rx="3"/>
      <rect class="m-pill" x="52" y="174" width="30" height="14" rx="7"/>
      <rect class="m-pill" x="88" y="174" width="38" height="14" rx="7"/>
      <rect class="m-pill" x="132" y="174" width="24" height="14" rx="7"/>
      <rect class="m-dim" x="52" y="200" width="96" height="6" rx="3"/>
    </g>
    <g>
      <rect class="m-card" x="232" y="26" width="118" height="68" rx="9"/>
      <circle class="m-dim" cx="244" cy="37" r="2.4"/><circle class="m-dim" cx="253" cy="37" r="2.4"/><circle class="m-dim" cx="262" cy="37" r="2.4"/>
      <rect class="m-acc" x="244" y="50" width="34" height="30" rx="5"/>
      <rect class="m-line" x="288" y="52" width="48" height="7" rx="3.5"/>
      <rect class="m-dim" x="288" y="65" width="36" height="5" rx="2.5"/>
      <rect class="m-dim" x="288" y="75" width="42" height="5" rx="2.5"/>
    </g>
    <g>
      <rect class="m-card" x="232" y="106" width="118" height="62" rx="7"/>
      <rect class="m-line" x="246" y="120" width="62" height="8" rx="4"/>
      <rect class="m-dim" x="246" y="136" width="84" height="5" rx="2.5"/>
      <rect class="m-dim" x="246" y="147" width="70" height="5" rx="2.5"/>
      <rect class="m-acc" x="318" y="118" width="20" height="14" rx="3"/>
    </g>
    <g>
      <rect class="m-card" x="232" y="180" width="38" height="68" rx="9"/>
      <rect class="m-dim" x="244" y="186" width="14" height="3" rx="1.5"/>
      <path class="m-acc" d="M246 208v14l12-7z"/>
      <rect class="m-dim" x="280" y="200" width="40" height="6" rx="3"/>
      <rect class="m-dim" x="280" y="214" width="28" height="6" rx="3"/>
    </g>
    <g>
      <rect class="m-card" x="372" y="104" width="86" height="34" rx="17"/>
      <circle class="m-stroke" cx="390" cy="120" r="6"/>
      <path class="m-stroke" d="m395 125 5 5"/>
      <rect class="m-dim" x="410" y="116" width="36" height="6" rx="3"/>
      <rect class="m-card" x="372" y="148" width="86" height="26" rx="9"/>
      <circle class="m-acc" cx="386" cy="161" r="6"/><rect class="m-dim" x="398" y="156" width="48" height="5" rx="2.5"/><rect class="m-dim" x="398" y="164" width="32" height="4" rx="2"/>
      <rect class="m-card" x="372" y="180" width="86" height="26" rx="9"/>
      <circle class="m-pill" cx="386" cy="193" r="6"/><rect class="m-dim" x="398" y="188" width="44" height="5" rx="2.5"/><rect class="m-dim" x="398" y="196" width="30" height="4" rx="2"/>
    </g>`);
}

/* -------------------------------------------------------------- k-factory */

export function artKFactory() {
  return svg(`
    <defs>
      <pattern id="kf-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path class="k-grid" d="M24 0H0V24"/></pattern>
      <pattern id="kf-grid-big" width="120" height="120" patternUnits="userSpaceOnUse"><path class="k-grid k-grid--big" d="M120 0H0V120"/></pattern>
    </defs>
    <rect width="480" height="270" fill="url(#kf-grid)"/>
    <rect width="480" height="270" fill="url(#kf-grid-big)"/>
    <g class="k-flows">
      <path d="M290 160C330 160 340 72 376 72"/>
      <path d="M290 170C336 170 348 150 380 150"/>
      <path d="M290 180C330 180 340 226 376 226"/>
    </g>
    <g class="k-line">
      <path d="M100 210V104l45 22v-22l45 22v-22l45 22v-22l55 28v78z"/>
      <path d="M250 118V62h14v66"/>
      <path class="k-smoke" d="M257 52c-8-6 8-12 0-20M268 48c-6-5 6-10 0-16"/>
      <rect x="118" y="158" width="22" height="16" rx="1.5"/><rect x="152" y="158" width="22" height="16" rx="1.5"/>
      <rect x="186" y="158" width="22" height="16" rx="1.5"/><rect x="220" y="158" width="22" height="16" rx="1.5"/>
      <rect x="258" y="176" width="24" height="34" rx="1.5"/>
    </g>
    <g class="k-dim">
      <path d="M100 232H290M100 226v12M290 226v12"/>
      <path d="M70 104V210M64 104h12M64 210h12"/>
    </g>
    <g class="k-buyers">
      <circle cx="388" cy="72" r="13"/><circle class="is-fill" cx="388" cy="72" r="3.6"/>
      <circle cx="392" cy="150" r="13"/><circle class="is-fill" cx="392" cy="150" r="3.6"/>
      <circle cx="388" cy="226" r="13"/><circle class="is-fill" cx="388" cy="226" r="3.6"/>
    </g>
    <g transform="rotate(-5 80 40)">
      <rect class="k-stamp" x="28" y="24" width="104" height="30" rx="7"/>
      <text class="k-text" x="80" y="44" text-anchor="middle">PLAN v2.0</text>
    </g>`);
}


/* ------------------------------------------------------- instructor platform */

export function artInstructor() {
  const widths = [52, 64, 44, 58];
  const fills = [64, 46, 72, 30];
  const rows = widths
    .map((w, i) => {
      const y = 102 + i * 30;
      return `<circle class="i-acc" cx="64" cy="${y + 8}" r="8"/><rect class="i-dim" x="80" y="${y + 3}" width="${w}" height="6" rx="3"/><rect class="i-dim2" x="80" y="${y + 13}" width="34" height="4" rx="2"/><rect class="i-track" x="146" y="${y + 5}" width="80" height="7" rx="3.5"/><rect class="i-fill" x="146" y="${y + 5}" width="${fills[i]}" height="7" rx="3.5"/>`;
    })
    .join('');
  return svg(`
    <g class="i-flows">
      <path d="M242 110C255 110 255 104 268 104"/>
      <path class="is-dash" d="M268 194C256 194 252 206 242 206"/>
      <path class="is-dash" d="M380 194H398"/>
    </g>
    <rect class="i-card is-dash" x="36" y="60" width="206" height="172" rx="14"/>
    <rect class="i-line" x="52" y="76" width="64" height="8" rx="4"/>
    <rect class="i-pill" x="176" y="73" width="48" height="14" rx="7"/>
    ${rows}
    <rect class="i-card" x="268" y="60" width="176" height="100" rx="12"/>
    <rect class="i-pill" x="282" y="74" width="58" height="16" rx="8"/>
    <text class="i-tag" x="311" y="85.5" text-anchor="middle">AI DRAFT</text>
    <rect class="i-dim" x="282" y="100" width="140" height="6" rx="3"/>
    <rect class="i-dim" x="282" y="112" width="122" height="6" rx="3"/>
    <rect class="i-dim" x="282" y="124" width="96" height="6" rx="3"/>
    <rect class="i-btn" x="360" y="134" width="72" height="18" rx="9"/>
    <path class="i-check" d="m373 143.5 4 4 8-8"/>
    <rect class="i-card is-dash" x="268" y="178" width="112" height="32" rx="16"/>
    <text class="i-code" x="324" y="198" text-anchor="middle">JOIN · 4K7Q</text>
    <circle class="i-acc2" cx="410" cy="190" r="9"/>
    <path class="i-stroke" d="M396 212c2-9 8-12 14-12s12 3 14 12"/>
    <g transform="rotate(4 398 30)">
      <rect class="i-stamp" x="348" y="16" width="100" height="28" rx="7"/>
      <text class="i-text" x="398" y="34.5" text-anchor="middle">PLAN v1.0</text>
    </g>`);
}

/* ------------------------------------------------------------ commit chart */

const roundTop = (x, y, w, h, r) => {
  r = Math.min(r, w / 2, h);
  return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
};

function drawChart(weekly, copy, lang, { W, H, m, cls }) {
  const plotW = W - m.l - m.r;
  const plotH = H - m.t - m.b;
  const max = Math.max(...weekly.map((w) => w.total), 1);
  const top = Math.max(20, Math.ceil(max / 20) * 20);
  const slot = plotW / weekly.length;
  const bw = Math.min(30, slot * 0.64);
  const y = (v) => m.t + plotH - (v / top) * plotH;
  const monthFmt = (iso) => fmtDate(iso, lang, { month: 'short' });

  const grid = [0, top / 2, top]
    .map(
      (v) =>
        `<line class="c-grid" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/><text class="c-axis" x="${m.l - 7}" y="${y(v) + 4}" text-anchor="end">${v}</text>`,
    )
    .join('');

  let prevMonth = '';
  const bars = weekly
    .map((w, i) => {
      const x = m.l + i * slot + (slot - bw) / 2;
      const other = w.total - w.claude;
      const hClaude = (w.claude / top) * plotH;
      const hOther = (other / top) * plotH;
      const tip = copy.tip
        .replace('{week}', fmtDate(w.week, lang, { month: 'short', day: 'numeric' }))
        .replace('{total}', w.total)
        .replace('{claude}', w.claude);
      let shapes = '';
      if (w.claude > 0 && other > 0) {
        shapes += `<rect class="c-claude" x="${x}" y="${y(w.claude)}" width="${bw}" height="${hClaude}"/>`;
        shapes += `<path class="c-other" d="${roundTop(x, y(w.total), bw, hOther, 3)}"/>`;
      } else if (w.claude > 0) {
        shapes += `<path class="c-claude" d="${roundTop(x, y(w.claude), bw, hClaude, 3)}"/>`;
      } else if (other > 0) {
        shapes += `<path class="c-other" d="${roundTop(x, y(other), bw, hOther, 3)}"/>`;
      }
      const month = monthFmt(w.week);
      let label = '';
      if (month !== prevMonth) {
        label = `<text class="c-axis" x="${x}" y="${H - 8}">${esc(month)}</text>`;
        prevMonth = month;
      }
      return `<g class="c-bar"><title>${esc(tip)}</title><rect class="c-hit" x="${m.l + i * slot}" y="${m.t}" width="${slot}" height="${plotH}"/>${shapes}${label}</g>`;
    })
    .join('');

  return `<svg class="${cls}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(copy.chartAria)}" focusable="false">${grid}${bars}</svg>`;
}

/** Weekly commits as stacked bars: Claude-co-authored (bottom) + other (top). Pure SVG, no JS.
 *  Drawn twice, wide and narrow, so axis text stays readable on phones (CSS swaps them). */
export function commitChart(weekly, copy, lang) {
  return raw(
    drawChart(weekly, copy, lang, { W: 640, H: 236, m: { l: 34, r: 6, t: 12, b: 30 }, cls: 'chart chart--wide' }) +
      drawChart(weekly, copy, lang, { W: 340, H: 232, m: { l: 28, r: 4, t: 10, b: 28 }, cls: 'chart chart--narrow' }),
  );
}
