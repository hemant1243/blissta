// Contact sheet of deleted clips/images: one PNG with each saved copy and a plain caption.
// node sheet.js <out.json from watch5.js> <out.png>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [, , outJson, outPng] = process.argv;
const items = (JSON.parse(fs.readFileSync(outJson, 'utf8')).deleted || []).filter((d) => d.saved_copy && fs.existsSync(d.saved_copy));
if (!items.length) { console.error('no saved copies to show'); process.exit(1); }

const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const cards = items.map((d, i) => {
  const src = 'file://' + path.resolve(d.saved_copy);
  const media = /\.mp4$/i.test(d.saved_copy)
    ? `<video src="${src}" muted></video>`
    : `<img src="${src}">`;
  const who = d.brief && d.brief.editor ? `${d.brief.editor} · ${d.brief.title || ''}` : 'editor unknown';
  return `<div class="c"><div class="m">${media}</div><div class="t"><b>#${i + 1} · ${esc(d.et)} ET</b> · ${esc(d.model)}${d.credits ? ` · ${d.credits} cr` : ''}<br>${esc(who)}<br><span>${esc((d.prompt || '').slice(0, 140))}</span></div></div>`;
}).join('');

const cols = Math.min(items.length, 4);
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:16px;background:#fff;font:14px/1.35 -apple-system,Segoe UI,Arial,sans-serif;color:#111}
h1{font-size:18px;margin:0 0 12px}
.g{display:grid;grid-template-columns:repeat(${cols},300px);gap:12px}
.c{border:1px solid #ddd;border-radius:10px;overflow:hidden}
.m{height:420px;background:#f3f3f3;display:flex;align-items:center;justify-content:center}
.m img,.m video{max-width:100%;max-height:100%}
.t{padding:8px 10px}.t span{color:#666;font-size:12px}
</style><h1>Deleted on Higgsfield — ${items.length} item${items.length > 1 ? 's' : ''}</h1><div class="g">${cards}</div>`;

const tmp = path.join(path.dirname(path.resolve(outPng)), 'sheet.html');
fs.writeFileSync(tmp, html);
const width = 32 + cols * 300 + (cols - 1) * 12;
const rows = Math.ceil(items.length / cols);
const height = 60 + rows * 540;
execFileSync('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', [
  '--no-sandbox', '--allow-file-access-from-files', '--hide-scrollbars',
  `--window-size=${width},${height}`, `--screenshot=${path.resolve(outPng)}`, 'file://' + tmp,
], { stdio: 'ignore', timeout: 60000 });
console.log(outPng);
