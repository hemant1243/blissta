'use strict';
/*
 Editor Performance Dashboard. Served by Donnaa under /editors.

   GET  /editors                     the page (login screen when signed out)
   GET  /editors/auth?t=             one-time link from the Slack DM -> session cookie
   POST /editors/api/login {who}     Donnaa DMs a link
   POST /editors/api/logout
   GET  /editors/api/dashboard       everything the page shows, scoped to the viewer
   admin only:
   PUT  /editors/api/editors [..]    the editor table (name, codes, slack)
   GET  /editors/api/accounts        the ad accounts the token can read
   POST /editors/api/refresh         pull from Meta now
   POST /editors/api/csv             body = Ads Manager export (text/csv)
   POST /editors/api/override        {adId, proofAmount, proofStatus, videoUrl}
 Meta is pulled once a day at META_REFRESH_HOUR_UTC (default 6) when the token is configured.
*/
const fs = require('fs');
const path = require('path');
const store = require('./store');
const meta = require('./meta');
const csv = require('./csv');
const model = require('./model');
const auth = require('./auth');

const PAGE = path.join(__dirname, 'page.html');
const send = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); };
const html = (res, body) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(body); };
function readBody(req, limit = 20 << 20) {
  return new Promise((resolve, reject) => {
    let data = ''; req.on('data', (c) => { data += c; if (data.length > limit) { reject(new Error('body too large')); req.destroy(); } });
    req.on('end', () => resolve(data)); req.on('error', reject);
  });
}
const base = (req) => (process.env.EDITORS_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? 'https://' + process.env.RAILWAY_PUBLIC_DOMAIN : `http://${req.headers.host}`)).replace(/\/$/, '');

let refreshing = null;
async function refresh() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const cur = store.insights();
    const fresh = await meta.pull();
    /* API months replace CSV months for the same ad+month; CSV-only ads stay. */
    const ads = { ...cur.ads };
    for (const [id, ad] of Object.entries(fresh.ads)) {
      const old = ads[id] || { months: {} };
      ads[id] = { ...old, ...ad, months: { ...(old.months || {}), ...ad.months } };
    }
    const out = { ...cur, ads, accounts: fresh.accounts, api: new Date().toISOString(), fetchedAt: new Date().toISOString() };
    store.saveInsights(out);
    console.log('[editors] Meta refresh:', Object.keys(fresh.ads).length, 'ads from', fresh.accounts.map((a) => a.name).join(', '));
    return out;
  })().finally(() => { refreshing = null; });
  return refreshing;
}
function importCsv(text) {
  const parsed = csv.toAds(text);
  const cur = store.insights();
  const ads = { ...cur.ads };
  /* match CSV rows to API ads by id first, then by exact name */
  const byName = {}; for (const a of Object.values(ads)) byName[a.name] = a.id;
  for (const ad of Object.values(parsed.ads)) {
    const id = ads[ad.id] ? ad.id : byName[ad.name] || ad.id;
    const old = ads[id] || { ...ad, months: {} };
    const months = { ...old.months };
    for (const [m, v] of Object.entries(ad.months)) if (!months[m] || old.account === 'csv') months[m] = v; /* never overwrite API months */
    ads[id] = { ...old, delivery: old.delivery || ad.delivery, months };
  }
  const out = { ...cur, ads, csv: new Date().toISOString(), fetchedAt: new Date().toISOString() };
  store.saveInsights(out);
  return { imported: Object.keys(parsed.ads).length, rows: parsed.rows, skipped: parsed.skipped };
}

async function handle(req, res, client) {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname.replace(/\/$/, '') || '/editors';
  const user = auth.cookie(req);
  try {
    if (req.method === 'GET' && p === '/editors') return html(res, fs.readFileSync(PAGE, 'utf8'));
    if (req.method === 'GET' && p === '/editors/auth') {
      const t = auth.verify(url.searchParams.get('t'));
      const u = t && auth.userFor(t.uid);
      if (!u) return html(res, '<p style="font-family:sans-serif;padding:40px">This link expired or is not valid. Go back to the dashboard and ask for a new one.</p>');
      auth.setCookie(res, u.id);
      res.writeHead(302, { location: '/editors' }); return res.end();
    }
    if (req.method === 'POST' && p === '/editors/api/login') {
      const body = JSON.parse((await readBody(req, 4096)) || '{}');
      const u = auth.resolve(body.who);
      if (!u) return send(res, 404, { error: 'No editor or admin with that name. Ask Hemant to add you.' });
      await auth.sendLink(client, u, base(req));
      return send(res, 200, { ok: true, name: u.name });
    }
    if (req.method === 'POST' && p === '/editors/api/logout') { auth.clearCookie(res); return send(res, 200, { ok: true }); }
    if (!user) return send(res, 401, { error: 'sign in' });
    const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);
    if (req.method === 'GET' && p === '/editors/api/dashboard') {
      const raw = store.insights();
      return send(res, 200, { ...model.dashboard({ raw, editors: store.editors(), overrides: store.overrides(), user, month }), metaConfigured: meta.configured(), accounts: user.role === 'admin' ? raw.accounts || [] : undefined });
    }
    if (user.role !== 'admin') return send(res, 403, { error: 'admins only' });
    if (req.method === 'PUT' && p === '/editors/api/editors') {
      const list = JSON.parse(await readBody(req, 1 << 20));
      if (!Array.isArray(list)) return send(res, 400, { error: 'array expected' });
      const clean = list.map((e) => ({ name: String(e.name || '').trim(), codes: [].concat(e.codes || []).map((c) => String(c).trim().toUpperCase()).filter(Boolean), slack: String(e.slack || '').trim() })).filter((e) => e.name);
      store.saveEditors(clean); return send(res, 200, { ok: true, editors: clean });
    }
    if (req.method === 'GET' && p === '/editors/api/accounts') {
      if (!meta.configured()) return send(res, 400, { error: 'Meta token not set on the server.' });
      return send(res, 200, { accounts: await meta.accounts() });
    }
    if (req.method === 'POST' && p === '/editors/api/refresh') {
      if (!meta.configured()) return send(res, 400, { error: 'Meta is not configured on the server yet (META_ACCESS_TOKEN).' });
      const out = await refresh(); return send(res, 200, { ok: true, ads: Object.keys(out.ads).length, accounts: out.accounts, fetchedAt: out.fetchedAt });
    }
    if (req.method === 'POST' && p === '/editors/api/csv') { const r = importCsv(await readBody(req)); return send(res, 200, { ok: true, ...r }); }
    if (req.method === 'POST' && p === '/editors/api/override') {
      const b = JSON.parse((await readBody(req, 8192)) || '{}');
      if (!b.adId) return send(res, 400, { error: 'adId required' });
      const ov = store.overrides(); const cur = ov[b.adId] || {};
      if ('proofAmount' in b) cur.proofAmount = b.proofAmount ? Number(b.proofAmount) : null;
      if ('proofStatus' in b) cur.proofStatus = String(b.proofStatus || '');
      if ('videoUrl' in b) cur.videoUrl = String(b.videoUrl || '');
      ov[b.adId] = cur; store.saveOverrides(ov); return send(res, 200, { ok: true, override: cur });
    }
    return send(res, 404, { error: 'not found' });
  } catch (e) {
    console.error('[editors]', p, e.message);
    return send(res, 500, { error: e.message });
  }
}

/* Once a day, when the token is there. Also once at boot if the cache is empty or stale. */
function schedule() {
  console.log('[editors] data dir', store.DIR, fs.existsSync('/data') ? '(volume)' : '(no volume, wiped on deploy)');
  if (!meta.configured()) { console.log('[editors] Meta not configured, CSV upload only'); return; }
  const hour = Number(process.env.META_REFRESH_HOUR_UTC || 6);
  let lastDay = '';
  let lastFail = 0; // after a failed pull wait 6h before trying again, so a blocked token is not hammered
  const tick = async () => {
    const now = new Date(); const day = now.toISOString().slice(0, 10);
    const cur = store.insights();
    const stale = !cur.api || Date.now() - new Date(cur.api).getTime() > 26 * 3600000;
    if (((now.getUTCHours() === hour && lastDay !== day) || stale) && Date.now() - lastFail > 6 * 3600000) {
      lastDay = day;
      try { await refresh(); lastFail = 0; } catch (e) { lastFail = Date.now(); console.error('[editors] Meta refresh failed, next try in 6h:', e.message); }
    }
  };
  setTimeout(tick, 20000); setInterval(tick, 10 * 60000);
}
module.exports = { handle, schedule, refresh, importCsv };
