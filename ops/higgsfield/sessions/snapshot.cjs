// Take one snapshot of the shared login's active Higgsfield sessions and print it as one JSON line.
// Prefers the JSON the sessions page itself loads from Clerk (/v1/me/sessions...); falls back to
// Clerk's own read call in the page. If logged out and --relogin is given, tries the password once.
// Exit codes: 0 ok, 3 logged out (after any relogin attempt).
const { open, die, SESSIONS_URL, onSignIn, passwordLogin } = require('./lib.cjs');
process.on('unhandledRejection', die);
const relogin = process.argv.includes('--relogin');

const iso = v => v == null ? null : new Date(typeof v === 'number' ? v : Date.parse(v)).toISOString();
const norm = s => {
  const a = s.latest_activity || s.latestActivity || {};
  const pick = (...k) => { for (const x of k) if (a[x] != null && a[x] !== '') return a[x]; return null; };
  return {
    id: s.id,
    status: s.status || null,
    device: pick('device_type', 'deviceType') || ((pick('is_mobile', 'isMobile') ? 'Mobile' : null)),
    browser: [pick('browser_name', 'browserName'), pick('browser_version', 'browserVersion')].filter(Boolean).join(' ') || null,
    ip: pick('ip_address', 'ipAddress'),
    city: pick('city'),
    country: pick('country'),
    last_active_utc: iso(s.last_active_at ?? s.lastActiveAt),
    expires_utc: iso(s.expire_at ?? s.expireAt),
  };
};

(async () => {
  const { ctx, page } = await open();
  let api = null, relogged = null;
  page.on('response', async r => {
    if (/clerk\.higgsfield\.ai\/v1\/me\/sessions/.test(r.url()) && r.request().method() === 'GET' && r.ok()) {
      const j = await r.json().catch(() => null);
      const list = Array.isArray(j) ? j : (j && (j.response || j.data));
      if (Array.isArray(list)) api = { url: new URL(r.url()).pathname, list };
    }
  });
  await page.goto(SESSIONS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  if (onSignIn(page) && relogin) {
    relogged = await passwordLogin(page);
    if (relogged === 'ok') { await page.goto(SESSIONS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }); await page.waitForTimeout(8000); }
  }
  const ts = new Date().toISOString();
  if (onSignIn(page)) {
    console.log(JSON.stringify({ ts, ok: false, reason: 'logged_out', relogin: relogged }));
    await ctx.close(); process.exit(3);
  }
  let source = api && ('clerk ' + api.url), raw = api && api.list;
  if (!raw) {
    raw = await page.evaluate(async () => {
      const ss = await window.Clerk.user.getSessions();
      return ss.map(s => ({ id: s.id, status: s.status, last_active_at: +new Date(s.lastActiveAt), expire_at: +new Date(s.expireAt), latest_activity: s.latestActivity }));
    }).catch(() => null);
    source = raw && 'clerk user.getSessions()';
  }
  const current = await page.evaluate(() => window.Clerk && window.Clerk.session && window.Clerk.session.id).catch(() => null);
  if (!raw) { console.log(JSON.stringify({ ts, ok: false, reason: 'no_sessions_data' })); await ctx.close(); process.exit(1); }
  const sessions = raw.map(norm).map(s => ({ ...s, this_watcher: s.id === current }))
    .sort((a, b) => String(b.last_active_utc).localeCompare(String(a.last_active_utc)));
  console.log(JSON.stringify({ ts, ok: true, source, relogin: relogged, count: sessions.length, sessions }));
  await ctx.close();
})();
