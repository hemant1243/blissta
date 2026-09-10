#!/usr/bin/env node
'use strict';
/*
 Builds the Blissta Vault index docs from raw Google Drive listings.

 Input: a directory of JSON files, one per Drive folder listing, each the raw
 output of the Drive search_files call ({files:[...]}). File name does not matter.
 Every listing must include the folder tree under the Vault root:
   Vault root -> product folders -> editor folders -> month folders -> clips
 Output: <outDir>/vault_folders.json, <outDir>/vault_meta.json and one
 <outDir>/vault_idx-<product-slug>.json per product, ready for write_db.

 node vault/index.js <listingsDir> <outDir> <vaultRootId>
*/
const fs = require('fs');
const path = require('path');

const [listingsDir, outDir, rootId] = process.argv.slice(2);
if (!listingsDir || !outDir || !rootId) { console.error('usage: node vault/index.js <listingsDir> <outDir> <vaultRootId>'); process.exit(1); }

const FOLDER = 'application/vnd.google-apps.folder';
const NAME_RE = /^([A-Za-z0-9]+)_([A-Za-z0-9]+)_(\d{4}-\d{2}-\d{2})_(.+?)_v(\d+)\.([A-Za-z0-9]+)$/;

const byId = new Map();
for (const f of fs.readdirSync(listingsDir)) {
  if (!f.endsWith('.json')) continue;
  const j = JSON.parse(fs.readFileSync(path.join(listingsDir, f), 'utf8'));
  for (const file of j.files || []) byId.set(file.id, file);
}

const children = (id) => [...byId.values()].filter((f) => f.parentId === id);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const folders = {};
const docs = {};
let count = 0;
for (const prod of children(rootId).filter((f) => f.mimeType === FOLDER)) {
  const p = { id: prod.id, url: prod.viewUrl, editors: {} };
  folders[prod.title] = p;
  const clips = [];
  for (const ed of children(prod.id).filter((f) => f.mimeType === FOLDER)) {
    if (ed.title.toUpperCase() === 'WINNERS') { p.winners = { id: ed.id, url: ed.viewUrl }; continue; }
    const e = { id: ed.id, url: ed.viewUrl, months: {} };
    p.editors[ed.title] = e;
    const walk = (folderId, month) => {
      for (const f of children(folderId)) {
        if (f.mimeType === FOLDER) { if (!month) e.months[f.title] = { id: f.id, url: f.viewUrl }; walk(f.id, month || f.title); continue; }
        const m = f.title.match(NAME_RE);
        clips.push({
          id: f.id, name: f.title, url: f.viewUrl,
          product: prod.title, editor: ed.title, month: month || '',
          concept: m ? m[4].replace(/-/g, ' ') : '', version: m ? Number(m[5]) : 0, date: m ? m[3] : '',
          ok: !!m, mime: f.mimeType || '', created: f.createdTime || '', modified: f.modifiedTime || '',
        });
      }
    };
    walk(ed.id, '');
  }
  clips.sort((a, b) => (b.created || '').localeCompare(a.created || ''));
  count += clips.length;
  docs['vault_idx-' + slug(prod.title)] = { product: prod.title, clips };
}
docs.vault_folders = { root: rootId, products: folders };
docs.vault_meta = { syncedAt: new Date().toISOString(), count, products: Object.keys(folders) };

fs.mkdirSync(outDir, { recursive: true });
for (const [name, doc] of Object.entries(docs)) fs.writeFileSync(path.join(outDir, name + '.json'), JSON.stringify(doc));
console.log('clips', count, 'products', Object.keys(folders).join(', '), '->', outDir);
