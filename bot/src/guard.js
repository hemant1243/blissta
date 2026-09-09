'use strict';
/* Output guard. Runs on every answer before it leaves. */
const BANNED = [
  { re: /talk(?:ing)? to your doctor|ask your doctor|consult your doctor|check with your doctor/i, why: 'says "talk to your doctor"' },
  { re: /\b(cures?|treats?|reverses?|prevents?) (cancer|alzheimer|dementia|diabetes|heart disease|stroke|depression|covid)/i, why: 'disease claim' },
  { re: /\bmade in (the )?(usa|united states|america|utah|china)\b/i, why: 'names a place of manufacture' },
  { re: /\breplace (your|my) (medication|prescription|blood thinner|statin|metformin|gabapentin|eliquis|xarelto|warfarin)/i, why: 'medication replacement' },
];

function guard(text) {
  let out = text.replace(/\s*[—–]\s*/g, ', ').replace(/, ,/g, ',');
  const flags = BANNED.filter((b) => b.re.test(out)).map((b) => b.why);
  return { text: out, flags };
}

module.exports = { guard };
