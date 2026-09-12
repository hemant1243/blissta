'use strict';
/*
 Meta Marketing API: put creatives up as PAUSED ads.

 Nothing here ever sets a live status. Ads land paused, a human opens Ads Manager
 and turns on the ones they want. That is deliberate and should stay that way
 until someone decides otherwise out loud.

 Reads from the environment:
   META_ACCESS_TOKEN     system user token with ads_management, ads_read
   META_AD_ACCOUNT_ID    act_1234567890
   META_PAGE_ID          the Page the ads run from
   META_API_VERSION      optional, defaults below
*/
const API = 'https://graph.facebook.com/' + (process.env.META_API_VERSION || 'v21.0');

const token = () => {
  const t = process.env.META_ACCESS_TOKEN;
  if (!t) throw new Error('META_ACCESS_TOKEN is not set');
  return t;
};
const account = () => {
  const a = process.env.META_AD_ACCOUNT_ID;
  if (!a) throw new Error('META_AD_ACCOUNT_ID is not set');
  return a.startsWith('act_') ? a : 'act_' + a;
};

/* Meta answers 200 with an error body often enough that we check both. */
async function call(path, { method = 'GET', form, query } = {}) {
  const url = new URL(API + path);
  url.searchParams.set('access_token', token());
  for (const [k, v] of Object.entries(query || {})) url.searchParams.set(k, typeof v === 'string' ? v : JSON.stringify(v));
  const init = { method };
  if (form) {
    const body = new FormData();
    for (const [k, v] of Object.entries(form)) body.append(k, v instanceof Blob ? v : typeof v === 'string' ? v : JSON.stringify(v));
    init.body = body;
  }
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (json.error) {
    const e = json.error;
    const err = new Error(`Meta ${e.code}${e.error_subcode ? '/' + e.error_subcode : ''}: ${e.error_user_msg || e.message}`);
    err.meta = e;
    throw err;
  }
  if (!res.ok) throw new Error('Meta HTTP ' + res.status);
  return json;
}

/* ---------- who are we ---------- */

/* Proves the token works and says what it can reach. Run this first, always. */
async function whoami() {
  token(); /* surface a missing token before a missing account id */
  const acct = await call('/' + account(), { query: { fields: 'id,name,account_status,currency,timezone_name,amount_spent' } });
  const page = process.env.META_PAGE_ID
    ? await call('/' + process.env.META_PAGE_ID, { query: { fields: 'id,name' } }).catch((e) => ({ error: e.message }))
    : { error: 'META_PAGE_ID is not set' };
  return { account: acct, page };
}

/* status 1 is active; anything else means Meta has restricted or closed it. */
const accountUsable = (a) => a.account_status === 1;

async function adSets({ limit = 100 } = {}) {
  const r = await call('/' + account() + '/adsets', {
    query: { fields: 'id,name,status,campaign_id,effective_status', limit: String(limit) },
  });
  return r.data || [];
}

/* ---------- uploads ---------- */

async function uploadImage(buf, filename) {
  const r = await call('/' + account() + '/adimages', {
    method: 'POST',
    form: { filename: new Blob([buf]), name: filename },
  });
  /* Meta keys the response by a mangled filename, so just take the first entry. */
  const entry = Object.values(r.images || {})[0];
  if (!entry || !entry.hash) throw new Error('no image hash came back for ' + filename);
  return entry.hash;
}

async function uploadVideo(buf, filename) {
  const r = await call('/' + account() + '/advideos', {
    method: 'POST',
    form: { source: new Blob([buf]), name: filename },
  });
  if (!r.id) throw new Error('no video id came back for ' + filename);
  return r.id;
}

/* Meta will not build a creative until it has finished transcoding. */
async function waitForVideo(videoId, { timeoutMs = 600000, everyMs = 5000 } = {}) {
  const until = Date.now() + timeoutMs;
  for (;;) {
    const v = await call('/' + videoId, { query: { fields: 'status' } });
    const phase = (v.status && v.status.video_status) || 'processing';
    if (phase === 'ready') return true;
    if (phase === 'error') throw new Error('Meta could not process video ' + videoId);
    if (Date.now() > until) throw new Error('video ' + videoId + ' still ' + phase + ' after ' + Math.round(timeoutMs / 1000) + 's');
    await new Promise((r) => setTimeout(r, everyMs));
  }
}

/* ---------- creatives and ads ---------- */

/*
 spec: { name, message, headline, description, link, cta, pageId,
         imageHash | videoId, thumbnailHash }
 cta is a Meta enum, e.g. SHOP_NOW, LEARN_MORE.
*/
function storySpec(spec) {
  const pageId = spec.pageId || process.env.META_PAGE_ID;
  if (!pageId) throw new Error('no page id: set META_PAGE_ID or pass pageId');
  const link = { link: spec.link, message: spec.message };
  if (spec.headline) link.name = spec.headline;
  if (spec.description) link.description = spec.description;
  if (spec.cta) link.call_to_action = { type: spec.cta, value: { link: spec.link } };

  if (spec.videoId) {
    const video = { video_id: spec.videoId, message: spec.message, call_to_action: link.call_to_action };
    if (spec.headline) video.title = spec.headline;
    if (spec.description) video.link_description = spec.description;
    if (spec.thumbnailHash) video.image_hash = spec.thumbnailHash;
    return { page_id: pageId, video_data: video };
  }
  if (!spec.imageHash) throw new Error('a creative needs either imageHash or videoId');
  return { page_id: pageId, link_data: Object.assign(link, { image_hash: spec.imageHash }) };
}

async function createCreative(spec) {
  const r = await call('/' + account() + '/adcreatives', {
    method: 'POST',
    form: { name: spec.name, object_story_spec: storySpec(spec), degrees_of_freedom_spec: { creative_features_spec: { standard_enhancements: { enroll_status: 'OPT_OUT' } } } },
  });
  return r.id;
}

/* Always PAUSED. There is no flag to change that here, on purpose. */
async function createPausedAd({ name, adsetId, creativeId }) {
  const r = await call('/' + account() + '/ads', {
    method: 'POST',
    form: { name, adset_id: adsetId, creative: { creative_id: creativeId }, status: 'PAUSED' },
  });
  return r.id;
}

/* ---------- one call the bot can use ---------- */

/*
 items: [{ name, buffer, filename, kind: 'image'|'video', thumbnailHash? }]
 copy:  { message, headline, description, link, cta, pageId }
 Returns one row per item so a partial failure still reports what did land.
*/
async function launch({ items, copy, adsetId, onProgress = () => {} }) {
  if (!adsetId) throw new Error('no adsetId: an ad has to go somewhere');
  if (!copy || !copy.link) throw new Error('copy.link is required');
  const out = [];
  for (const item of items) {
    try {
      onProgress({ name: item.name, step: 'uploading' });
      const spec = Object.assign({ name: item.name }, copy);
      if (item.kind === 'video') {
        spec.videoId = await uploadVideo(item.buffer, item.filename);
        onProgress({ name: item.name, step: 'processing' });
        await waitForVideo(spec.videoId);
        if (item.thumbnailHash) spec.thumbnailHash = item.thumbnailHash;
      } else {
        spec.imageHash = await uploadImage(item.buffer, item.filename);
      }
      onProgress({ name: item.name, step: 'creating' });
      const creativeId = await createCreative(spec);
      const adId = await createPausedAd({ name: item.name, adsetId, creativeId });
      out.push({ ok: true, name: item.name, adId, creativeId });
      onProgress({ name: item.name, step: 'done', adId });
    } catch (e) {
      out.push({ ok: false, name: item.name, error: e.message });
      onProgress({ name: item.name, step: 'failed', error: e.message });
    }
  }
  return out;
}

const managerUrl = (adsetId) =>
  'https://adsmanager.facebook.com/adsmanager/manage/ads?act=' + account().replace('act_', '') + '&selected_adset_ids=' + adsetId;

module.exports = { whoami, accountUsable, adSets, uploadImage, uploadVideo, waitForVideo, createCreative, createPausedAd, launch, managerUrl, call };
