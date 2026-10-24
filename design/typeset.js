// Free wireframe + type layer for statics (Design System v3, pass 6 and the code-type route).
// node typeset.js <spec.json> <out-dir>
//   writes <name>.png (the ad at full size), <name>-feed.png (100% + feed-size preview on light and dark feeds)
//   and prints a check report: overflow, size floors, margins, overlap with the product, contrast.
// mode "wireframe": grey product box on the ground colour. mode "overlay": transparent PNG to lay over a plate.
// "plate": optional path to a rendered scene; it is drawn under the type so the result can be judged as a finished ad.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SHELL = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const FONTS = path.join(__dirname, 'fonts');
const [, , specPath, outArg] = process.argv;
if (!specPath || !outArg) { console.error('usage: node typeset.js <spec.json> <out-dir>'); process.exit(1); }
const outDir = path.resolve(outArg || '.');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const name = spec.name || path.basename(specPath, '.json');
const [W, H] = spec.canvas || [1080, 1080];
const C = Object.assign({ ground: '#F2EDE4', text: '#111111', accent: '#1B2A4A', hair: '#B08D3C' }, spec.colors);
const col = (v) => (v && C[v]) || v;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const MARGIN = spec.margins || (H > W ? { l: 64, r: 64, t: 72, b: 96 } : { l: 60, r: 60, t: 60, b: 60 });

const face = [600, 700, 800].map((w) => `@font-face{font-family:Brand;font-weight:${w};src:url("file://${FONTS}/Montserrat-${w}.ttf")}`).join('');

/* Each element is absolutely placed; text blocks get a fixed width so overflow is measurable. */
function el(e, i) {
  const base = `position:absolute;left:${e.x}px;top:${e.y}px;`;
  if (e.type === 'box') {
    return `<div data-k="box" data-i="${i}" style="${base}width:${e.w}px;height:${e.h}px;background:#c9c9c9;border:3px dashed #8a8a8a;display:flex;align-items:center;justify-content:center;font:700 34px Brand;color:#666">${esc(e.label || 'PRODUCT')}</div>`;
  }
  const size = e.size || 48;
  const lh = e.lh || (size >= 90 ? 1.07 : 1.2);
  const txt = esc(e.text).replace(/\n/g, '<br>').replace(/\*(.+?)\*/g, `<span style="color:${col('accent')}">$1</span>`);
  if (e.type === 'pill') {
    const padX = Math.round(size * 0.8), hgt = Math.round(size * 1.7);
    return `<div data-k="text" data-i="${i}" data-size="${size}" data-bg="${col(e.bg || 'accent')}" data-color="${col(e.color || '#FFFFFF')}" style="${base}height:${hgt}px;padding:0 ${padX}px;border-radius:${e.radius || Math.round(hgt / 2)}px;background:${col(e.bg || 'accent')};color:${col(e.color || '#FFFFFF')};font:${e.weight || 700} ${size}px/1 Brand;display:flex;align-items:center;white-space:nowrap">${txt}</div>`;
  }
  const to = e.to ? ` data-to="${e.to.join(',')}"` : '';
  return `<div data-k="text" data-i="${i}"${to} data-size="${size}" data-w="${e.w}" data-maxlines="${e.maxLines || ''}" data-color="${col(e.color || 'text')}" style="${base}width:${e.w}px;color:${col(e.color || 'text')};font:${e.weight || (size >= 90 ? 800 : 600)} ${size}px/${lh} Brand;text-align:${e.align || 'left'};letter-spacing:${size >= 90 ? '-0.01em' : '0'}"><span class="t">${txt}</span></div>`;
}

/* Hairlines run from the measured edge of the fact's text to the point it names, drawn after fonts load. */
const hairlines = () => `<svg id="hl" width="${W}" height="${H}" style="position:absolute;left:0;top:0"></svg>`;

function page({ transparent }) {
  const ground = transparent ? 'transparent' : spec.plate ? `url("file://${path.resolve(spec.plate)}") center/cover` : col('ground');
  const showBoxes = !transparent && !spec.plate;
  const els = (spec.elements || []).map((e, i) => (e.type === 'box' && !showBoxes ? '' : el(e, i))).join('');
  return `<!doctype html><meta charset="utf-8"><style>${face}html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:${transparent ? 'transparent' : col('ground')}}
#c{position:relative;width:${W}px;height:${H}px;background:${ground}}</style><div id="c">${hairlines()}${els}</div>
<script>
// Measure after fonts load and write the report into the DOM for --dump-dom.
document.fonts.ready.then(() => {
  const out = [], NS = 'http://www.w3.org/2000/svg', svg = document.getElementById('hl');
  for (const n of document.querySelectorAll('[data-to]')) {
    const [tx, ty] = n.dataset.to.split(',').map(Number), t = n.querySelector('.t').getBoundingClientRect();
    const toRight = tx > t.left + t.width / 2, lh = parseFloat(getComputedStyle(n).lineHeight);
    const ln = document.createElementNS(NS, 'line');
    const a = { x1: toRight ? t.right + 14 : t.left - 14, y1: t.top + lh / 2, x2: tx, y2: ty, stroke: '${col('hair')}', 'stroke-width': 3, 'stroke-linecap': 'round' };
    for (const k in a) ln.setAttribute(k, a[k]);
    svg.appendChild(ln);
  }
  const boxes = [...document.querySelectorAll('[data-k=box]')].map(b => b.getBoundingClientRect());
  for (const n of document.querySelectorAll('[data-k=text]')) {
    const r = n.getBoundingClientRect(), size = +n.dataset.size;
    const lines = Math.round(r.height / (parseFloat(getComputedStyle(n).lineHeight) || size));
    const ink = (n.querySelector('.t') || n).getBoundingClientRect();
    out.push({ i: +n.dataset.i, size, ink: [ink.left, ink.top, ink.right, ink.bottom].map(Math.round), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), lines,
      overflowX: n.scrollWidth > Math.ceil(r.width) + 1, maxLines: +n.dataset.maxlines || null, color: n.dataset.color, bg: n.dataset.bg || null,
      hitsProduct: boxes.some(b => !(r.right < b.left || r.left > b.right || r.bottom < b.top || r.top > b.bottom)) });
  }
  const pre = document.createElement('pre'); pre.id = 'report'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
});
</script>`;
}

function shot(html, file, transparent) {
  const tmp = path.join(outDir, `.${name}-${transparent ? 't' : 'o'}.html`);
  fs.writeFileSync(tmp, html);
  const args = ['--no-sandbox', '--allow-file-access-from-files', '--hide-scrollbars', `--window-size=${W},${H}`, '--virtual-time-budget=3000'];
  if (transparent) args.push('--default-background-color=00000000');
  execFileSync(SHELL, [...args, `--screenshot=${file}`, 'file://' + tmp], { stdio: 'ignore', timeout: 60000 });
  const dom = execFileSync(SHELL, [...args, '--dump-dom', 'file://' + tmp], { timeout: 60000 }).toString();
  fs.unlinkSync(tmp);
  const m = dom.match(/<pre id="report">([\s\S]*?)<\/pre>/);
  return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : [];
}

/* WCAG relative luminance contrast. */
function lum(hex) {
  const v = hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const mainFile = path.join(outDir, `${name}.png`);
const report = shot(page({ transparent: spec.mode === 'overlay' }), mainFile, spec.mode === 'overlay');

/* Feed preview: the ad at 100% next to feed size (35%) on a light and a dark feed. */
const fw = Math.round(W * 0.35), fh = Math.round(H * 0.35);
const feedHtml = `<!doctype html><style>body{margin:0;display:flex;font:600 18px sans-serif}
.a{padding:24px;background:#fff}.f{width:${fw + 48}px;padding:24px;box-sizing:border-box}.f p{margin:0 0 10px;color:#888}
.l{background:#F0F2F5}.d{background:#18191A}.d p{color:#aaa}</style>
<div class="a"><img src="file://${path.resolve(mainFile)}" width="${W}"></div>
<div class="f l"><p>feed, light</p><img src="file://${path.resolve(mainFile)}" width="${fw}"></div>
<div class="f d"><p>feed, dark</p><img src="file://${path.resolve(mainFile)}" width="${fw}"></div>`;
const feedTmp = path.join(outDir, `.${name}-feed.html`);
fs.writeFileSync(feedTmp, feedHtml);
execFileSync(SHELL, ['--no-sandbox', '--allow-file-access-from-files', '--hide-scrollbars', `--window-size=${W + 48 + 2 * (fw + 48)},${H + 48}`, '--virtual-time-budget=2000', `--screenshot=${path.join(outDir, name + '-feed.png')}`, 'file://' + feedTmp], { stdio: 'ignore', timeout: 60000 });
fs.unlinkSync(feedTmp);

/* Checks that are numbers, not opinions (critique checks 4, 5, 6, 9, 11). */
const issues = [];
const els = spec.elements || [];
const head = report.filter((r) => r.size >= 90).sort((a, b) => b.size - a.size)[0];
const facts = report.filter((r) => r.size < 90 && !['qualifier', 'offer'].includes(els[r.i].role) && els[r.i].type !== 'pill');
for (const r of report) {
  const e = els[r.i], label = `"${String(e.text).split('\n')[0].slice(0, 30)}"`;
  if (r.size < 44 && !e.smallPrint) issues.push(`${label}: ${r.size}px is under the 44px floor`);
  if (r.overflowX) issues.push(`${label}: runs wider than its ${e.w}px box`);
  if (r.maxLines && r.lines > r.maxLines) issues.push(`${label}: ${r.lines} lines, limit ${r.maxLines}`);
  if (r.hitsProduct) issues.push(`${label}: overlaps the product box`);
  if (r.x < MARGIN.l - 1 || r.y < MARGIN.t - 1 || r.x + r.w > W - MARGIN.r + 1 || r.y + r.h > H - MARGIN.b + 1) issues.push(`${label}: inside the ${MARGIN.l}/${MARGIN.t}/${MARGIN.r}/${MARGIN.b} margin`);
  const behind = r.bg || (spec.plate || spec.mode === 'overlay' ? null : col('ground'));
  if (behind && /^#[0-9a-f]{6}$/i.test(r.color) && /^#[0-9a-f]{6}$/i.test(behind)) {
    const cr = contrast(r.color, behind), need = r.size < 64 ? 7 : 4.5;
    if (cr < need) issues.push(`${label}: contrast ${cr.toFixed(1)}:1, needs ${need}:1`);
  }
}
for (let a = 0; a < report.length; a++) for (let b = a + 1; b < report.length; b++) {
  const [p, q] = [report[a].ink, report[b].ink];
  if (p && q && !(p[2] <= q[0] || q[2] <= p[0] || p[3] <= q[1] || q[3] <= p[1])) issues.push(`"${String(els[report[a].i].text).split('\n')[0].slice(0, 20)}" and "${String(els[report[b].i].text).split('\n')[0].slice(0, 20)}" overlap`);
}
if (head && facts.length) {
  const ratio = head.size / Math.max(...facts.map((f) => f.size));
  if (ratio < 2.5) issues.push(`hierarchy: headline is ${ratio.toFixed(1)}x the facts, needs 2.5x or more`);
}
const texts = (spec.elements || []).filter((e) => e.type !== 'box').length;
if (report.length < texts) { console.error(`measured ${report.length} of ${texts} text blocks: the page did not render, checks are NOT valid`); process.exit(2); }
console.log(JSON.stringify({ measured: report.length, png: mainFile, feed: path.join(outDir, name + '-feed.png'), issues: issues.length ? issues : ['all number checks pass'] }, null, 1));
