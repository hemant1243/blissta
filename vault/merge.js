#!/usr/bin/env node
'use strict';
/*
 Incremental Vault sync that needs no local store: the live page is the store.

   node vault/merge.js <livePage.html|live.json> <outDocsDir> <vaultRootId[,id2]> <listingsDir> [foldersDir]

 1. Reads the clip list already published on the live page (the <script id="vault-data"> JSON).
 2. Runs index.js on a small throwaway store holding only the new Drive listing plus the parent
    folders needed to walk each new file up to its top folder (foldersDir: *.json, each one
    Drive file-metadata object or {files:[...]}).
 3. Replaces or adds those clips by id (keeping any transcript already on the page) and writes
    the same docs index.js writes, so `node vault/build.js <outDocsDir>` produces the next page.
*/
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const [liveArg, outDir, roots, listingDir, foldersDir] = process.argv.slice(2);
if (!liveArg || !outDir || !roots || !listingDir) { console.error('usage: node vault/merge.js <livePage.html|live.json> <outDocsDir> <rootIds> <listingsDir> [foldersDir]'); process.exit(1); }

const CHUNK = 400;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

function loadLive(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.json')) return JSON.parse(text);
  const m = text.match(/<script id="vault-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('no vault-data block in ' + file);
  return JSON.parse(m[1]);
}

const live = loadLive(liveArg);
if (!live.clips || live.clips.length < 1000) throw new Error(`live page has only ${live.clips ? live.clips.length : 0} clips; refusing to build on it`);

/* throwaway store: new listing + parent folders */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-merge-'));
const inc = path.join(tmp, 'inc');
fs.mkdirSync(inc);
/* product folders keep the name already on the page (Drive renames, e.g. "Corvael" -> "CORBEL", must not split a product) */
const productName = {};
for (const [name, p] of Object.entries((live.folders && live.folders.products) || {})) if (p.id) productName[p.id] = name;
let n = 0;
const copyDir = (dir) => {
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const j = readJson(path.join(dir, f));
    const files = (j.files || [j]).map((x) => (productName[x.id] ? Object.assign({}, x, { title: productName[x.id] }) : x));
    fs.writeFileSync(path.join(inc, `l${n++}.json`), JSON.stringify({ files }));
  }
};
copyDir(listingDir);
if (foldersDir && fs.existsSync(foldersDir)) copyDir(foldersDir);
const tmpDocs = path.join(tmp, 'docs');
execFileSync(process.execPath, [path.join(__dirname, 'index.js'), path.join(tmp, 'store.json'), tmpDocs, roots, inc], { stdio: ['ignore', 'ignore', 'inherit'] });

let fresh = [];
for (const f of fs.readdirSync(tmpDocs)) if (f.startsWith('vault_idx-')) fresh = fresh.concat(readJson(path.join(tmpDocs, f)).clips || []);
const freshTree = readJson(path.join(tmpDocs, 'vault_folders.json'));

/* merge: fresh clips win, transcripts carry over */
const byId = new Map(live.clips.map((c) => [c.id, c]));
let added = 0, updated = 0;
for (const c of fresh) {
  const old = byId.get(c.id);
  if (old) { for (const k of ['script', 'lines', 'duration']) if (old[k] !== undefined) c[k] = old[k]; updated++; } else added++;
  byId.set(c.id, c);
}
const clips = [...byId.values()].sort((a, b) => (b.created || '').localeCompare(a.created || ''));

/* folder tree: keep the live one, add any product/editor/month the new listing created */
const tree = live.folders || { products: {} };
for (const [p, v] of Object.entries(freshTree.products || {})) {
  const tp = tree.products[p] || (tree.products[p] = { id: v.id, url: v.url, editors: {} });
  if (v.winners) tp.winners = v.winners;
  for (const [e, ev] of Object.entries(v.editors || {})) {
    const te = tp.editors[e] || (tp.editors[e] = { id: ev.id, url: ev.url, months: {} });
    Object.assign(te.months, ev.months);
  }
}

const docs = {};
const products = [...new Set(clips.map((c) => c.product))].sort((a, b) => (a === 'Other') - (b === 'Other') || a.localeCompare(b));
for (const p of products) {
  const list = clips.filter((c) => c.product === p);
  for (let i = 0; i * CHUNK < list.length; i++) docs[`vault_idx-${slug(p)}-${i}`] = { product: p, part: i, clips: list.slice(i * CHUNK, (i + 1) * CHUNK) };
}
docs.vault_folders = tree;
docs.vault_meta = {
  syncedAt: new Date().toISOString(), count: clips.length,
  vaultCount: clips.filter((c) => c.vault).length, misnamed: clips.filter((c) => !c.ok).length,
  winners: clips.filter((c) => c.winner).length, videos: clips.filter((c) => c.kind === 'video').length, images: clips.filter((c) => c.kind === 'image').length,
  scripts: clips.filter((c) => c.script).length,
  products: products.map((p) => ({ name: p, count: clips.filter((c) => c.product === p).length })),
  docs: Object.keys(docs).filter((k) => k.startsWith('vault_idx-')).map((k) => k.replace(/^vault_/, '')),
};
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (f.startsWith('vault_')) fs.unlinkSync(path.join(outDir, f));
for (const [name, doc] of Object.entries(docs)) fs.writeFileSync(path.join(outDir, name + '.json'), JSON.stringify(doc));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(JSON.stringify({ live: live.clips.length, fresh: fresh.length, added, updated, clips: clips.length, scripts: docs.vault_meta.scripts, winners: docs.vault_meta.winners, products: docs.vault_meta.products }));
