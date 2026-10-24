#!/usr/bin/env node
'use strict';
/*
 Weekly winning-ads report from Meta, read-only, through Donnaa's System User token.
 Run with Railway so the token stays in Donnaa's env and is never printed:

   railway run -s powerful-insight node pnl/winners.js [out.md] [breakEven=1.4]

 Pulls the last 7 days at ad level for the main account (META_WINNERS_ACCOUNT, default A-100),
 merges copies of the same creative ("- Copy", "- Copy 2", "-09-21" date tails), tags each
 creative with its editor from bot/data/editors.json, and writes a Slack-ready markdown post.
 ROAS here is Meta's own reported purchase value / spend.
*/
const fs = require('fs');
const path = require('path');
const model = require('../bot/src/editors/model.js');
const editorsFile = require('../bot/data/editors.json');
const EDITORS = editorsFile.editors || editorsFile;

const API = 'https://graph.facebook.com/' + (process.env.META_API_VERSION || 'v21.0');
const TOKEN = process.env.META_ACCESS_TOKEN || '';
const ACCOUNT = process.env.META_WINNERS_ACCOUNT || 'act_1322843300912507';
const TYPES = ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase'];
const pick = (a) => { for (const t of TYPES) { const h = (a || []).find((x) => x.action_type === t); if (h) return Number(h.value); } return 0; };
const money = (n) => '$' + (n >= 1000 ? (n / 1000).toFixed(1) + 'K' : Math.round(n));
const norm = (n) => String(n || '').replace(/\s*-\s*Copy(\s*\d+)?/gi, '').replace(/-\d{2}-\d{2}$/, '').trim();

async function main() {
  if (!TOKEN) throw new Error('META_ACCESS_TOKEN not set (run through railway run -s powerful-insight)');
  const outFile = process.argv[2];
  const be = Number(process.argv[3]) || 1.4;
  const u = new URL(`${API}/${ACCOUNT}/insights`);
  const q = { level: 'ad', fields: 'ad_name,spend,actions,action_values', date_preset: 'last_7d', limit: '200',
    filtering: JSON.stringify([{ field: 'spend', operator: 'GREATER_THAN', value: 0 }]), access_token: TOKEN };
  for (const [k, v] of Object.entries(q)) u.searchParams.set(k, v);
  let rows = []; let next = u.toString();
  while (next) {
    const j = await (await fetch(next)).json();
    if (j.error) throw new Error(j.error.message);
    rows = rows.concat(j.data || []); next = j.paging && j.paging.next;
  }

  const groups = {}; const byEditor = {};
  let S = 0, V = 0;
  for (const r of rows) {
    const s = Number(r.spend || 0), v = pick(r.action_values), p = pick(r.actions);
    const ed = (model.findEditor(r.ad_name, EDITORS) || {}).name || 'No editor code';
    const k = norm(r.ad_name);
    const g = groups[k] || (groups[k] = { name: k, editor: ed, spend: 0, value: 0, purch: 0, copies: 0 });
    g.spend += s; g.value += v; g.purch += p; g.copies++;
    const e = byEditor[ed] || (byEditor[ed] = { spend: 0, value: 0 }); e.spend += s; e.value += v;
    S += s; V += v;
  }
  const list = Object.values(groups).map((g) => Object.assign(g, { roas: g.spend ? g.value / g.spend : 0 }));
  const winners = list.filter((g) => g.spend >= 500 && g.roas >= be).sort((a, b) => b.roas - a.roas).slice(0, 10);
  const losers = list.filter((g) => g.spend >= 1000 && g.roas < 1).sort((a, b) => b.spend - a.spend).slice(0, 5);
  const top = list.slice().sort((a, b) => b.spend - a.spend).slice(0, 8);
  const line = (g) => `• ${g.name} — ${g.editor} · ${money(g.spend)} · **${g.roas.toFixed(2)}x** · ${Math.round(g.purch)} sales${g.copies > 1 ? ` (${g.copies} copies)` : ''}`;

  const out = [];
  out.push(`**Winning ads — last 7 days** (Meta account A-100, Meta-reported ROAS, break-even ${be.toFixed(2)}x)`);
  out.push(`${rows.length} ads spent ${money(S)} · Meta ROAS **${(V / S).toFixed(2)}x**`);
  out.push('');
  out.push(`**🟢 Winners (≥ ${be.toFixed(2)}x on $500+)**`);
  out.push(winners.length ? winners.map(line).join('\n') : 'None this week.');
  out.push('');
  out.push('**💸 Biggest spenders**');
  out.push(top.map(line).join('\n'));
  out.push('');
  out.push('**🔴 Losing money (under 1.0x on $1K+)**');
  out.push(losers.length ? losers.map(line).join('\n') : 'None this week.');
  out.push('');
  out.push('**By editor**');
  out.push(Object.entries(byEditor).filter(([, e]) => e.spend >= 100).sort((a, b) => b[1].spend - a[1].spend)
    .map(([n, e]) => `• ${n}: ${money(e.spend)} · ${(e.value / e.spend).toFixed(2)}x`).join('\n'));
  const md = out.join('\n');
  if (outFile) fs.writeFileSync(path.resolve(outFile), md); else process.stdout.write(md + '\n');
}

main().catch((e) => { console.error('winners: ' + e.message); process.exit(1); });
