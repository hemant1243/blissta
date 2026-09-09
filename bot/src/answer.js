'use strict';
const Anthropic = require('@anthropic-ai/sdk');
const { loadKnowledge, systemFor } = require('./brain');
const { guard } = require('./guard');

const client = new Anthropic();
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
  const msg = await stream.finalMessage();
  if (msg.stop_reason === 'refusal') return { text: 'I cannot answer that one. Ask DONAAA.', flags: ['refusal'], usage: msg.usage };
  const raw = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  const g = guard(raw);
  return { text: g.text, flags: g.flags, usage: msg.usage, model: msg.model };
}

module.exports = { answer, reload };
