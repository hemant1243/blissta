#!/usr/bin/env node
'use strict';
/*
 Daily Meta ad spend for the P&L, read-only, through Donnaa's System User token.
 Run it with Railway so the token stays in Donnaa's env and is never printed:

   railway run -s powerful-insight node pnl/meta_spend.js [days=14] [out.json]

 Pulls account-level spend per day for every ad account the token can see
 (or META_AD_ACCOUNTS if set) and writes:
   { pulledAt, accounts:[{id,name,status}], days:{ 'YYYY-MM-DD': { total, byAccount:{ act_..: spend } } } }
 Days are in each ad account's own time zone, as Ads Manager shows them.
*/
const fs = require('fs');

const API = 'https://graph.facebook.com/' + (process.env.META_API_VERSION || 'v21.0');
const TOKEN = process.env.META_ACCESS_TOKEN || '';
const ACCOUNTS = (process.env.META_AD_ACCOUNTS || '').split(',').map((s) => s.trim()).filter(Boolean).map((s) => (s.startsWith('act_') ? s : 'act_' + s));

async function get(url, params) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params || {})) u.searchParams.set(k, typeof v === 'string' ? v : JSON.stringify(v));
  u.searchParams.set('access_token', TOKEN);
  const r = await fetch(u);
  const j = await r.json();
  if (!r.ok || j.error) throw new Error((j.error && j.error.message) || `Meta ${r.status}`);
  return j;
}
async function all(url, params) {
  let j = await get(url, params);
  let out = j.data || [];
  let guard = 0;
  while (j.paging && j.paging.next && guard++ < 200) {
    const r = await fetch(j.paging.next); j = await r.json();
    if (j.error) throw new Error(j.error.message);
    out = out.concat(j.data || []);
  }
  return out;
}

async function main() {
  if (!TOKEN) throw new Error('META_ACCESS_TOKEN not set (run through railway run -s powerful-insight)');
  const days = Math.max(1, Number(process.argv[2]) || 14);
  const outFile = process.argv[3];
  const until = new Date();
  const since = new Date(until.getTime() - days * 864e5);
  const range = { since: since.toISOString().slice(0, 10), until: until.toISOString().slice(0, 10) };

  const accounts = ACCOUNTS.length
    ? ACCOUNTS.map((id) => ({ id, name: id, status: '' }))
    : (await all(`${API}/me/adaccounts`, { fields: 'id,name,account_status,currency', limit: '100' }))
      .map((a) => ({ id: a.id, name: a.name || a.id, status: a.account_status, currency: a.currency }));

  const out = { pulledAt: new Date().toISOString(), range, accounts, days: {} };
  for (const a of accounts) {
    const rows = await all(`${API}/${a.id}/insights`, { level: 'account', fields: 'spend', time_range: range, time_increment: '1', limit: '500' });
    for (const r of rows) {
      const d = r.date_start; const s = Number(r.spend || 0);
      const day = out.days[d] || (out.days[d] = { total: 0, byAccount: {} });
      day.byAccount[a.id] = s; day.total = Math.round((day.total + s) * 100) / 100;
    }
  }
  const json = JSON.stringify(out, null, 1);
  if (outFile) fs.writeFileSync(outFile, json); else process.stdout.write(json + '\n');
}

main().catch((e) => { console.error('meta_spend: ' + e.message); process.exit(1); });
