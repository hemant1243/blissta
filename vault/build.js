#!/usr/bin/env node
'use strict';
/* Inlines the index docs into the page. node vault/build.js <docsDir> -> vault/dist/vault.html */
const fs = require('fs');
const path = require('path');
const docsDir = process.argv[2];
if (!docsDir) { console.error('usage: node vault/build.js <docsDir>'); process.exit(1); }
const data = { clips: [], folders: { products: {} }, meta: null };
for (const f of fs.readdirSync(docsDir)) {
  if (!f.endsWith('.json')) continue;
  const j = JSON.parse(fs.readFileSync(path.join(docsDir, f), 'utf8'));
  if (f.startsWith('vault_idx-')) data.clips = data.clips.concat(j.clips || []);
  else if (f === 'vault_folders.json') data.folders = j;
  else if (f === 'vault_meta.json') data.meta = j;
}
/* Optional third argument: a folder of transcript JSON files ({id, text, lines:[{t,text}], duration}). */
const scriptsDir = process.argv[3];
if (scriptsDir && fs.existsSync(scriptsDir)) {
  const byId = {};
  for (const f of fs.readdirSync(scriptsDir)) {
    if (!f.endsWith('.json') || f.endsWith('.err.json')) continue;
    try { const j = JSON.parse(fs.readFileSync(path.join(scriptsDir, f), 'utf8')); if (j.id && j.text) byId[j.id] = j; } catch { /* skip bad file */ }
  }
  let n = 0;
  for (const c of data.clips) { const t = byId[c.id]; if (t) { c.script = t.text; c.lines = (t.lines || []).map((l) => [l.t, l.text]); c.duration = t.duration; n++; } }
  data.meta = Object.assign({}, data.meta, { scripts: n });
  console.log('scripts attached', n);
}
data.clips.sort((a, b) => (b.created || '').localeCompare(a.created || ''));
const src = fs.readFileSync(path.join(__dirname, 'src', 'vault.html'), 'utf8');
const json = JSON.stringify(data).replace(/<\//g, '<\\/');
const out = src.replace('<script id="vault-data" type="application/json">{}</script>', '<script id="vault-data" type="application/json">' + json + '</script>');
if (out === src) { console.error('data slot not found in src/vault.html'); process.exit(1); }
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'vault.html'), out);
console.log('clips', data.clips.length, 'bytes', out.length);
