'use strict';
/*
 Tiny HTTP front door. Slack is socket mode, so Donnaa never needed a port until the Creative Ops
 tracker had to push events in. Railway sets PORT and gives the service a public domain.

   GET  /            health, "ok"
   POST /tracker     JSON {events:[...]} or one event, header X-Tracker-Secret must match
                     TRACKER_SECRET. Add ?dry=1 to see what would be posted without posting.
*/
const http = require('http');
const tracker = require('./tracker');

function readBody(req, limit = 1 << 20) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > limit) { reject(new Error('body too large')); req.destroy(); } });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
const send = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };

function start(client) {
  const port = Number(process.env.PORT || 8080);
  const srv = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) return send(res, 200, { ok: true, bot: 'donnaa' });
    if (url.pathname !== '/tracker') return send(res, 404, { error: 'not found' });
    if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
    if (!tracker.verify(req)) return send(res, 401, { error: 'bad secret' });
    let body;
    try { body = JSON.parse((await readBody(req)) || '{}'); } catch (e) { return send(res, 400, { error: 'bad json: ' + e.message }); }
    const events = Array.isArray(body.events) ? body.events : Array.isArray(body) ? body : [body];
    const dryRun = url.searchParams.get('dry') === '1' || body.dry === true;
    const results = [];
    for (const ev of events) {
      try { results.push({ id: ev && ev.id, ...(await tracker.handle(client, ev, { dryRun })) }); }
      catch (e) { console.error('[tracker] event failed:', ev && ev.id, e.message); results.push({ id: ev && ev.id, error: e.message }); }
    }
    const posted = results.filter((r) => r.posted).length;
    if (!dryRun) console.log(`[tracker] ${events.length} event(s), ${posted} posted`, JSON.stringify(results.map((r) => [r.id, r.posted || r.skipped || r.error])));
    send(res, 200, { ok: true, dryRun, results });
  });
  srv.listen(port, () => console.log('[http] listening on', port));
  return srv;
}
module.exports = { start };
