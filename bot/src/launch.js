'use strict';
/*
 The "launch ads" command for Slack.

 Someone attaches images or videos to a Slack message and writes:

   @Donnaa launch
   adset: 1234567890
   link: https://blissta.co/corvael
   copy: Most people over 55 have never checked this.
   headline: The 28-Day Artery Reset
   cta: SHOP_NOW

 Everything lands in Meta as PAUSED. Owners only: this spends nobody's money
 but it does write into the live ad account, so it is not for the whole team.
*/
const meta = require('./meta');

const CTAS = new Set(['SHOP_NOW', 'LEARN_MORE', 'SIGN_UP', 'GET_OFFER', 'ORDER_NOW', 'BUY_NOW', 'SEE_MORE', 'APPLY_NOW', 'CONTACT_US', 'SUBSCRIBE']);
const MAX_FILES = 20;
const MAX_BYTES = 200 * 1024 * 1024;

const isLaunch = (text) => /^\s*launch\b/i.test(text || '');

/* Pull `key: value` lines out of the message. Values may run to end of line. */
function parse(text) {
  const out = {};
  for (const line of (text || '').split('\n')) {
    const m = line.match(/^\s*(adset|adset_id|link|url|copy|message|primary|headline|title|description|desc|cta|name)\s*:\s*(.+?)\s*$/i);
    if (!m) continue;
    const k = m[1].toLowerCase();
    const v = m[2].trim();
    if (k === 'adset' || k === 'adset_id') out.adsetId = v;
    else if (k === 'link' || k === 'url') out.link = v;
    else if (k === 'copy' || k === 'message' || k === 'primary') out.message = v;
    else if (k === 'headline' || k === 'title') out.headline = v;
    else if (k === 'description' || k === 'desc') out.description = v;
    else if (k === 'cta') out.cta = v.toUpperCase().replace(/\s+/g, '_');
    else if (k === 'name') out.name = v;
  }
  return out;
}

/* Slack strips angle brackets round URLs and sometimes appends |label. */
const cleanUrl = (u) => (u || '').replace(/^</, '').replace(/>$/, '').split('|')[0];

function validate(spec, files) {
  const problems = [];
  if (!spec.adsetId) problems.push('`adset:` is missing. Paste the ad set ID from Ads Manager.');
  else if (!/^\d+$/.test(spec.adsetId)) problems.push('`adset:` should be digits only, got `' + spec.adsetId + '`.');
  if (!spec.link) problems.push('`link:` is missing. That is where the ad sends people.');
  else if (!/^https?:\/\//i.test(spec.link)) problems.push('`link:` must start with http:// or https://');
  if (!spec.message) problems.push('`copy:` is missing. That is the primary text.');
  if (spec.cta && !CTAS.has(spec.cta)) problems.push('`cta:` ' + spec.cta + ' is not one Meta accepts. Try ' + [...CTAS].slice(0, 4).join(', ') + '.');
  if (!files.length) problems.push('No files attached. Drag the statics or videos onto the message.');
  if (files.length > MAX_FILES) problems.push('That is ' + files.length + ' files. Cap is ' + MAX_FILES + ' per launch.');
  return problems;
}

const kindOf = (f) => (/(^video\/)|(\.(mp4|mov|m4v)$)/i.test(f.mimetype + ' ' + f.name) ? 'video' : 'image');

async function download(file, botToken) {
  const res = await fetch(file.url_private_download || file.url_private, { headers: { Authorization: 'Bearer ' + botToken } });
  if (!res.ok) throw new Error('Slack would not hand over ' + file.name + ' (HTTP ' + res.status + ')');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error(file.name + ' is ' + Math.round(buf.length / 1048576) + 'MB, over the ' + Math.round(MAX_BYTES / 1048576) + 'MB cap');
  /* Slack serves an HTML login page instead of a 403 when the token cannot read files. */
  if (buf.slice(0, 15).toString().toLowerCase().includes('<!doctype html')) throw new Error('Slack returned a login page for ' + file.name + '. The bot needs the files:read scope.');
  return buf;
}

/*
 Runs the whole thing and reports back through `say`.
 Returns the per-file results so callers can log them.
*/
async function run({ text, files, botToken, say, thread_ts }) {
  const spec = parse(text);
  spec.link = cleanUrl(spec.link);
  files = (files || []).filter((f) => /^(image|video)\//.test(f.mimetype || '') || /\.(jpe?g|png|gif|mp4|mov|m4v)$/i.test(f.name || ''));

  const problems = validate(spec, files);
  if (problems.length) {
    await say({ thread_ts, text: 'I did not launch anything. Fix these first:\n' + problems.map((p) => '• ' + p).join('\n') + '\n\nShape it like this:\n```\nlaunch\nadset: 1234567890\nlink: https://blissta.co/corvael\ncopy: Most people over 55 have never checked this.\nheadline: The 28-Day Artery Reset\ncta: SHOP_NOW\n```' });
    return null;
  }

  let acct;
  try {
    const who = await meta.whoami();
    acct = who.account;
    if (!meta.accountUsable(acct)) {
      await say({ thread_ts, text: 'Ad account ' + acct.name + ' is status ' + acct.account_status + ', not active. Nothing uploaded.' });
      return null;
    }
    if (who.page && who.page.error) {
      await say({ thread_ts, text: 'The token cannot reach the Page: ' + who.page.error + '\nEvery ad needs a Page identity, so I stopped before uploading.' });
      return null;
    }
  } catch (e) {
    await say({ thread_ts, text: 'Meta would not accept the credentials: ' + e.message + '\nNothing was uploaded.' });
    return null;
  }

  await say({ thread_ts, text: `Launching ${files.length} into ad set ${spec.adsetId} on ${acct.name}. Everything lands paused.` });

  const items = [];
  for (const f of files) {
    try { items.push({ name: (spec.name ? spec.name + ' | ' : '') + f.name.replace(/\.[^.]+$/, ''), buffer: await download(f, botToken), filename: f.name, kind: kindOf(f) }); }
    catch (e) { await say({ thread_ts, text: 'Skipping ' + f.name + ': ' + e.message }); }
  }
  if (!items.length) { await say({ thread_ts, text: 'Nothing downloadable. Stopped.' }); return null; }

  const results = await meta.launch({
    items,
    adsetId: spec.adsetId,
    copy: { message: spec.message, headline: spec.headline, description: spec.description, link: spec.link, cta: spec.cta },
  });

  const ok = results.filter((r) => r.ok);
  const bad = results.filter((r) => !r.ok);
  let out = ok.length ? `*${ok.length} ad${ok.length === 1 ? '' : 's'} created, paused.*\n` + ok.map((r) => '• ' + r.name).join('\n') : '*Nothing made it up.*';
  if (bad.length) out += `\n\n*${bad.length} failed:*\n` + bad.map((r) => '• ' + r.name + ' — ' + r.error).join('\n');
  if (ok.length) out += '\n\nReview and turn on here: ' + meta.managerUrl(spec.adsetId);
  await say({ thread_ts, text: out });
  return results;
}

module.exports = { isLaunch, parse, validate, cleanUrl, kindOf, run, CTAS };
