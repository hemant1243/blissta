'use strict';
/* Splits the operator handbook into team and owner tiers.
   Owner-only material never reaches a team-tier request, not even as retrieval context. */

const OWNER_ONLY_HEADINGS = [
  '### 1.2 Legal entities',
  '### 5.6 Payment processors and dispute history',
  '### 2.8 Bundles, subscriptions, margins',
  '## 8. NUMBERS',
];
const OWNER_ONLY_PATTERNS = [
  /Two creative agencies on trial[\s\S]*?(?=\n- Mastermind)/,            // agency fee terms
  /Editor terms \(DONAAA, Aug 2026\)[\s\S]*?(?=\n- Editor rules)/,       // pay terms
  /Trial: 15 concepts in two weeks[\s\S]*?Written week by week expectations laid out up front\./, // strategist pay
  /Bangkok address:[^\n]*\n/,
  /US office:[^\n]*\n/,
  /Company email in use:[^\n]*\n/,
];

const OWNER_ONLY_LINE = /gross margin|CAC about|net LTV|realized net|MIDs:|Legal: TheElixir|PayArc|EMS-Kurv|MyCPO|Maverick|reserve relief|\$100K|Onyx|W-8BEN|ROAS bonus|20k base|\$2k flat|flat fee|Form 5472|Jerz|Akina|thejerzway/i;

function splitSections(md) {
  const lines = md.split('\n');
  const out = [];
  let cur = { heading: '(top)', level: 0, body: [] };
  for (const line of lines) {
    const m = /^(#{2,3}) (.+)$/.exec(line);
    if (m) { out.push(cur); cur = { heading: line, level: m[1].length, body: [] }; }
    else cur.body.push(line);
  }
  out.push(cur);
  return out;
}

function teamTier(md) {
  const sections = splitSections(md);
  let droppingChapter = false;
  const kept = [];
  for (const s of sections) {
    if (s.level === 2) droppingChapter = false;
    if (OWNER_ONLY_HEADINGS.some((h) => s.heading.startsWith(h))) {
      if (s.level === 2) droppingChapter = true;
      kept.push(s.heading + '\n\n[Owner only. Ask DONAAA.]\n');
      continue;
    }
    if (droppingChapter) continue;
    kept.push([s.heading === '(top)' ? '' : s.heading, ...s.body].join('\n'));
  }
  let text = kept.join('\n');
  for (const re of OWNER_ONLY_PATTERNS) text = text.replace(re, '[Owner only. Ask DONAAA.]\n');
  text = text.split('\n').map((line) => (OWNER_ONLY_LINE.test(line) ? '[Owner only line removed. Ask DONAAA.]' : line)).join('\n');
  return text;
}

module.exports = { teamTier, OWNER_ONLY_HEADINGS };
