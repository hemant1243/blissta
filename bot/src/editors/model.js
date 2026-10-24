'use strict';
/*
 Turns raw ad months into what the dashboard shows: who made the ad, lifetime numbers, the
 Testing / Winner / Scaling status and the bonus estimate.

 Bonus rules (Hemant, 27 Sep 2026):
   $5K lifetime spend            Proof Bonus, $100 to $300, "pending review" until the company sets it
   $10K lifetime at 1.5+ ROAS    Winning Ad. From that month on, 1% of spend for every month that holds 1.5+ ROAS. No cap.
   a month under 1.5 ROAS        no 1%, shown as "Scale bonus: set by company"
 Every figure is an estimate; the company confirms the final amount.
*/
const PROOF_SPEND = 5000, WIN_SPEND = 10000, WIN_ROAS = 1.5, WIN_PCT = 0.01;
const roas = (v, s) => (s > 0 ? v / s : 0);
const r2 = (n) => Math.round(n * 100) / 100;

/* Codes in an ad name, e.g. CORBEL_H3_SIMON -> SIMON. Tokens are compared whole, so MECA does not match MECHAELLA. */
function tokens(name) { return String(name || '').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean); }
function findEditor(adName, editors) {
  const toks = tokens(adName);
  for (const e of editors) {
    const codes = (e.codes || []).map((c) => String(c).toUpperCase()).filter(Boolean);
    if (toks.some((t) => codes.includes(t) || codes.some((c) => t.startsWith(c) && /^\d+$/.test(t.slice(c.length))))) return e;
  }
  return null;
}

function enrich(raw, editors, overrides, month) {
  const ov = (overrides || {})[raw.id] || {};
  const months = Object.keys(raw.months || {}).sort();
  let spend = 0, value = 0, imp = 0, clicks = 0, purchases = 0;
  const series = [];
  let since = null; let cumS = 0, cumV = 0;
  for (const m of months) {
    const x = raw.months[m];
    spend += x.spend; value += x.value; imp += x.impressions; clicks += x.clicks; purchases += x.purchases || 0;
    cumS += x.spend; cumV += x.value;
    if (!since && cumS >= WIN_SPEND && roas(cumV, cumS) >= WIN_ROAS) since = m;
    series.push({ month: m, spend: r2(x.spend), value: r2(x.value), purchases: x.purchases || 0, roas: r2(roas(x.value, x.spend)), ctr: x.impressions ? r2((x.clicks / x.impressions) * 100) : 0, cpc: x.clicks ? r2(x.spend / x.clicks) : 0 });
  }
  const R = roas(value, spend);
  const cur = raw.months[month] || { spend: 0, value: 0, purchases: 0, impressions: 0, clicks: 0 };
  const winner = spend >= WIN_SPEND && R >= WIN_ROAS;
  const active = /ACTIVE/i.test(raw.delivery || '') && !/PAUSED|DISAPPROVED|DELETED|ARCHIVED/i.test(raw.delivery || '');
  const status = winner && active && cur.spend > 0 && roas(cur.value, cur.spend) >= WIN_ROAS ? 'Scaling' : winner ? 'Winner' : 'Testing';

  /* bonus */
  const proof = { eligible: spend >= PROOF_SPEND, amount: ov.proofAmount || null, status: ov.proofStatus || 'pending review' };
  proof.label = !proof.eligible ? `Proof bonus at $${PROOF_SPEND.toLocaleString()} spend` : proof.amount ? `$${proof.amount} ${proof.status}` : '$100 to $300, pending review';
  const winMonths = [];
  let winTotal = 0;
  if (since) for (const s of series) {
    if (s.month < since) continue;
    const ok = s.roas >= WIN_ROAS;
    const bonus = ok ? r2(s.spend * WIN_PCT) : 0; winTotal += bonus;
    winMonths.push({ month: s.month, spend: s.spend, roas: s.roas, bonus, label: ok ? `1% of $${s.spend.toLocaleString()} = $${bonus.toLocaleString()}` : 'Scale bonus: set by company' });
  }
  const editor = findEditor(raw.name, editors);
  return {
    id: raw.id, name: raw.name, account: raw.account, accountName: raw.accountName || raw.account, delivery: raw.delivery || '', status,
    preview: raw.preview || '', thumb: raw.thumb || '', videoUrl: ov.videoUrl || raw.preview || (raw.videoId ? `https://www.facebook.com/${raw.videoId}` : ''),
    spend: r2(spend), value: r2(value), purchases, roas: r2(R), ctr: imp ? r2((clicks / imp) * 100) : 0, cpc: clicks ? r2(spend / clicks) : 0, impressions: imp, clicks,
    month: { spend: r2(cur.spend), value: r2(cur.value), purchases: cur.purchases || 0, roas: r2(roas(cur.value, cur.spend)), ctr: cur.impressions ? r2((cur.clicks / cur.impressions) * 100) : 0, cpc: cur.clicks ? r2(cur.spend / cur.clicks) : 0 },
    firstMonth: months[0] || '', lastMonth: months[months.length - 1] || '',
    editor: editor ? { name: editor.name, slack: editor.slack, code: (editor.codes || [])[0] || '' } : null,
    bonus: { proof, winning: { eligible: !!since, since, months: winMonths, total: r2(winTotal) }, note: 'estimate, final amount confirmed by the company' },
    series,
  };
}

/* Everything the page needs, scoped to the viewer. */
function dashboard({ raw, editors, overrides, user, month }) {
  const all = Object.values(raw.ads || {}).map((a) => enrich(a, editors, overrides, month)).filter((a) => a.spend > 0 || a.month.spend > 0);
  const mine = user.role === 'admin' ? all : all.filter((a) => a.editor && a.editor.slack === user.id);
  const byEditor = {};
  for (const a of all) {
    const key = a.editor ? a.editor.name : '(unassigned)';
    const e = byEditor[key] || (byEditor[key] = { name: key, ads: 0, spend: 0, value: 0, winners: 0, monthSpend: 0, monthValue: 0 });
    e.ads++; e.spend += a.spend; e.value += a.value; e.monthSpend += a.month.spend; e.monthValue += a.month.value; if (a.status !== 'Testing') e.winners++;
  }
  const board = {
    month,
    topAds: all.filter((a) => a.month.spend > 0).sort((a, b) => b.month.spend - a.month.spend).slice(0, 15).map((a) => ({ id: a.id, name: a.name, editor: a.editor ? a.editor.name : '', spend: a.month.spend, roas: a.month.roas, status: a.status })),
    editors: Object.values(byEditor).filter((e) => e.name !== '(unassigned)').map((e) => ({ ...e, spend: r2(e.spend), value: r2(e.value), roas: r2(roas(e.value, e.spend)), monthSpend: r2(e.monthSpend), monthRoas: r2(roas(e.monthValue, e.monthSpend)) })).sort((a, b) => b.monthSpend - a.monthSpend),
  };
  const totals = (list) => ({ ads: list.length, spend: r2(list.reduce((s, a) => s + a.spend, 0)), value: r2(list.reduce((s, a) => s + a.value, 0)), winners: list.filter((a) => a.status !== 'Testing').length, monthSpend: r2(list.reduce((s, a) => s + a.month.spend, 0)), bonus: r2(list.reduce((s, a) => s + a.bonus.winning.total, 0)) });
  const out = { month, fetchedAt: raw.fetchedAt || null, api: raw.api || null, csv: raw.csv || null, user, mine: mine.sort((a, b) => b.spend - a.spend), totals: totals(mine), board };
  if (user.role === 'admin') out.admin = { unassigned: all.filter((a) => !a.editor).sort((a, b) => b.spend - a.spend), editors };
  return out;
}
module.exports = { enrich, dashboard, findEditor, tokens };
