'use strict';
/*
 "top ads [n] [days]"   owner only, read only.

 The winning ads across every Meta ad account the token can see, so the creative
 team (and Claude) can study what works: per ad its spend, ROAS, CPA, the copy,
 headline, and links to the image or video file and a preview. Winners are ads
 with $300+ spend and ROAS 1.4+ (break-even) over the last [days], best spend first.
 One Slack message per ad, so long copy is never cut off.
*/
const meta = require('./meta');

const MIN_SPEND = 300;
const MIN_ROAS = 1.4;
const PURCHASE = ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase'];
const act = (list) => { for (const t of PURCHASE) { const a = (list || []).find((x) => x.action_type === t); if (a) return Number(a.value) || 0; } return 0; };

async function pages(path, query) {
  const out = [];
  let r = await meta.call(path, { query: { limit: '500', ...query } });
  for (;;) {
    out.push(...(r.data || []));
    if (!r.paging || !r.paging.next) return out;
    r = await (await fetch(r.paging.next)).json();
    if (r.error) throw new Error('Meta ' + r.error.message);
  }
}

/* Everything the creative carries: copy, headline, image and video, whether it is a single ad or a dynamic one. */
async function creative(adId) {
  const a = await meta.call('/' + adId, { query: { fields: 'preview_shareable_link,creative{title,body,image_url,thumbnail_url,video_id,object_story_spec,asset_feed_spec}' } });
  const c = a.creative || {};
  const s = c.object_story_spec || {};
  const link = s.link_data || {};
  const video = s.video_data || {};
  const feed = c.asset_feed_spec || {};
  const out = {
    preview: a.preview_shareable_link || '',
    bodies: [c.body, link.message, video.message, ...(feed.bodies || []).map((b) => b.text)].filter(Boolean),
    titles: [c.title, link.name, video.title, ...(feed.titles || []).map((t) => t.text)].filter(Boolean),
    images: [c.image_url, link.picture, video.image_url, ...(feed.images || []).map((i) => i.url)].filter(Boolean),
    videoIds: [c.video_id, video.video_id, ...(feed.videos || []).map((v) => v.video_id)].filter(Boolean),
    thumb: c.thumbnail_url || '',
  };
  out.videos = [];
  for (const id of [...new Set(out.videoIds)]) {
    try { const v = await meta.call('/' + id, { query: { fields: 'source,permalink_url' } }); out.videos.push(v.source || (v.permalink_url ? 'https://www.facebook.com' + v.permalink_url : '')); } catch (e) { out.videos.push(`(video ${id}: ${e.message})`); }
  }
  for (const k of ['bodies', 'titles', 'images']) out[k] = [...new Set(out[k])];
  return out;
}

async function top({ n = 20, days = 30 } = {}) {
  const until = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const rows = [];
  for (const a of await meta.adAccounts()) {
    let ins;
    try { ins = await pages('/' + a.id + '/insights', { level: 'ad', fields: 'ad_id,ad_name,campaign_name,spend,impressions,inline_link_clicks,actions,action_values', time_range: { since, until } }); } catch (e) { continue; }
    for (const x of ins) {
      const spend = Number(x.spend) || 0, buys = act(x.actions), value = act(x.action_values);
      const roas = spend ? value / spend : 0;
      if (spend >= MIN_SPEND && roas >= MIN_ROAS) rows.push({ id: x.ad_id, name: x.ad_name, campaign: x.campaign_name, account: a.name, spend, roas, cpa: buys ? spend / buys : 0, buys, ctr: Number(x.impressions) ? Number(x.inline_link_clicks) / Number(x.impressions) : 0 });
    }
  }
  rows.sort((p, q) => q.spend - p.spend);
  const picked = rows.slice(0, n);
  for (const r of picked) { try { Object.assign(r, await creative(r.id)); } catch (e) { r.error = e.message; } }
  return { since, until, total: rows.length, ads: picked };
}

function message(r, i) {
  const lines = [
    `*#${i + 1} ${r.name}*`,
    `${r.account} · ${r.campaign}`,
    `Spend $${Math.round(r.spend).toLocaleString()} · ROAS ${r.roas.toFixed(2)} · CPA $${r.cpa.toFixed(2)} · ${r.buys} purchases · CTR ${(r.ctr * 100).toFixed(2)}%`,
  ];
  if (r.preview) lines.push(`Preview: ${r.preview}`);
  for (const v of r.videos || []) lines.push(`Video: ${v}`);
  for (const im of r.images || []) lines.push(`Image: ${im}`);
  if (!(r.images || []).length && r.thumb) lines.push(`Thumbnail: ${r.thumb}`);
  for (const t of r.titles || []) lines.push(`Headline: ${t}`);
  for (const b of r.bodies || []) lines.push(`Copy:\n${b}`);
  if (r.error) lines.push(`(creative details failed: ${r.error})`);
  return lines.join('\n').slice(0, 39000);
}

/* Returns the Slack messages to send, header first. */
async function command(text) {
  const m = /^top ads(?:\s+(\d{1,3}))?(?:\s+(\d{1,3}))?\s*$/i.exec(String(text || '').trim());
  if (!m) return null;
  const r = await top({ n: Number(m[1] || 20), days: Number(m[2] || 30) });
  return [`Top ads ${r.since} to ${r.until}: ${r.total} ads with $${MIN_SPEND}+ spend and ROAS ${MIN_ROAS}+, showing the top ${r.ads.length} by spend.`, ...r.ads.map(message)];
}

module.exports = { command, top };
