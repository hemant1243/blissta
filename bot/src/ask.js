#!/usr/bin/env node
'use strict';
/* Test harness. node src/ask.js "question" [--team] */
require('dotenv').config();
const { answer } = require('./answer');
const args = process.argv.slice(2);
const tier = args.includes('--team') ? 'team' : 'owner';
const q = args.filter((a) => !a.startsWith('--')).join(' ');
if (!q) { console.error('usage: node src/ask.js "question" [--team]'); process.exit(1); }
answer({ history: [{ role: 'user', content: q }], tier }).then((r) => {
  console.log(r.text);
  if (r.flags.length) console.error('\n[guard flags: ' + r.flags.join(', ') + ']');
  console.error(`\n[${r.model} · in ${r.usage.input_tokens} · cached ${r.usage.cache_read_input_tokens || 0} · out ${r.usage.output_tokens}]`);
}).catch((e) => { console.error(e); process.exit(1); });
