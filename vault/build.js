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
data.clips.sort((a, b) => (b.created || '').localeCompare(a.created || ''));
const src = fs.readFileSync(path.join(__dirname, 'src', 'vault.html'), 'utf8');
const json = JSON.stringify(data).replace(/<\//g, '<\\/');
const out = src.replace('<script id="vault-data" type="application/json">{}</script>', '<script id="vault-data" type="application/json">' + json + '</script>');
if (out === src) { console.error('data slot not found in src/vault.html'); process.exit(1); }
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'vault.html'), out);
console.log('clips', data.clips.length, 'bytes', out.length);
