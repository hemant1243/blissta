// Compare a new snapshot line with the previous good one; print one alert line per
// new session, or existing session whose IP or country changed. Usage: node diff.cjs <prev.json> <snap.json>
const fs = require('fs');
const [prevFile, snapFile] = process.argv.slice(2);
const snap = JSON.parse(fs.readFileSync(snapFile, 'utf8'));
if (!snap.ok) process.exit(0);
if (!fs.existsSync(prevFile)) { fs.writeFileSync(prevFile, JSON.stringify(snap)); process.exit(0); } // first run = baseline
const prev = new Map(JSON.parse(fs.readFileSync(prevFile, 'utf8')).sessions.map(s => [s.id, s]));
for (const s of snap.sessions) {
  if (s.this_watcher) continue;
  const p = prev.get(s.id);
  const kind = !p ? 'new_session' : p.ip !== s.ip ? 'new_ip' : p.country !== s.country ? 'new_country' : null;
  if (!kind) continue;
  console.log(JSON.stringify({ ts: snap.ts, kind, session: s, before: p ? { ip: p.ip, city: p.city, country: p.country } : null }));
}
fs.writeFileSync(prevFile, JSON.stringify(snap));
