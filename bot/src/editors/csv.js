'use strict';
/*
 Fallback: an Ads Manager export (CSV, ad level, broken down by month or by day). Columns are found
 by name, so extra columns and different orders do not matter. Rows are bucketed by the month of
 "Reporting starts".
*/
function parse(text) {
  const rows = []; let row = []; let cell = ''; let q = false;
  const s = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => String(x).trim() !== ''));
}
const find = (head, ...res) => { for (const re of res) { const i = head.findIndex((h) => re.test(h)); if (i >= 0) return i; } return -1; };
const num = (v) => { const n = Number(String(v || '').replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? n : 0; };

/* Returns { ads: {...same shape as meta.pull...}, rows, skipped } */
function toAds(text) {
  const rows = parse(text);
  if (rows.length < 2) throw new Error('CSV has no data rows');
  const head = rows[0].map((h) => String(h).trim().toLowerCase());
  const iName = find(head, /^ad name$/, /^ad name/), iId = find(head, /^ad id$/, /^ad id/);
  const iSpend = find(head, /^amount spent/, /^spend/), iValue = find(head, /purchases? conversion value/, /purchase.*value/, /conversion value/);
  const iPurch = find(head, /^purchases$/, /^results$/), iImp = find(head, /^impressions$/), iClicks = find(head, /^link clicks$/, /^clicks \(all\)$/, /^clicks$/);
  const iStart = find(head, /^reporting starts/, /^day$/, /^month$/, /^date/), iStatus = find(head, /^ad delivery$/, /delivery status/, /^ad status/);
  if (iName < 0 || iSpend < 0) throw new Error('Need at least "Ad name" and "Amount spent" columns');
  const ads = {}; let skipped = 0;
  for (const r of rows.slice(1)) {
    const name = String(r[iName] || '').trim(); if (!name) { skipped++; continue; }
    const id = iId >= 0 && r[iId] ? String(r[iId]).trim() : 'csv:' + name;
    const start = iStart >= 0 ? String(r[iStart] || '') : '';
    const m = (start.match(/(\d{4})-(\d{2})/) || [])[0] || new Date().toISOString().slice(0, 7);
    const ad = ads[id] || (ads[id] = { id, name, account: 'csv', delivery: iStatus >= 0 ? String(r[iStatus] || '') : '', preview: '', thumb: '', videoId: '', months: {} });
    const cur = ad.months[m] || { spend: 0, value: 0, purchases: 0, impressions: 0, clicks: 0 };
    cur.spend += num(r[iSpend]); cur.value += iValue >= 0 ? num(r[iValue]) : 0; cur.purchases += iPurch >= 0 ? num(r[iPurch]) : 0;
    cur.impressions += iImp >= 0 ? num(r[iImp]) : 0; cur.clicks += iClicks >= 0 ? num(r[iClicks]) : 0;
    ad.months[m] = cur;
  }
  return { ads, rows: rows.length - 1, skipped };
}
module.exports = { toAds, parse };
