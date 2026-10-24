// Checkout Champ CRM API helper. Login comes from CC_API_USER / CC_API_PASS.
// Calls must leave from the whitelisted IP range, so run Node with
// NODE_USE_ENV_PROXY=1 when inside the cloud sandbox (see README).
const BASE = 'https://api.checkoutchamp.com';

async function call(path, params = {}) {
  const q = new URLSearchParams({ loginId: process.env.CC_API_USER, password: process.env.CC_API_PASS });
  for (const [k, v] of Object.entries(params)) if (v != null) q.append(k, v);
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch(`${BASE}/${path}/?${q}`, { method: 'POST' });
      const j = await r.json();
      if (j.result !== 'SUCCESS') {
        // "No ... found" comes back as an error; treat it as an empty page.
        if (/no .*found/i.test(String(j.message))) return { totalResults: 0, data: [] };
        throw new Error(`${path}: ${typeof j.message === 'string' ? j.message : JSON.stringify(j.message).slice(0, 200)}`);
      }
      return j.message;
    } catch (e) {
      if (attempt >= 3 || /whitelist/i.test(e.message)) throw e;
      await new Promise((res) => setTimeout(res, 2000 * 2 ** attempt));
    }
  }
}

const mdY = (d) => `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}/${d.getUTCFullYear()}`;

// Pages through a query endpoint in date windows (the API caps page size).
async function queryAll(path, { start, end, windowDays = 7, ...params }) {
  const out = [];
  for (let s = new Date(start); s <= end; s = new Date(s.getTime() + windowDays * 864e5)) {
    const e = new Date(Math.min(s.getTime() + (windowDays - 1) * 864e5, end.getTime()));
    for (let page = 1; ; page++) {
      const m = await call(path, { ...params, startDate: mdY(s), endDate: mdY(e), resultsPerPage: 200, page });
      const rows = Array.isArray(m.data) ? m.data : Object.values(m.data || {});
      out.push(...rows);
      if (rows.length < 200) break;
    }
  }
  return out;
}

module.exports = { call, queryAll, mdY };
