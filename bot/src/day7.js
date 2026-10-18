'use strict';
/*
 Day 7 creative learning sheet (07_ITERATION_PLAYBOOK Part 0.5).

   Daily 9am Bangkok   every ad launched 7 days ago on Meta gets a row in the sheet:
                       creative, product, launch date and its first 7 days of spend,
                       hook %, hold, CTR, CPA. Under $100 spend the verdict is "no read".
                       The strategist fills angle, avatar, format, type, hypothesis,
                       verdict and why.
   Monday 9am Bangkok  rows from the last 7 days with no verdict or why, owners tagged.
   Friday 5pm Bangkok  the week's verdict counts with creative names.

 The sheet is written through a small Apps Script web app bound to it
 (ops/day7/apps-script.gs), the same way the tracker bridge works.

 Reads from the environment:
   DAY7_SHEET_URL     the Apps Script web app URL
   DAY7_SECRET        shared secret, also set in the script's properties
   DAY7_CHANNEL       Slack channel for the Monday and Friday posts
   DAY7_SLACK=1       posts are off until this is set
   DAY7_SHEET_LINK    the sheet's own link, for the posts
   META_ACCESS_TOKEN / META_AD_ACCOUNT_ID   as for meta.js
*/
const meta = require('./meta');

const DAY = 864e5;
const BKK = 7 * 3600e3; /* Bangkok is UTC+7, no daylight saving */
const NO_READ_UNDER = 100;
const PRODUCTS = [
  [/corbel|corvael|corvel|natto/i, 'Corbel'],
  [/painbloc|pea\b/i, 'PainBloc'],
  [/ultra ?blue|gumm/i, 'Ultra Blue'],
  [/methylene|\bmb\b/i, 'MB'],
  [/aeon/i, 'Aeon'],
  [/gluco/i, 'Gluco Gone'],
];

const bkkDate = (t) => new Date(new Date(t).getTime() + BKK).toISOString().slice(0, 10);
const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);
const product = (campaign) => (PRODUCTS.find(([re]) => re.test(campaign || '')) || [null, campaign || ''])[1];
/* DAY7_META_ACCOUNT if set, else every ad account meta spend reports on. */
async function accounts() {
  const a = (process.env.DAY7_META_ACCOUNT || '').trim();
  if (a) return [a.startsWith('act_') ? a : 'act_' + a];
  return (await meta.adAccounts()).map((x) => x.id);
}
const act = (list, types) => { for (const t of types) { const a = (list || []).find((x) => x.action_type === t); if (a) return Number(a.value) || 0; } return 0; };

async function pages(path, query) {
  const out = [];
  let r = await meta.call(path, { query: { limit: '500', ...query } });
  for (;;) {
    out.push(...(r.data || []));
    if (!r.paging || !r.paging.next) return out;
    const res = await fetch(r.paging.next);
    r = await res.json();
    if (r.error) throw new Error('Meta ' + r.error.message);
  }
}

/* Ads launched (Bangkok date) on one of the given days, with their first 7 days of results, grouped by ad name. */
async function metaRows(days) {
  const byName = new Map();
  const failed = [];
  const list = await accounts();
  let lastError;
  for (const acct of list) {
    try { await accountRows(acct, days, byName); } catch (e) { failed.push(acct); lastError = e; console.error('[day7]', acct, e.message); }
  }
  if (!list.length) throw new Error('no Meta ad accounts visible to the token');
  if (failed.length === list.length) throw lastError;
  const rows = [...byName.values()].map((v) => ({
    creative: v.creative,
    product: v.product,
    launch: v.launch,
    spend: Math.round(v.spend * 100) / 100,
    hook: v.impressions ? v.views3s / v.impressions : '',
    hold: v.views3s ? v.thruplays / v.views3s : '',
    ctr: v.impressions ? v.clicks / v.impressions : '',
    cpa: v.purchases ? Math.round((v.spend / v.purchases) * 100) / 100 : '',
    verdict: v.spend < NO_READ_UNDER ? 'no read' : '',
    source: 'Meta',
  }));
  return { rows, failed };
}

async function accountRows(acct, days, byName) {
  const from = days[0], to = days[days.length - 1];
  /* Only ads that delivered can have a Day 7 read, so start from insights, then look up launch times. */
  const seen = await pages('/' + acct + '/insights', { level: 'ad', fields: 'ad_id', time_range: { since: from, until: bkkDate(Date.now()) } });
  const ids = [...new Set(seen.map((x) => x.ad_id))];
  const ads = [];
  /* One call per ad, 10 at a time: Graph v26 dropped the ?ids= batch lookup. */
  for (let i = 0; i < ids.length; i += 10) {
    const got = await Promise.all(ids.slice(i, i + 10).map((id) => meta.call('/' + id, { query: { fields: 'name,created_time,campaign{name}' } })));
    got.forEach((a, j) => ads.push({ id: ids[i + j], name: a.name, launch: bkkDate(a.created_time), campaign: a.campaign && a.campaign.name }));
  }
  const launched = ads.filter((a) => a.launch >= from && a.launch <= to);
  for (const day of [...new Set(launched.map((a) => a.launch))]) {
    const group = launched.filter((a) => a.launch === day);
    const ins = await pages('/' + acct + '/insights', {
      level: 'ad',
      fields: 'ad_id,ad_name,campaign_name,spend,impressions,inline_link_clicks,actions,video_thruplay_watched_actions',
      time_range: { since: day, until: addDays(day, 6) },
      filtering: [{ field: 'ad.id', operator: 'IN', value: group.map((a) => a.id) }],
    });
    for (const x of ins) {
      const k = x.ad_name;
      const v = byName.get(k) || { creative: k, product: product(x.campaign_name), launch: day, spend: 0, impressions: 0, clicks: 0, views3s: 0, thruplays: 0, purchases: 0 };
      if (day < v.launch) v.launch = day;
      v.spend += Number(x.spend) || 0;
      v.impressions += Number(x.impressions) || 0;
      v.clicks += Number(x.inline_link_clicks) || 0;
      v.views3s += act(x.actions, ['video_view']);
      v.thruplays += act(x.video_thruplay_watched_actions, ['video_view']);
      v.purchases += act(x.actions, ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase']);
      byName.set(k, v);
    }
  }
}

async function sheet(body) {
  const url = process.env.DAY7_SHEET_URL;
  if (!url) throw new Error('DAY7_SHEET_URL is not set');
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: process.env.DAY7_SECRET || '', ...body }), redirect: 'follow' });
  const j = await res.json().catch(() => ({ error: 'sheet answered HTTP ' + res.status }));
  if (j.error) throw new Error('sheet: ' + j.error);
  return j;
}

/* Launch days 7 to 10 days back, so a missed morning is picked up the next day. Rows already there are left alone. */
async function pull(now = Date.now()) {
  const today = bkkDate(now);
  const days = [addDays(today, -10), addDays(today, -9), addDays(today, -8), addDays(today, -7)];
  const { rows, failed } = await metaRows(days);
  const r = await sheet({ action: 'add', rows });
  return { launchDays: days, found: rows.length, added: r.added, skipped: r.skipped, failed };
}

/* ---------- Slack posts ---------- */

const link = () => (process.env.DAY7_SHEET_LINK ? `<${process.env.DAY7_SHEET_LINK}|Day 7 sheet>` : 'Day 7 sheet');

async function ownerTag(client, name, cache) {
  if (!name) return '';
  if (/^<@U/.test(name)) return name;
  if (!cache.users) cache.users = (await client.users.list({ limit: 1000 })).members || [];
  const n = name.trim().toLowerCase();
  const u = cache.users.find((m) => !m.deleted && [m.name, m.real_name, m.profile && m.profile.display_name, m.profile && m.profile.real_name].some((x) => (x || '').toLowerCase() === n));
  return u ? `<@${u.id}>` : name;
}

async function mondayText(client, now = Date.now()) {
  const since = addDays(bkkDate(now), -7);
  const { rows } = await sheet({ action: 'list' });
  const open = rows.filter((r) => r.day7 >= since && r.day7 <= bkkDate(now) && (!r.verdict || !r.why));
  if (!open.length) return null;
  const cache = {};
  const lines = [];
  for (const r of open) lines.push(`• ${r.creative} ${(await ownerTag(client, r.owner, cache)) || '(no owner)'}`);
  return `${link()}: ${open.length} rows need your verdict.\n${lines.join('\n')}`;
}

async function fridayText(now = Date.now()) {
  const since = addDays(bkkDate(now), -6);
  const { rows } = await sheet({ action: 'list' });
  const week = rows.filter((r) => r.day7 >= since && r.day7 <= bkkDate(now) && r.verdict);
  const order = ['winner', 'iterate', 'fix', 'kill'];
  const parts = order.map((v) => { const names = week.filter((r) => r.verdict === v).map((r) => r.creative); return `*${v}* ${names.length}${names.length ? ': ' + names.join(', ') : ''}`; });
  return `Day 7 verdicts this week (${link()}):\n${parts.join('\n')}`;
}

/* ---------- schedule ---------- */

let last = {};
async function tick(client, now = Date.now()) {
  const t = new Date(now + BKK);
  const h = t.getUTCHours(), dow = t.getUTCDay(), today = t.toISOString().slice(0, 10);
  const did = [];
  if (h >= 9 && last.pull !== today && process.env.DAY7_SHEET_URL) { last.pull = today; did.push({ pull: await pull(now) }); }
  const posting = process.env.DAY7_SLACK === '1' && process.env.DAY7_CHANNEL;
  if (posting && dow === 1 && h === 9 && last.monday !== today) {
    last.monday = today;
    const text = await mondayText(client, now);
    if (text) await client.chat.postMessage({ channel: process.env.DAY7_CHANNEL, text, unfurl_links: false });
    did.push({ monday: !!text });
  }
  if (posting && dow === 5 && h === 17 && last.friday !== today) {
    last.friday = today;
    await client.chat.postMessage({ channel: process.env.DAY7_CHANNEL, text: await fridayText(now), unfurl_links: false });
    did.push({ friday: true });
  }
  return did;
}

/* Owner commands: "day7 run" pulls now, "day7 preview" shows the Monday and Friday posts without posting. */
async function command(text, client) {
  const m = /^day7\s+(run|preview)\s*$/i.exec(String(text || '').trim());
  if (!m) return null;
  if (m[1].toLowerCase() === 'run') {
    const r = await pull();
    return `Day 7 pull: ${r.found} creatives launched ${r.launchDays[0]} to ${r.launchDays[3]}, ${r.added} added, ${r.skipped} already in the sheet.${r.failed.length ? ` Could not read ${r.failed.join(', ')}.` : ''}`;
  }
  return `*Monday post:*\n${(await mondayText(client)) || '(nothing open)'}\n\n*Friday post:*\n${await fridayText()}`;
}

module.exports = { tick, command, pull, _t: { product, bkkDate, addDays } };
