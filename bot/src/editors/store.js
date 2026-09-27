'use strict';
/*
 Small JSON store for the editor dashboard. Lives on the Railway volume (/data) when one is mounted,
 otherwise in bot/data-runtime, which a redeploy wipes. Everything that matters can be rebuilt from
 Meta except the editor table edits, the CSV uploads and the bonus decisions, so those are the
 files worth keeping on the volume.
*/
const fs = require('fs');
const path = require('path');

const DIR = process.env.EDITORS_DATA_DIR || (fs.existsSync('/data') ? '/data/editors' : path.join(__dirname, '..', '..', 'data-runtime'));
fs.mkdirSync(DIR, { recursive: true });

function read(name, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(DIR, name + '.json'), 'utf8')); } catch { return fallback; }
}
function write(name, obj) {
  const p = path.join(DIR, name + '.json');
  fs.writeFileSync(p + '.tmp', JSON.stringify(obj));
  fs.renameSync(p + '.tmp', p);
  return obj;
}

/* Editor table: seeded from the repo, then kept on the volume once an admin edits it. */
const SEED = path.join(__dirname, '..', '..', 'data', 'editors.json');
function editors() {
  const saved = read('editors', null);
  if (saved) return saved;
  try { return JSON.parse(fs.readFileSync(SEED, 'utf8')); } catch { return []; }
}
const saveEditors = (list) => write('editors', list);

/* Insights cache: { fetchedAt, source: {api: iso, csv: iso}, ads: { adId: {...} } } */
const insights = () => read('insights', { ads: {}, fetchedAt: null, api: null, csv: null });
const saveInsights = (obj) => write('insights', obj);

/* Bonus decisions and per-ad overrides made by admins: { adId: { proofAmount, proofStatus, videoUrl, note } } */
const overrides = () => read('overrides', {});
const saveOverrides = (obj) => write('overrides', obj);

module.exports = { DIR, editors, saveEditors, insights, saveInsights, overrides, saveOverrides };
