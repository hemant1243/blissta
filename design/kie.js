#!/usr/bin/env node
'use strict';
/*
 Make ad images on Kie.ai straight from Claude Code, no plugin needed.

   node design/kie.js credits
   node design/kie.js image --prompt "..." [--model nano-banana-pro] [--aspect 4:5] [--res 2K]
                            [--ref https://...jpg ...] [--n 1] [--out design/out/kie] --max-credits 100

 Reads KIE_API_KEY from the environment (never pass it on the command line).
 --max-credits is required: the run stops before submitting if the estimate is higher.
 Prices are Kie credits per image as listed by kie-mcp 5.9.0 (Oct 2026); check with "credits" before and after.
*/
const fs = require('fs');
const path = require('path');

const API = 'https://api.kie.ai';
const PRICE = { 'nano-banana-pro': { '1K': 24, '2K': 24, '4K': 24 }, 'nano-banana-2': { '1K': 8, '2K': 12, '4K': 18 }, 'nano-banana-2-1': { '1K': 4, '2K': 6, '4K': 9 } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function key() {
  const k = process.env.KIE_API_KEY;
  if (!k) throw new Error('KIE_API_KEY is not set in this environment');
  return k;
}

async function kie(method, p, body) {
  const res = await fetch(API + p, { method, headers: { Authorization: 'Bearer ' + key(), 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || (j.code && j.code !== 200)) throw new Error(`Kie ${p}: ${j.msg || j.message || 'HTTP ' + res.status}`);
  return j.data;
}

async function credits() {
  return kie('GET', '/api/v1/chat/credit');
}

async function waitFor(taskId, { timeoutMs = 600000 } = {}) {
  const until = Date.now() + timeoutMs;
  for (let wait = 3000; Date.now() < until; wait = Math.min(wait * 1.5, 15000)) {
    const d = await kie('GET', '/api/v1/jobs/recordInfo?taskId=' + encodeURIComponent(taskId));
    if (d && d.state === 'success') {
      const r = typeof d.resultJson === 'string' ? JSON.parse(d.resultJson) : d.resultJson || {};
      return r.resultUrls || [];
    }
    if (d && d.state === 'fail') throw new Error(`task ${taskId} failed: ${d.failMsg || d.failCode || 'unknown'}`);
    await sleep(wait);
  }
  throw new Error(`task ${taskId} still running after ${timeoutMs / 1000}s`);
}

async function image({ prompt, model = 'nano-banana-pro', aspect = '4:5', res = '2K', refs = [], n = 1, out = 'design/out/kie', maxCredits }) {
  if (!prompt) throw new Error('--prompt is required');
  const unit = (PRICE[model] || {})[res];
  if (unit == null) throw new Error(`no price on file for ${model} at ${res}; add it to PRICE first`);
  const estimate = unit * n;
  if (!(maxCredits >= estimate)) throw new Error(`estimate ${estimate} credits is over --max-credits ${maxCredits || 0}`);
  const input = { prompt, aspect_ratio: aspect, resolution: res, output_format: 'png' };
  if (refs.length) input.image_input = refs;
  fs.mkdirSync(path.resolve(out), { recursive: true });
  const files = [];
  for (let i = 0; i < n; i++) {
    const { taskId } = await kie('POST', '/api/v1/jobs/createTask', { model, input });
    for (const [j, url] of (await waitFor(taskId)).entries()) {
      const file = path.resolve(out, `${new Date().toISOString().slice(0, 10)}-${taskId}-${j}.png`);
      fs.writeFileSync(file, Buffer.from(await (await fetch(url)).arrayBuffer()));
      files.push({ file, url, taskId });
    }
  }
  return { model, res, estimate, files };
}

function args(argv) {
  const o = { refs: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = () => argv[++i];
    if (a === '--prompt') o.prompt = v();
    else if (a === '--model') o.model = v();
    else if (a === '--aspect') o.aspect = v();
    else if (a === '--res') o.res = v();
    else if (a === '--ref') o.refs.push(v());
    else if (a === '--n') o.n = Number(v());
    else if (a === '--out') o.out = v();
    else if (a === '--max-credits') o.maxCredits = Number(v());
  }
  return o;
}

if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2);
  const run = cmd === 'credits' ? credits() : cmd === 'image' ? image(args(rest)) : Promise.reject(new Error('use: credits | image'));
  run.then((r) => console.log(JSON.stringify(r, null, 2))).catch((e) => { console.error(e.message); process.exit(1); });
}

module.exports = { credits, image, waitFor };
