// Print the newest tool result for a given tool name from a Claude Code transcript (.jsonl).
// Usage: node lastresult.js <transcript.jsonl> <toolName> [nth-from-last=1]
const fs = require('fs');
const [file, tool, nth = '1'] = process.argv.slice(2);
const ids = new Map(), out = [];
for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
  if (!line) continue;
  let e; try { e = JSON.parse(line); } catch { continue; }
  const c = e.message?.content;
  if (!Array.isArray(c)) continue;
  for (const b of c) {
    if (b.type === 'tool_use' && b.name === tool) ids.set(b.id, true);
    if (b.type === 'tool_result' && ids.has(b.tool_use_id)) {
      const t = Array.isArray(b.content) ? b.content.map(x => x.text || '').join('') : b.content;
      out.push(t);
    }
  }
}
const r = out[out.length - Number(nth)];
if (!r) { console.error('not found'); process.exit(1); }
process.stdout.write(r);
