#!/usr/bin/env node
'use strict';
/*
 Weekly editor scorecard for Hemant, read-only everywhere. One line per video editor, sorted by winners:
   new concepts delivered (Blissta Vault files), ads that spent, winners, ad spend and ROAS (Meta),
   Higgsfield credits where a shot can be tied to the editor's brief.

   railway run -s powerful-insight node pnl/scorecard.js --vault <vault.html|vault.json> [options]

 Options
   --vault <file>      Blissta Vault page saved as HTML (the JSON in <script id="vault-data">) or that JSON alone. Required.
   --higgsfield <csv>  default ops/higgsfield/reports/reroll-waste-shots.csv
   --meta-json <file>  use saved Meta ad rows ([{ad_name, spend, actions, action_values}]) instead of calling Meta
   --out <file>        write the markdown here (default: print it)
   --days <n>          window length, default 7 (the window ends now)
   --break-even <x>    weekly winner ROAS, default 1.4 (same rule as pnl/winners.js)

 Rules
   Window       the last <days> days, from 00:00 UTC <days> days ago to now. Meta uses the same dates
                (each ad account's own time zone), so today is a part day.
   Concept      one vault folder = one concept, so hooks H1-H10 and v1/v2 count once. Revision folders
                ("REVISED", "Revision") count under their parent; date folders ("OCTOBER 8", "2026-10-12")
                and loose files are matched to the editor's concept folder with the same brief id
                (VID-YYYYMMDD-XXXXXX). Folders that differ only by a number and share a brief id
                ("... NOV 14" / "... NOV 15") count once. "New" = the concept's first file in the vault
                is inside the window; a concept that already had files before it is "reworked".
   Ads          Meta ad-level rows that spent in the window, copies merged by name like pnl/winners.js,
                every ad account the token can read (or META_AD_ACCOUNTS). Editor from the code in the ad
                name (bot/data/editors.json, same matching as bot/src/editors/model.js).
   Winner       a merged ad with $500+ spend at break-even ROAS or better in the window (pnl/winners.js).
                The lifetime Winning Ad rule in model.js ($10K at 1.5x) needs lifetime data and is not used here.
   Higgsfield   everyone shares one Higgsfield login, so credits are known only for shots whose prompt
                matched one brief. The CSV holds only shots made 2+ times; we show those shots' credits
                and how many of them were extra tries.
*/
const fs = require('fs');
const path = require('path');
const model = require('../bot/src/editors/model.js');
const editorsFile = require('../bot/data/editors.json');

/* Editors who appear in the vault or Higgsfield but are not in bot/data/editors.json yet. */
const EXTRA = [{ name: 'Zafa Huzaifa', codes: ['ZAFA', 'HUZAIFA'], extra: true }];
const EDITORS = (editorsFile.editors || editorsFile).concat(EXTRA);

const API = 'https://graph.facebook.com/' + (process.env.META_API_VERSION || 'v21.0');
const TOKEN = process.env.META_ACCESS_TOKEN || '';
const ACCOUNTS = (process.env.META_AD_ACCOUNTS || '').split(',').map((s) => s.trim()).filter(Boolean).map((s) => (s.startsWith('act_') ? s : 'act_' + s));
const TYPES = ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase'];
const pick = (a) => { for (const t of TYPES) { const h = (a || []).find((x) => x.action_type === t); if (h) return Number(h.value); } return 0; };
const money = (n) => '$' + (n >= 1000 ? (n / 1000).toFixed(1) + 'K' : Math.round(n));
const normAd = (n) => String(n || '').replace(/\s*-\s*Copy(\s*\d+)?/gi, '').replace(/-\d{2}-\d{2}$/, '').trim();
const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + 's'}`;
const day = (d) => d.toISOString().slice(0, 10);
const nice = (s) => new Date(s + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

function args(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  return o;
}

/* ---------- editor matching ---------- */
const findEditor = (...texts) => { for (const t of texts) { const e = t && model.findEditor(t, EDITORS); if (e) return e; } return null; };

/* ---------- vault: concepts ---------- */
function readVault(file) {
  const txt = fs.readFileSync(file, 'utf8');
  if (/^\s*[{[]/.test(txt)) return JSON.parse(txt);
  const m = txt.match(/<script id="vault-data"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('no <script id="vault-data"> in ' + file);
  return JSON.parse(m[1]);
}
const MONTHS = 'JAN|JANUARY|FEB|FEBRUARY|MAR|MARCH|APR|APRIL|MAY|JUN|JUNE|JUL|JULY|AUG|AUGUST|SEP|SEPT|SEPTEMBER|OCT|OCTOBER|NOV|NOVEMBER|DEC|DECEMBER';
const isDateFolder = (s) => new RegExp(`^\\s*(\\d{4}-\\d{2}(-\\d{2})?|(${MONTHS})\\s*\\d{0,4}|\\d+_?SET\\d*|SET_?\\d+|TRIAL TASKS|EDITOR VIDEOS|DRIVE ROOT)\\s*$`, 'i').test(s || '');
const isRevision = (s) => /^\s*(REVISED|REVISIONS?|FINAL|FIXED|V\d+)\s*$/i.test(s || '');
const briefOf = (name) => { const m = String(name || '').match(/VID-?(\d{8})-([0-9A-F]{6})/i); return m ? `${m[1]}-${m[2].toUpperCase()}` : ''; };
const keyOf = (s) => String(s || '').toUpperCase().replace(/\b(CORBEL|CORVAEL|BLISSTA)\b/g, ' ').replace(/[^A-Z0-9]+/g, ' ').trim();
/* Concept text from a file name like MECA_CORBEL_VID-20260917-9BB1A1_h2_Erection-Educational-Animation-Tab20_2026-10-12_v1 */
const conceptFromName = (name) => String(name || '').replace(/\.[a-z0-9]{2,4}$/i, '').split(/_+/)
  .filter((p) => !/^(VID-?\d{8}-[0-9A-F]{6}-?|H\d+|HOOK\s?\d+|V\d+|AI(-ANIMATION)?|UGC|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}|\d{4})$/i.test(p.trim()))
  .filter((p, i) => !(i < 2 && /^[A-Z]+$/.test(p.trim()))).join(' ').trim();

function concepts(vault, since) {
  const clips = (vault.clips || []).map((c) => {
    const segs = String(c.path || '').split(' / ');
    const ed = findEditor(c.editor, segs.slice(0, 3).join(' '), c.path, c.name);
    let folder = c.folder != null && c.folder !== '' ? c.folder : isDateFolder(c.month) ? '' : c.month || '';
    if (isRevision(folder)) { const p = segs[segs.length - 2] || ''; folder = isDateFolder(p) ? '' : p; }
    if (isDateFolder(folder)) folder = '';
    return { c, editor: ed ? ed.name : null, folder, brief: briefOf(c.name), created: c.created || c.date || '' };
  });
  /* brief id -> concept folders, per editor, to place loose and date-folder files */
  const briefs = {};
  for (const x of clips) if (x.editor && x.folder && x.brief) ((briefs[x.editor] = briefs[x.editor] || {})[x.brief] = briefs[x.editor][x.brief] || new Set()).add(keyOf(x.folder));
  for (const x of clips) {
    if (!x.folder) {
      const set = x.editor && x.brief && briefs[x.editor] && briefs[x.editor][x.brief];
      x.folder = set && set.size === 1 ? clips.find((y) => y.editor === x.editor && y.folder && keyOf(y.folder) === [...set][0]).folder : conceptFromName(x.c.name) || x.c.concept || x.c.name;
    }
    x.key = keyOf(x.folder);
  }
  /* "... NOV 14" and "... NOV 15" with one brief id are one concept */
  const folderBrief = {};
  for (const x of clips) if (x.brief) { const k = x.editor + '|' + x.key; (folderBrief[k] = folderBrief[k] || {})[x.brief] = (folderBrief[k][x.brief] || 0) + 1; }
  for (const x of clips) {
    const fb = folderBrief[x.editor + '|' + x.key];
    const top = fb ? Object.entries(fb).sort((a, b) => b[1] - a[1])[0][0] : '';
    x.concept = top ? x.key.replace(/\d+/g, '#') + '|' + top : x.key;
  }
  const first = {};
  for (const x of clips) { const k = x.editor + '||' + x.concept; if (!first[k] || x.created < first[k]) first[k] = x.created; }
  const out = {}; let unassigned = 0;
  for (const x of clips) {
    if (!(x.created >= since)) continue;
    if (!x.editor) { unassigned++; continue; }
    const e = out[x.editor] || (out[x.editor] = { files: 0, fresh: new Map(), reworked: new Map() });
    e.files++;
    const isNew = first[x.editor + '||' + x.concept] >= since;
    (isNew ? e.fresh : e.reworked).set(x.concept, x.folder.trim());
  }
  return { byEditor: out, unassigned, syncedAt: (vault.meta || {}).syncedAt || '' };
}

/* ---------- Meta: ads that spent ---------- */
async function getJson(u) {
  const r = await fetch(u); const j = await r.json();
  if (!r.ok || j.error) throw new Error((j.error && j.error.message) || `Meta ${r.status}`);
  return j;
}
async function metaRows(since, until) {
  if (!TOKEN) throw new Error('META_ACCESS_TOKEN not set (run through railway run -s powerful-insight)');
  let accts = ACCOUNTS;
  if (!accts.length) {
    const u = new URL(`${API}/me/adaccounts`); u.searchParams.set('fields', 'id'); u.searchParams.set('limit', '100'); u.searchParams.set('access_token', TOKEN);
    let j = await getJson(u); accts = (j.data || []).map((a) => a.id);
    while (j.paging && j.paging.next) { j = await getJson(j.paging.next); accts = accts.concat((j.data || []).map((a) => a.id)); }
  }
  let rows = [];
  for (const acct of accts) {
    const u = new URL(`${API}/${acct}/insights`);
    const q = { level: 'ad', fields: 'ad_id,ad_name,spend,actions,action_values', time_range: JSON.stringify({ since, until }), limit: '200',
      filtering: JSON.stringify([{ field: 'spend', operator: 'GREATER_THAN', value: 0 }]), access_token: TOKEN };
    for (const [k, v] of Object.entries(q)) u.searchParams.set(k, v);
    let next = u.toString();
    while (next) { const j = await getJson(next); rows = rows.concat((j.data || []).map((r) => Object.assign(r, { account: acct }))); next = j.paging && j.paging.next; }
  }
  return { rows, accounts: accts.length };
}
function adsByEditor(rows, be) {
  const groups = {};
  for (const r of rows) {
    const ed = findEditor(r.ad_name);
    const k = normAd(r.ad_name);
    const g = groups[k] || (groups[k] = { editor: ed ? ed.name : null, spend: 0, value: 0 });
    g.spend += Number(r.spend || 0); g.value += pick(r.action_values);
  }
  const out = {}; const none = { ads: 0, spend: 0, value: 0 };
  for (const g of Object.values(groups)) {
    if (g.spend <= 0) continue;
    const e = g.editor ? (out[g.editor] = out[g.editor] || { ads: 0, winners: 0, spend: 0, value: 0 }) : none;
    e.ads++; e.spend += g.spend; e.value += g.value;
    if (g.editor && g.spend >= 500 && g.value / g.spend >= be) e.winners++;
  }
  return { byEditor: out, none };
}

/* ---------- Higgsfield ---------- */
function csvRows(txt) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) { if (ch === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && txt[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += ch;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1);
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
function higgsfield(file, since) {
  const out = {}; const other = { shots: 0, credits: 0 };
  let latest = '';
  for (const r of csvRows(fs.readFileSync(file, 'utf8'))) {
    if (r.lastAt > latest) latest = r.lastAt;
    if (!(r.lastAt >= since)) continue;
    const ed = /^(unknown|no editor assigned)?$/i.test(r.editor || '') ? null : findEditor(r.editor);
    const e = ed ? (out[ed.name] = out[ed.name] || { shots: 0, credits: 0, extra: 0 }) : other;
    e.shots++; e.credits += Number(r.total || 0); if (ed) e.extra += Number(r.repeatCredits || 0);
  }
  return { byEditor: out, other, latest };
}

/* ---------- report ---------- */
async function main() {
  const a = args(process.argv.slice(2));
  if (!a.vault) throw new Error('--vault <file> is required (the Blissta Vault page HTML or its vault-data JSON)');
  const days = Number(a.days) || 7, be = Number(a['break-even']) || 1.4;
  const now = new Date();
  const since = day(new Date(now.getTime() - days * 864e5)), until = day(now);
  const gaps = [];

  const V = concepts(readVault(path.resolve(a.vault)), since);
  if (V.syncedAt) gaps.push(`Vault last synced ${V.syncedAt.slice(0, 16).replace('T', ' ')} UTC; files added after that are not counted.`);
  if (V.unassigned) gaps.push(`${plural(V.unassigned, 'vault file')} in the window could not be tied to an editor.`);

  let M = null;
  try {
    const src = a['meta-json'] ? { rows: JSON.parse(fs.readFileSync(path.resolve(a['meta-json']), 'utf8')), accounts: null } : await metaRows(since, until);
    M = adsByEditor(src.rows, be);
    if (M.none.ads) gaps.push(`${plural(M.none.ads, 'ad')} that spent ${money(M.none.spend)} have no editor code in the name.`);
  } catch (e) {
    gaps.push(`No Meta data: ${e.message.replace(/access_token=[^&\s]+/g, 'access_token=***')}. Ads, winners, spend and ROAS are blank.`);
  }

  const hfFile = path.resolve(a.higgsfield || path.join(__dirname, '..', 'ops/higgsfield/reports/reroll-waste-shots.csv'));
  let H = null;
  try {
    H = higgsfield(hfFile, since + 'T00:00:00Z');
    gaps.push(`Higgsfield: everyone shares one login, so only shots whose prompt matched one brief are named (the editor on the brief, not proof of who pressed generate). Only shots made 2+ times are in the data. ${H.other.shots} more shots (${Math.round(H.other.credits).toLocaleString()} credits) in the window have no editor. Data runs to ${H.latest.slice(0, 10)}.`);
  } catch (e) { gaps.push(`No Higgsfield data: ${e.message}`); }

  const names = new Set(EDITORS.filter((e) => !e.extra).map((e) => e.name));
  for (const n of Object.keys(V.byEditor)) names.add(n);
  if (M) for (const n of Object.keys(M.byEditor)) names.add(n);
  if (H) for (const n of Object.keys(H.byEditor)) names.add(n);

  const rows = [...names].map((n) => {
    const v = V.byEditor[n] || { fresh: new Map(), reworked: new Map(), files: 0 };
    const m = M && (M.byEditor[n] || { ads: 0, winners: 0, spend: 0, value: 0 });
    const h = H && H.byEditor[n];
    return { n, v, m, h, extra: EXTRA.some((e) => e.name === n) };
  }).sort((x, y) => ((y.m ? y.m.winners : 0) - (x.m ? x.m.winners : 0)) || ((y.m ? y.m.spend : 0) - (x.m ? x.m.spend : 0)) || (y.v.fresh.size - x.v.fresh.size) || (y.v.reworked.size - x.v.reworked.size) || x.n.localeCompare(y.n));

  const out = [];
  out.push(`*Editor scorecard — ${nice(since)} to ${nice(until)}* (last ${days} days, sorted by winners)`);
  out.push(`Winner = $500+ spend at ${be.toFixed(1)}x ROAS or better this week (Meta-reported).`);
  out.push('');
  for (const r of rows) {
    const parts = [];
    const c = r.v.fresh.size, w = r.v.reworked.size;
    parts.push(c || w ? `delivered ${plural(c, 'new concept')}${w ? ` (+${w} reworked)` : ''}` : 'no new concepts in the vault');
    if (r.m) {
      if (r.m.ads) parts.push(`${plural(r.m.ads, 'ad')} spent ${money(r.m.spend)} at ${(r.m.value / r.m.spend).toFixed(2)}x ROAS, ${plural(r.m.winners, 'winner')}`);
      else parts.push('no ads spent');
    } else parts.push('ads/winners/spend: no Meta data');
    if (r.h) parts.push(`Higgsfield ${Math.round(r.h.credits).toLocaleString()} credits on ${plural(r.h.shots, 'retried shot')} (${Math.round(r.h.extra).toLocaleString()} on extra tries)`);
    else if (H) parts.push('Higgsfield: none attributable');
    out.push(`• *${r.n}*${r.extra ? ' (not in editors.json)' : ''} — ${parts.join(' · ')}.`);
  }
  out.push('');
  out.push('*Gaps*');
  for (const g of gaps) out.push('• ' + g);
  const md = out.join('\n') + '\n';
  if (a.out) { fs.mkdirSync(path.dirname(path.resolve(a.out)), { recursive: true }); fs.writeFileSync(path.resolve(a.out), md); }
  else process.stdout.write(md);
  if (a.debug) for (const r of rows) console.error(r.n, '| new:', [...r.v.fresh.values()].join(' ; '), '| reworked:', [...r.v.reworked.values()].join(' ; '));
}

main().catch((e) => { console.error('scorecard: ' + String(e.message).replace(/access_token=[^&\s]+/g, 'access_token=***')); process.exit(1); });
