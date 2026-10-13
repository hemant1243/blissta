// Shared helpers for the Higgsfield sessions watcher. Read-only: never generates, buys, deletes,
// changes settings or signs anyone out. Login comes from HF_EMAIL / HF_PASS; never print them.
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright');

const PROFILE = process.env.HF_PROFILE || path.join(require('os').homedir(), '.cache', 'hf-sessions-profile');
const SESSIONS_URL = 'https://higgsfield.ai/me/settings/sessions';

// Strip the login from anything we print (Playwright errors echo filled values).
const mask = s => {
  let out = String(s);
  for (const v of [process.env.HF_EMAIL, process.env.HF_PASS]) if (v) out = out.split(v).join('<redacted>');
  return out;
};
const die = e => { console.error('ERR', mask(e && e.message || e).split('\n')[0]); process.exit(1); };

async function open() {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    headless: true,
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
    viewport: { width: 1280, height: 900 },
  });
  return { ctx, page: ctx.pages()[0] || await ctx.newPage() };
}

const onSignIn = page => /\/auth(\/|\?|$)/.test(new URL(page.url()).pathname + '/');

// Password login through the site's own form. Returns 'ok', 'rate_limited' or 'failed'.
async function passwordLogin(page) {
  let limited = false;
  const watch = r => { if (/\/v1\/client\/sign_ins/.test(r.url()) && r.status() === 429) limited = true; };
  page.on('response', watch);
  await page.goto('https://higgsfield.ai/auth/email/sign-in?rp=%2Fme%2Fsettings%2Fsessions', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.locator('input[type=email]:visible').first().fill(process.env.HF_EMAIL);
  const pw = page.locator('input[type=password]:visible').first();
  await pw.fill(process.env.HF_PASS);
  await pw.press('Enter');
  await page.waitForTimeout(12000);
  page.off('response', watch);
  if (limited) return 'rate_limited';
  return onSignIn(page) ? 'failed' : 'ok';
}

module.exports = { PROFILE, SESSIONS_URL, mask, die, open, onSignIn, passwordLogin };
