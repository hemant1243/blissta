'use strict';
const Anthropic = require('@anthropic-ai/sdk');
const { loadKnowledge, systemFor } = require('./brain');
const { guard } = require('./guard');

const client = new Anthropic({ timeout: 90000, maxRetries: 2 });
const WATCHDOG_MS = Number(process.env.WATCHDOG_MS || 150000);
const MODEL = process.env.MODEL || 'claude-opus-5';
const EFFORT = process.env.EFFORT || 'high';
let knowledge = loadKnowledge();
function reload() { knowledge = loadKnowledge(); return knowledge.files; }

/* history: [{role:'user'|'assistant', content:string}], newest last. */
async function answer({ history, tier }) {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 8000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: EFFORT },
    system: systemFor(tier, knowledge),
    messages: history,
  });
  const t0 = Date.now();
  let first = 0, chunks = 0;
  stream.on('streamEvent', () => { if (!first) { first = Date.now() - t0; console.log('[model] first event after', first + 'ms'); } chunks++; });
  let timer;
  const watchdog = new Promise((_, rej) => { timer = setTimeout(() => { try { stream.abort(); } catch {} rej(new Error('model call exceeded ' + WATCHDOG_MS / 1000 + 's (events received: ' + chunks + ')')); }, WATCHDOG_MS); });
  let msg;
  try { msg = await Promise.race([stream.finalMessage(), watchdog]); } finally { clearTimeout(timer); }
  console.log('[model] done in', (Date.now() - t0) + 'ms', msg.model, 'in', msg.usage.input_tokens, 'cached', msg.usage.cache_read_input_tokens || 0, 'out', msg.usage.output_tokens);
  if (msg.stop_reason === 'refusal') return { text: 'I cannot answer that one. Ask DONAAA.', flags: ['refusal'], usage: msg.usage };
  const raw = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  const g = guard(raw);
  return { text: g.text, flags: g.flags, usage: msg.usage, model: msg.model };
}

module.exports = { answer, reload };
