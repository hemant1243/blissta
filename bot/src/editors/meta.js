'use strict';
/*
 Read-only pull from the Meta Marketing API. The System User token (ads_read) and the ad account
 ids live in env vars on the server and never leave it.

   META_ACCESS_TOKEN   system user token, ads_read
   META_AD_ACCOUNTS    comma separated, "act_123" or "123"
   META_SINCE          first month to pull, YYYY-MM-DD (default 2025-01-01)
   META_API_VERSION    default v21.0
*/
const API = 'https://graph.facebook.com/' + (process.env.META_API_VERSION || 'v21.0');
const TOKEN = process.env.META_ACCESS_TOKEN || '';
const ACCOUNTS = (process.env.META_AD_ACCOUNTS || '').split(',').map((s) => s.trim()).filter(Boolean).map((s) => (s.startsWith('act_') ? s : 'act_' + s));
const SINCE = process.env.META_SINCE || '2025-01-01';
const PURCHASE_TYPES = ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase', 'onsite_web_purchase'];

const configured = () => !!(TOKEN && ACCOUNTS.length);

async function get(url, params) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params || {})) u.searchParams.set(k, typeof v === 'string' ? v : JSON.stringify(v));
  u.searchParams.set('access_token', TOKEN);
  const r = await fetch(u);
  const j = await r.json();
  if (!r.ok || j.error) throw new Error((j.error && j.error.message) || `Meta ${r.status}`);
  return j;
}
/* Follow paging.next until the end. */
async function all(url, params) {
  let out = []; let j = await get(url, params);
  out = out.concat(j.data || []);
  let guard = 0;
  while (j.paging && j.paging.next && guard++ < 200) {
    const r = await fetch(j.paging.next); j = await r.json();
    if (j.error) throw new Error(j.error.message);
    out = out.concat(j.data || []);
  }
  return out;
}
const pick = (arr, types) => { for (const t of types) { const hit = (arr || []).find((a) => a.action_type === t); if (hit) return Number(hit.value || 0); } return 0; };

/* Returns { ads: { adId: { id, name, account, delivery, preview, thumb, videoId, months: { 'YYYY-MM': {spend, value, impressions, clicks} } } } } */
async function pull() {
  if (!configured()) throw new Error('META_ACCESS_TOKEN or META_AD_ACCOUNTS not set');
  const until = new Date().toISOString().slice(0, 10);
  const ads = {};
  for (const acct of ACCOUNTS) {
    const meta = await all(`${API}/${acct}/ads`, { fields: 'id,name,effective_status,preview_shareable_link,creative{thumbnail_url,video_id}', limit: '500' });
    for (const a of meta) ads[a.id] = { id: a.id, name: a.name, account: acct, delivery: a.effective_status, preview: a.preview_shareable_link || '', thumb: (a.creative && a.creative.thumbnail_url) || '', videoId: (a.creative && a.creative.video_id) || '', months: {} };
    const rows = await all(`${API}/${acct}/insights`, {
      level: 'ad', fields: 'ad_id,ad_name,spend,impressions,clicks,actions,action_values',
      time_increment: 'monthly', time_range: { since: SINCE, until }, limit: '500',
    });
    for (const r of rows) {
      const ad = ads[r.ad_id] || (ads[r.ad_id] = { id: r.ad_id, name: r.ad_name, account: acct, delivery: '', preview: '', thumb: '', videoId: '', months: {} });
      const m = String(r.date_start).slice(0, 7);
      const cur = ad.months[m] || { spend: 0, value: 0, impressions: 0, clicks: 0 };
      cur.spend += Number(r.spend || 0); cur.impressions += Number(r.impressions || 0); cur.clicks += Number(r.clicks || 0);
      cur.value += pick(r.action_values, PURCHASE_TYPES);
      ad.months[m] = cur;
    }
  }
  return { ads };
}

module.exports = { pull, configured, ACCOUNTS };
