'use strict';
/*
 Blissta results feed for the Winners Vault ("feed 3").

 Once a week (Tuesday 6am Bangkok, before the Wednesday vault run) and on "vault results" from an owner:
   1. Pull the last 30 days from Meta at ad level across every account the token sees. Copies of
      one creative ("- Copy", "- Copy 2", date tails) are merged by name.
   2. Every creative with $100+ spend gets a verdict against break-even 1.4 (same ladder as Day 7).
   3. Creatives not tagged before are looked at once by Claude: the image, or 6 frames of the video,
      plus the copy. Tags follow the vault's guide (funnel, awareness, hook, format, story beats...).
   4. Everything is stored as messages in the private channel #blissta-vault-results:
        VAULT|<key>        one per creative, tags + media links + a small thumbnail (never changes)
        VAULTNUMS|<date>   this week's numbers for every creative, JSON lines (one or more messages)
        VAULTSUM|<date>    what our winners share vs our losers, also DMed to the owner
      The weekly Claude vault task reads this channel and merges it into the Winners Vault page.
   Railway wipes the disk on deploy, so the channel is the memory.

 Env: META_ACCESS_TOKEN (as meta.js), VAULT_RESULTS_ENABLED=0 to switch the schedule off,
      VAULT_MAX_NEW (default 40 new creatives tagged per run), VAULT_MODEL (default MODEL).
*/
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const Anthropic = require('@anthropic-ai/sdk');
const meta = require('./meta');
const topads = require('./topads');

const CHANNEL_NAME = 'blissta-vault-results';
const OWNER = (process.env.OWNER_SLACK_IDS || 'U0963M61T8V').split(',')[0].trim();
const MIN_SPEND = 100;
const BREAK_EVEN = 1.4;
const DAYS = 30;
const MAX_NEW = Number(process.env.VAULT_MAX_NEW || 40);
const MODEL = process.env.VAULT_MODEL || process.env.MODEL || 'claude-opus-5';
const BKK = 7 * 3600e3;
const PURCHASE = ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase'];
const act = (list, types) => { for (const t of types) { const a = (list || []).find((x) => x.action_type === t); if (a) return Number(a.value) || 0; } return 0; };
const norm = (n) => String(n || '').replace(/\s*-\s*Copy(\s*\d+)?/gi, '').replace(/-\d{2}-\d{2}$/, '').trim();
const keyOf = (n) => norm(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || 'unnamed';
const PRODUCTS = [[/corbel|corvael|corvel|natto/i, 'Corbel'], [/painbloc|\bpea\b/i, 'PainBloc'], [/ultra ?blue|gumm|mbg/i, 'Ultra Blue'], [/methylene|\bmb\b/i, 'MB'], [/aeon/i, 'Aeon'], [/gluco/i, 'Gluco Gone']];
const product = (s) => (PRODUCTS.find(([re]) => re.test(s || '')) || [null, ''])[1];

/* Same ladder as the Day 7 sheet, 1.4 is break-even. */
function verdict({ spend, roas, purchases, ctr }) {
  if (spend < MIN_SPEND) return 'no read';
  if (roas >= 2) return 'breakthrough';
  if (roas >= 1.8) return 'scale winner';
  if (roas >= BREAK_EVEN) return 'winner';
  if (roas >= 1) return 'iterate';
  if (purchases > 0 && ctr >= 0.02) return 'fix';
  return 'kill';
}

/* ---------- Meta ---------- */
async function pages(p, query) {
  const out = [];
  let r = await meta.call(p, { query: { limit: '500', ...query } });
  for (;;) {
    out.push(...(r.data || []));
    if (!r.paging || !r.paging.next) return out;
    r = await (await fetch(r.paging.next)).json();
    if (r.error) throw new Error('Meta ' + r.error.message);
  }
}

async function pull() {
  const until = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const since = new Date(Date.now() - DAYS * 864e5).toISOString().slice(0, 10);
  const groups = new Map();
  const accounts = await meta.adAccounts();
  if (!accounts.length) throw new Error('no Meta ad accounts visible to the token');
  for (const a of accounts) {
    let rows;
    try {
      rows = await pages('/' + a.id + '/insights', { level: 'ad', fields: 'ad_id,ad_name,campaign_name,spend,impressions,inline_link_clicks,actions,action_values,video_thruplay_watched_actions', time_range: JSON.stringify({ since, until }) });
    } catch (e) { console.error('[results]', a.id, e.message); continue; }
    for (const x of rows) {
      const k = keyOf(x.ad_name);
      const g = groups.get(k) || { key: k, name: norm(x.ad_name), campaigns: new Set(), account: a.name, spend: 0, value: 0, purchases: 0, impressions: 0, clicks: 0, views3s: 0, thruplays: 0, top: null, topSpend: -1, copies: 0 };
      const s = Number(x.spend) || 0;
      g.spend += s; g.value += act(x.action_values, PURCHASE); g.purchases += act(x.actions, PURCHASE);
      g.impressions += Number(x.impressions) || 0; g.clicks += Number(x.inline_link_clicks) || 0;
      g.views3s += act(x.actions, ['video_view']); g.thruplays += act(x.video_thruplay_watched_actions, ['video_view']);
      g.campaigns.add(x.campaign_name || ''); g.copies++;
      if (s > g.topSpend) { g.topSpend = s; g.top = x.ad_id; }
      groups.set(k, g);
    }
  }
  const r2 = (n) => Math.round(n * 100) / 100;
  const list = [...groups.values()].filter((g) => g.spend >= MIN_SPEND).map((g) => {
    const ctr = g.impressions ? g.clicks / g.impressions : 0;
    const m = {
      key: g.key, name: g.name, ad_id: g.top, account: g.account, campaigns: [...g.campaigns].filter(Boolean).slice(0, 5),
      product: product([g.name, ...g.campaigns].join(' ')), copies: g.copies,
      spend: r2(g.spend), roas: g.spend ? r2(g.value / g.spend) : 0, purchases: Math.round(g.purchases),
      cpa: g.purchases ? r2(g.spend / g.purchases) : null, ctr: r2(ctr * 100),
      hook_rate: g.views3s && g.impressions ? r2((g.views3s / g.impressions) * 100) : null,
      hold_rate: g.thruplays && g.views3s ? r2((g.thruplays / g.views3s) * 100) : null,
      impressions: g.impressions,
    };
    m.verdict = verdict({ spend: m.spend, roas: m.roas, purchases: m.purchases, ctr });
    return m;
  }).sort((a, b) => b.spend - a.spend);
  return { since, until, list };
}

/* ---------- media ---------- */
let FFMPEG = null;
try { FFMPEG = require('ffmpeg-static'); } catch { FFMPEG = null; }
const run = (bin, args, timeout = 120000) => new Promise((res, rej) => execFile(bin, args, { timeout, maxBuffer: 1 << 26 }, (e, out, err) => (e && !String(err).includes('Duration') ? rej(new Error(String(err || e.message).slice(-300))) : res(String(err || '') + String(out || '')))));

async function fetchBuf(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('download ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}
const mediaType = (buf) => (buf[0] === 0x89 ? 'image/png' : buf[0] === 0x47 ? 'image/gif' : buf.slice(8, 12).toString() === 'WEBP' ? 'image/webp' : 'image/jpeg');

/* Up to 6 frames (0.5s, 2s, 4s, 25%, 55%, 85%) plus duration and a small thumbnail, via ffmpeg-static. */
async function videoFrames(url) {
  if (!FFMPEG) throw new Error('ffmpeg-static not installed');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-'));
  try {
    const file = path.join(dir, 'v.mp4');
    fs.writeFileSync(file, await fetchBuf(url));
    const info = await run(FFMPEG, ['-hide_banner', '-i', file], 30000).catch((e) => e.message);
    const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(info);
    const dur = m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
    const ts = [0.5, 2, 4, dur * 0.25, dur * 0.55, dur * 0.85].filter((t) => !dur || t < dur);
    const frames = [];
    for (const [i, t] of ts.entries()) {
      const f = path.join(dir, `f${i}.jpg`);
      try { await run(FFMPEG, ['-v', 'error', '-y', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', 'scale=-2:480', '-q:v', '5', f]); frames.push(fs.readFileSync(f)); } catch {}
    }
    const th = path.join(dir, 'th.jpg');
    let thumb = '';
    try { await run(FFMPEG, ['-v', 'error', '-y', '-ss', '0.5', '-i', file, '-frames:v', '1', '-vf', 'scale=-2:240', '-q:v', '9', th]); thumb = 'data:image/jpeg;base64,' + fs.readFileSync(th).toString('base64'); } catch {}
    return { dur, frames, thumb };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

async function imageThumb(buf) {
  if (!FFMPEG) return '';
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vi-'));
  try {
    const a = path.join(dir, 'a'); const b = path.join(dir, 'b.jpg');
    fs.writeFileSync(a, buf);
    await run(FFMPEG, ['-v', 'error', '-y', '-i', a, '-vf', 'scale=240:-2', '-q:v', '9', b]);
    return 'data:image/jpeg;base64,' + fs.readFileSync(b).toString('base64');
  } catch { return ''; } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

/* ---------- tagging ---------- */
const GUIDE = `You are a senior direct-response creative strategist tagging one of Blissta's OWN Meta ads so the team learns why it won or lost. Blissta sells supplements to US buyers 55+: Corbel nattokinase (ED, prostate, heart, liver), PainBloc PEA (nerve pain, fibro, post-surgery), Ultra Blue methylene blue gummies (fatigue, fog, fibro pain). Only describe what is really in the frames and the copy. Do not judge the numbers; you are not given them.

Return ONE JSON object, no prose, with these keys:
kind ("static", "static_long_copy", "native" or "video"; native = organic-looking photo + long story copy),
niche, funnel ("TOF"/"MOF"/"BOF"), awareness (unaware/problem_aware/solution_aware/product_aware/most_aware), sophistication (1-5),
angle (reason to buy, one line), door (who + trigger moment),
hook_text (main on-image headline, or first spoken/on-screen line for video, word for word),
hook_type (list of 1-2 from: callout_question, reframe, confession_story, warning, number_stat, us_vs_them, secret_discovery, authority, testimonial_quote, offer_led, curiosity_gap, mechanism, enemy_named, identity, before_after, social_proof, humor, news, pattern_interrupt, mid_action),
format (images: benefit_list, fact_sheet, us_vs_them, before_after, timeline, giant_number, review_screenshot, text_screenshot, news_advertorial, product_hero, handwritten, mechanism_diagram, meme, lifestyle_photo, ugc_photo, offer_price, announcement_apology, checklist, comparison_table, doctor_authority, infographic, collage, other; videos: ugc_talking_head, ugc_testimonial, doctor_expert, podcast_clip, green_screen, drama_skit, song_music_video, animation_3d, ai_character, street_interview, voiceover_broll, text_slideshow, news_report, reaction_split, ranking_tier_list, comment_reply, unboxing_demo, before_after_reveal, founder_story, other),
visual (what the first frame or image shows, one line), visual_style or production (photo_native/designed_graphic/illustration_3d/screenshot/mixed for images; phone_ugc/studio/ai_generated/stock_plus_vo/animation/mixed for video),
product_shown (none/small/medium/large) or product_first_seen for video (first_3s/first_25pct/middle/last_25pct/never),
emotion (list of 1-2 from: fear, frustration, hope, vindication, curiosity, shame, anger_at_system, relief, desire, humor, urgency, trust),
proof (list), villain, mechanism, offer,
story_beats (6-10 short beats joined by " > " for natives and videos, else ""), narrator (for natives and videos, else ""),
why_it_could_work (2 sentences: the element meant to stop the scroll and the one meant to close),
weak_spot (1 sentence: the most likely reason it would underperform),
confidence (1-5), notes.
No em dashes. Plain English.`;

let anthropic = null;
async function tag(m, media) {
  anthropic = anthropic || new Anthropic({ timeout: 120000, maxRetries: 2 });
  const content = [];
  for (const im of media.images) content.push({ type: 'image', source: { type: 'base64', media_type: mediaType(im), data: im.toString('base64') } });
  content.push({ type: 'text', text: [
    media.video ? `VIDEO, ${Math.round(media.dur || 0)}s. The images are frames at 0.5s, 2s, 4s, 25%, 55%, 85%.` : 'IMAGE AD.',
    `Ad name: ${m.name}`, `Product guess from name: ${m.product || 'unknown'}`,
    `Headline(s): ${(media.titles || []).join(' | ') || '(none)'}`,
    `Primary text:\n${(media.bodies || []).join('\n---\n').slice(0, 6000) || '(none)'}`,
  ].join('\n') });
  const msg = await anthropic.messages.create({ model: MODEL, max_tokens: 2500, system: GUIDE, messages: [{ role: 'user', content }] });
  const txt = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const j = txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1);
  return JSON.parse(j);
}

async function describe(m) {
  const c = await topads.creativeOf(m.ad_id);
  const media = { titles: c.titles, bodies: c.bodies, images: [], video: false, dur: 0, thumb: '' };
  const vid = (c.videos || []).find((v) => /^https?:\/\/.*\.(mp4|mov)|fbcdn|video/.test(v || '') && !/facebook\.com\//.test(v));
  if (vid) {
    try { const f = await videoFrames(vid); media.video = true; media.dur = f.dur; media.images = f.frames; media.thumb = f.thumb; } catch (e) { console.error('[results] frames', m.key, e.message); }
  }
  if (!media.images.length) {
    for (const u of [...(c.images || []), c.thumb].filter(Boolean).slice(0, 2)) {
      try { const b = await fetchBuf(u); media.images.push(b); if (!media.thumb) media.thumb = await imageThumb(b); } catch {}
    }
    if (vid && !media.video) media.video = true;
  }
  if (!media.images.length) throw new Error('no image or video could be loaded');
  const tags = await tag(m, media);
  return { tags, media: { preview: c.preview, image: (c.images || [])[0] || c.thumb || '', video: vid || '', duration: Math.round(media.dur || 0), thumb: media.thumb, headline: (c.titles || [])[0] || '', body: (c.bodies || [])[0] || '' } };
}

/* ---------- Slack store ---------- */
let channelId = null;
async function channel(client) {
  if (channelId) return channelId;
  let cursor;
  do {
    const r = await client.conversations.list({ types: 'public_channel,private_channel', exclude_archived: true, limit: 200, cursor });
    const hit = (r.channels || []).find((c) => c.name === CHANNEL_NAME);
    if (hit) { channelId = hit.id; if (!hit.is_member && !hit.is_private) await client.conversations.join({ channel: hit.id }).catch(() => {}); return channelId; }
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor);
  const made = await client.conversations.create({ name: CHANNEL_NAME, is_private: true });
  channelId = made.channel.id;
  await client.conversations.setPurpose({ channel: channelId, purpose: 'Donnaa data store for the Winners Vault: every Blissta ad with $100+ spend, tagged once, numbers weekly. Machine posts, do not chat here.' }).catch(() => {});
  await client.conversations.invite({ channel: channelId, users: OWNER }).catch(() => {});
  console.log('[results] created #' + CHANNEL_NAME, channelId);
  return channelId;
}

async function history(client, ch) {
  const out = []; let cursor; let n = 0;
  do {
    const r = await client.conversations.history({ channel: ch, limit: 200, cursor });
    out.push(...(r.messages || []));
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor && ++n < 50);
  return out;
}

const block = (o) => '```' + JSON.stringify(o) + '```';
const parseBlock = (t) => { const i = t.indexOf('```'); const j = t.lastIndexOf('```'); if (i < 0 || j <= i) return null; try { return JSON.parse(t.slice(i + 3, j)); } catch { return null; } };

/* ---------- summary ---------- */
async function summary(rows) {
  const tagged = rows.filter((r) => r.tags);
  const win = tagged.filter((r) => ['breakthrough', 'scale winner', 'winner'].includes(r.verdict));
  const lose = tagged.filter((r) => ['kill', 'fix'].includes(r.verdict));
  if (win.length + lose.length < 4) return '';
  anthropic = anthropic || new Anthropic({ timeout: 120000, maxRetries: 2 });
  const slim = (r) => ({ name: r.name, product: r.product, verdict: r.verdict, spend: r.spend, roas: r.roas, hook_rate: r.hook_rate, kind: r.tags.kind, format: r.tags.format, funnel: r.tags.funnel, awareness: r.tags.awareness, hook_type: r.tags.hook_type, hook: r.tags.hook_text, angle: r.tags.angle, emotion: r.tags.emotion });
  const msg = await anthropic.messages.create({ model: MODEL, max_tokens: 1200,
    system: 'You write for DONAAA, founder of Blissta. Plain English, short lines, no em dashes, no fluff, no headers beyond the ones asked. Only claim a pattern when at least 2 ads show it, and say how many.',
    messages: [{ role: 'user', content: `Our Meta ads from the last 30 days, tagged. Break-even ROAS is 1.4.\nWINNERS:\n${JSON.stringify(win.map(slim))}\nLOSERS:\n${JSON.stringify(lose.map(slim))}\n\nWrite max 12 lines:\n*What our winners share* (3-4 lines)\n*What our losers share* (3-4 lines)\n*Do more of / stop doing* (2-3 lines, specific: format, hook type, angle, product)\n` }] });
  return msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
}

/* ---------- run ---------- */
async function runOnce(client, { dry = false, maxNew = MAX_NEW } = {}) {
  const { since, until, list } = await pull();
  const ch = await channel(client);
  const msgs = await history(client, ch);
  const known = new Map();
  for (const m of msgs) {
    const t = m.text || '';
    if (t.startsWith('VAULT|')) { const k = t.slice(6, t.indexOf('\n') > 0 ? t.indexOf('\n') : undefined).trim(); const o = parseBlock(t); if (o) known.set(k, o); }
  }
  const before = list.filter((m) => known.has(m.key)).length;
  let tagged = 0; const failed = [];
  for (const m of list) {
    if (known.has(m.key)) { m.tags = known.get(m.key).tags; continue; }
    if (tagged >= maxNew || dry) continue;
    try {
      const d = await describe(m);
      const rec = { key: m.key, name: m.name, product: m.product, ad_id: m.ad_id, tagged_at: until, tags: d.tags, media: d.media };
      let text = 'VAULT|' + m.key + '\n' + block(rec);
      if (text.length > 39000) { rec.media.thumb = ''; rec.media.body = rec.media.body.slice(0, 8000); text = 'VAULT|' + m.key + '\n' + block(rec); }
      await client.chat.postMessage({ channel: ch, text, unfurl_links: false, unfurl_media: false });
      m.tags = d.tags; known.set(m.key, rec); tagged++;
    } catch (e) { failed.push(m.name + ': ' + e.message); console.error('[results] tag', m.key, e.message); }
  }
  const nums = list.map(({ tags, ...rest }) => rest);
  if (!dry) {
    let chunk = []; let size = 0; let part = 1;
    const flush = async () => { if (!chunk.length) return; await client.chat.postMessage({ channel: ch, text: `VAULTNUMS|${until}|${since}|part${part++}\n` + '```' + chunk.join('\n') + '```', unfurl_links: false }); chunk = []; size = 0; };
    for (const n of nums) { const l = JSON.stringify(n); if (size + l.length > 35000) await flush(); chunk.push(l); size += l.length + 1; }
    await flush();
  }
  let sum = '';
  try { sum = await summary(list); } catch (e) { console.error('[results] summary', e.message); }
  if (sum && !dry) {
    await client.chat.postMessage({ channel: ch, text: `VAULTSUM|${until}\n${sum}` });
    const head = `Our ads, last 30 days (${since} to ${until}): ${list.length} with $100+ spend, ${list.filter((r) => ['breakthrough', 'scale winner', 'winner'].includes(r.verdict)).length} at or above 1.4. ${tagged} new ones broken down for the vault.`;
    await client.chat.postMessage({ channel: OWNER, text: head + '\n\n' + sum, unfurl_links: false });
  }
  return { since, until, creatives: list.length, newlyTagged: tagged, alreadyTagged: before, failed: failed.slice(0, 10), dry };
}

/* Weekly: Tuesday 6am Bangkok. Checked every 30 min; the channel remembers the last run. */
let running = false;
async function tick(client) {
  if (process.env.VAULT_RESULTS_ENABLED === '0' || running) return null;
  const now = new Date(Date.now() + BKK);
  if (now.getUTCDay() !== 2 || now.getUTCHours() < 6) return null;
  const today = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const ch = await channel(client);
  const r = await client.conversations.history({ channel: ch, limit: 50 });
  if ((r.messages || []).some((m) => (m.text || '').startsWith('VAULTNUMS|' + today))) return null;
  running = true;
  try { return await runOnce(client); } finally { running = false; }
}

/* "vault results" (owner): run now. "vault results dry": numbers only, nothing posted or tagged. */
async function command(text, client) {
  const m = /^vault results(\s+dry)?\s*$/i.exec(String(text || '').trim());
  if (!m) return null;
  if (running) return 'Already running, give it a few minutes.';
  running = true;
  try {
    const r = await runOnce(client, { dry: !!m[1] });
    return `${r.dry ? 'Dry run, nothing posted. ' : ''}${r.since} to ${r.until}: ${r.creatives} creatives with $100+ spend. ${r.alreadyTagged} already in the vault, ${r.newlyTagged} newly broken down.${r.failed.length ? '\nFailed: ' + r.failed.join('; ') : ''}`;
  } finally { running = false; }
}

module.exports = { tick, command, runOnce, _t: { verdict, keyOf, norm, product, parseBlock } };
