// Match a Higgsfield prompt to the creative brief it was made for, using the spoken lines in brief_index.json.
// match(prompt) -> { video_id, title, editor, brief_url, lines } or null
const fs = require('fs');
const path = require('path');
const index = JSON.parse(fs.readFileSync(path.join(__dirname, 'brief_index.json'), 'utf8'));
const words = s => (s || '').toLowerCase().replace(/[’']/g, '').match(/[a-z0-9]+/g) || [];
// spoken lines are the useful part of a prompt: quoted text, else the whole prompt
const quotes = p => ((p || '').match(/"[^"]{8,}"/g) || []).map(words).filter(q => q.filter(x => x.length > 2).length >= 3);
const spoken = p => { const q = (p || '').match(/"[^"]{8,}"/g); return q ? q.join(' ') : p; };

function match(prompt) {
  const have = new Set(words(spoken(prompt)));
  const found = [];
  for (const b of index) {
    let hits = 0;
    // a short quoted line in the prompt that sits inside one of the brief's lines also counts
    for (const q of quotes(prompt)) {
      const qw = q.filter(x => x.length > 2);
      if ((b.key_lines || []).some(l => { const lw = new Set(words(l)); return qw.filter(x => lw.has(x)).length / qw.length >= 0.8 && qw.length >= 3; })) hits++;
    }
    for (const line of b.key_lines || []) {
      const w = words(line).filter(x => x.length > 2);
      if (w.length < 4) continue;
      if (w.filter(x => have.has(x)).length / w.length >= 0.8) hits++;
    }
    if (hits) found.push({ hits, b });
  }
  if (!found.length) return null;
  found.sort((x, y) => y.hits - x.hits);
  const top = found.filter(f => f.hits === found[0].hits);
  const out = f => ({ video_id: f.b.video_id, title: f.b.title, editor: f.b.editor || 'no editor assigned', brief_url: f.b.brief_url });
  // one shared short line can fit several briefs: only call it sure when one brief wins on 2+ lines
  return { ...out(top[0]), lines: found[0].hits, sure: top.length === 1 && found[0].hits >= 2, also: top.slice(1, 4).map(out) };
}
module.exports = { match };
if (require.main === module) console.log(JSON.stringify(match(fs.readFileSync(0, 'utf8'))));
