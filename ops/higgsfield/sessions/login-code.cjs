// One-off email-code login (fallback when the password form is rate limited).
// Sends a code to the shared inbox, then waits for the code to be written to <codeFile>.
// Usage: node login-code.cjs <codeFile>
const fs = require('fs');
const { open, die, SESSIONS_URL, onSignIn } = require('./lib.cjs');
process.on('unhandledRejection', die);
const codeFile = process.argv[2];

(async () => {
  const { ctx, page } = await open();
  await page.goto('https://higgsfield.ai/auth/sign-in', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.Clerk && window.Clerk.loaded, null, { timeout: 60000 });
  const sent = await page.evaluate(async email => {
    try {
      const si = await window.Clerk.client.signIn.create({ identifier: email });
      const f = (si.supportedFirstFactors || []).find(x => x.strategy === 'email_code');
      if (!f) return 'no_email_code_factor';
      await si.prepareFirstFactor({ strategy: 'email_code', emailAddressId: f.emailAddressId });
      return 'sent';
    } catch (e) { return 'error: ' + ((e.errors && e.errors[0] && e.errors[0].code) || e.message); }
  }, process.env.HF_EMAIL);
  console.log('code request:', sent);
  if (sent !== 'sent') { await ctx.close(); process.exit(2); }

  const until = Date.now() + 20 * 60e3;
  while (!fs.existsSync(codeFile) && Date.now() < until) await page.waitForTimeout(3000);
  if (!fs.existsSync(codeFile)) { console.log('timed out waiting for code'); await ctx.close(); process.exit(3); }
  const code = fs.readFileSync(codeFile, 'utf8').trim();
  fs.unlinkSync(codeFile);

  const res = await page.evaluate(async code => {
    try {
      const si = await window.Clerk.client.signIn.attemptFirstFactor({ strategy: 'email_code', code });
      if (si.status !== 'complete') return 'status ' + si.status;
      await window.Clerk.setActive({ session: si.createdSessionId });
      return 'complete';
    } catch (e) { return 'error: ' + ((e.errors && e.errors[0] && e.errors[0].code) || e.message); }
  }, code);
  console.log('code attempt:', res);
  await page.goto(SESSIONS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  const ok = !onSignIn(page);
  console.log('logged in:', ok);
  await ctx.close();
  process.exit(res === 'complete' && ok ? 0 : 4);
})();
