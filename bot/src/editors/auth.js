'use strict';
/*
 Login without passwords. The person types their name or Slack handle, Donnaa DMs them a one-time
 link (15 minutes), the link sets a signed cookie for 30 days. Nobody outside Slack can get in.
 Admins (Hemant, Bruce, Jenn) see everything; editors see their own ads plus the team board.
*/
const crypto = require('crypto');
const store = require('./store');

const SECRET = process.env.EDITORS_SECRET || process.env.TRACKER_SECRET || 'change-me';
const ADMINS = (process.env.EDITORS_ADMINS || 'U0963M61T8V,U0C1G0L4F1T,U0960GV0ZDH').split(',').map((s) => s.trim()).filter(Boolean);
const ADMIN_NAMES = { U0963M61T8V: 'Hemant', U0C1G0L4F1T: 'Bruce', U0960GV0ZDH: 'Jenn' };
const b64 = (s) => Buffer.from(s).toString('base64url');
const sig = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');

function sign(payload, ttlMs) {
  const body = b64(JSON.stringify({ ...payload, exp: Date.now() + ttlMs }));
  return body + '.' + sig(body);
}
function verify(token) {
  const [body, s] = String(token || '').split('.');
  if (!body || !s || sig(body) !== s) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch { return null; }
}
function userFor(id) {
  if (ADMINS.includes(id)) return { id, name: ADMIN_NAMES[id] || 'Admin', role: 'admin', codes: [] };
  const e = store.editors().find((x) => x.slack === id);
  return e ? { id, name: e.name, role: 'editor', codes: e.codes || [] } : null;
}
/* "who" is a name, a code, an @handle or a Slack id. */
function resolve(who) {
  const w = String(who || '').trim().replace(/^@/, '').toLowerCase();
  if (!w) return null;
  if (/^U[A-Z0-9]{8,}$/i.test(w)) return userFor(w.toUpperCase());
  for (const [id, n] of Object.entries(ADMIN_NAMES)) if (n.toLowerCase() === w) return userFor(id);
  const e = store.editors().find((x) => x.name.toLowerCase() === w || x.name.toLowerCase().split(' ')[0] === w || (x.codes || []).some((c) => c.toLowerCase() === w));
  return e && e.slack ? userFor(e.slack) : null;
}
function cookie(req) {
  const m = /(?:^|;\s*)ed_session=([^;]+)/.exec(req.headers.cookie || '');
  const p = m && verify(decodeURIComponent(m[1]));
  return p ? userFor(p.uid) : null;
}
const setCookie = (res, uid) => res.setHeader('set-cookie', `ed_session=${encodeURIComponent(sign({ uid }, 30 * 86400000))}; Path=/editors; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`);
const clearCookie = (res) => res.setHeader('set-cookie', 'ed_session=; Path=/editors; HttpOnly; Secure; SameSite=Lax; Max-Age=0');

const recent = new Map(); /* uid -> [timestamps], 3 links per 10 minutes */
async function sendLink(client, user, base) {
  const now = Date.now(); const list = (recent.get(user.id) || []).filter((t) => now - t < 600000);
  if (list.length >= 3) throw new Error('Too many links requested. Check your Slack DMs from Donnaa.');
  list.push(now); recent.set(user.id, list);
  const url = `${base}/editors/auth?t=${encodeURIComponent(sign({ uid: user.id }, 15 * 60000))}`;
  await client.chat.postMessage({ channel: user.id, text: `Your Editor Dashboard link (15 minutes): ${url}\nIf you did not ask for this, ignore it.`, unfurl_links: false });
}
module.exports = { sign, verify, userFor, resolve, cookie, setCookie, clearCookie, sendLink, ADMINS };
