#!/usr/bin/env node
'use strict';
/*
 Builds the Blissta Vault index docs from raw Google Drive listings.

 Usage:
   node vault/index.js <storeFile> <outDir> <vaultRootId> [listingsDir ...]

 Every listingsDir is scanned for *.json files, each the raw output of the Drive
 search_files tool ({files:[...]}). Every entry (file or folder) is upserted into
 the store (a JSON map by id) so incremental listings can be merged in later.
 Then the docs are rebuilt from the whole store:
   vault_folders.json   Vault root tree (product -> editor -> month), for the Add button
   vault_meta.json      syncedAt, counts, product list
   vault_idx-<slug>-<n>.json  clips per product, chunks of CHUNK
*/
const fs = require('fs');
const path = require('path');

const [storeFile, outDir, rootId, ...listingDirs] = process.argv.slice(2);
if (!storeFile || !outDir || !rootId) { console.error('usage: node vault/index.js <storeFile> <outDir> <vaultRootId> [listingsDir ...]'); process.exit(1); }

const FOLDER = 'application/vnd.google-apps.folder';
const NAME_RE = /^([A-Za-z0-9]+)_([A-Za-z0-9]+)_(\d{4}-\d{2}-\d{2})_(.+?)_v(\d+)\.([A-Za-z0-9]+)$/;
const CHUNK = 400;
const PRODUCTS = [
  { name: 'Corvael', re: /corvael|natto|artery|arteries|blood ?pressure|cholesterol/i },
  { name: 'MB Gummies', re: /\bmbg\b|gummi|ultra ?blue|methylene|\bmb\b/i },
  { name: 'PEA', re: /\bpea\b|painbloc|pain ?bloc|palmitoyl/i },
];
const WINNER_RE = /winn|top videos|w-ads|best ads|winning/i;

/* ---------- store ---------- */
let store = { files: {} };
try { store = JSON.parse(fs.readFileSync(storeFile, 'utf8')); } catch { /* fresh store */ }
let ingested = 0;
for (const dir of listingDirs) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith('.json')) continue;
    let j; try { j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { console.error('skip', f, e.message); continue; }
    for (const file of j.files || []) {
      if (!file || !file.id) continue;
      store.files[file.id] = { id: file.id, title: file.title, mimeType: file.mimeType, parentId: file.parentId || '', createdTime: file.createdTime || '', modifiedTime: file.modifiedTime || '', viewUrl: file.viewUrl || '', fileSize: file.fileSize ? Number(file.fileSize) : 0 };
      ingested++;
    }
  }
}
fs.mkdirSync(path.dirname(storeFile), { recursive: true });
fs.writeFileSync(storeFile, JSON.stringify(store));

/* ---------- classify ---------- */
const all = Object.values(store.files);
const byId = store.files;
const folders = all.filter((f) => f.mimeType === FOLDER);
const media = all.filter((f) => /^(video|image)\//.test(f.mimeType || ''));

function chain(file) { /* folders from top to immediate parent */
  const out = []; let p = file.parentId; const seen = new Set();
  while (p && byId[p] && !seen.has(p)) { seen.add(p); out.unshift(byId[p]); p = byId[p].parentId; }
  return out;
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const clean = (s) => s.replace(/\.[A-Za-z0-9]+$/, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();

const vaultTree = { root: rootId, products: {} };
for (const prod of folders.filter((f) => f.parentId === rootId)) {
  const p = { id: prod.id, url: prod.viewUrl, editors: {} };
  vaultTree.products[prod.title] = p;
  for (const ed of folders.filter((f) => f.parentId === prod.id)) {
    if (ed.title.toUpperCase() === 'WINNERS') { p.winners = { id: ed.id, url: ed.viewUrl }; continue; }
    const e = { id: ed.id, url: ed.viewUrl, months: {} };
    p.editors[ed.title] = e;
    for (const m of folders.filter((f) => f.parentId === ed.id)) e.months[m.title] = { id: m.id, url: m.viewUrl };
  }
}

const clips = [];
for (const f of media) {
  const c = chain(f);
  const vi = c.findIndex((x) => x.id === rootId);
  const kind = f.mimeType.startsWith('video/') ? 'video' : 'image';
  const base = { id: f.id, name: f.title, url: f.viewUrl, kind, mime: f.mimeType, size: f.fileSize || 0, created: f.createdTime, modified: f.modifiedTime };
  if (vi >= 0) {
    const [prod, ed, month] = c.slice(vi + 1).map((x) => x.title);
    if (!prod) continue; /* file dropped directly in the root */
    const m = f.title.match(NAME_RE);
    const inWinners = (ed || '').toUpperCase() === 'WINNERS';
    clips.push(Object.assign(base, {
      product: prod, editor: inWinners ? '' : ed || '', month: inWinners ? '' : month || '',
      concept: m ? m[4].replace(/-/g, ' ') : '', version: m ? Number(m[5]) : 0, date: m ? m[3] : '',
      ok: !!m || inWinners, vault: true, winner: inWinners, path: c.slice(vi).map((x) => x.title).join(' / '),
    }));
  } else {
    const pathText = c.map((x) => x.title).join(' / ');
    /* nearest folder to the file decides the product, then the file name, then the top folders */
    let prod = 'Other';
    for (const seg of [f.title, ...c.map((x) => x.title).reverse()]) { const hit = PRODUCTS.find((p) => p.re.test(seg)); if (hit) { prod = hit.name; break; } }
    clips.push(Object.assign(base, {
      product: prod, editor: c.length ? c[0].title : 'Drive root', folder: c.length > 1 ? c[c.length - 1].title : '', month: '',
      concept: clean(f.title), version: 0, date: (f.createdTime || '').slice(0, 10),
      ok: true, vault: false, winner: WINNER_RE.test(pathText), path: pathText,
    }));
  }
}
clips.sort((a, b) => (b.created || '').localeCompare(a.created || ''));

/* ---------- docs ---------- */
const docs = {};
const products = [...new Set(clips.map((c) => c.product))].sort((a, b) => (a === 'Other') - (b === 'Other') || a.localeCompare(b));
for (const p of products) {
  const list = clips.filter((c) => c.product === p);
  for (let i = 0; i * CHUNK < list.length; i++) docs[`vault_idx-${slug(p)}-${i}`] = { product: p, part: i, clips: list.slice(i * CHUNK, (i + 1) * CHUNK) };
}
docs.vault_folders = vaultTree;
docs.vault_meta = {
  syncedAt: new Date().toISOString(), count: clips.length,
  vaultCount: clips.filter((c) => c.vault).length, misnamed: clips.filter((c) => !c.ok).length,
  winners: clips.filter((c) => c.winner).length, videos: clips.filter((c) => c.kind === 'video').length, images: clips.filter((c) => c.kind === 'image').length,
  products: products.map((p) => ({ name: p, count: clips.filter((c) => c.product === p).length })),
  docs: Object.keys(docs).filter((k) => k.startsWith('vault_idx-')).map((k) => k.replace(/^vault_/, '')),
};

fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (f.startsWith('vault_idx-')) fs.unlinkSync(path.join(outDir, f));
for (const [name, doc] of Object.entries(docs)) fs.writeFileSync(path.join(outDir, name + '.json'), JSON.stringify(doc));
console.log(JSON.stringify({ ingested, store: all.length, folders: folders.length, clips: clips.length, vault: docs.vault_meta.vaultCount, misnamed: docs.vault_meta.misnamed, winners: docs.vault_meta.winners, products: docs.vault_meta.products, docs: Object.keys(docs).length }));
