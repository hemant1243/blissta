// Day 7 sheet bridge for Donnaa. Paste into the sheet's Extensions > Apps Script,
// set Project Settings > Script properties > DAY7_SECRET, then
// Deploy > New deployment > Web app, execute as Me, access Anyone.
// After pasting a new version: Deploy > Manage deployments > edit > Version: New version > Deploy.
//
//   {action:"add", rows:[...]}  adds each creative not already there to its tab (row.tab: winners | killed)
//   {action:"list"}             returns every row of both tabs
//
// A tab whose header row is not the one below is cleared and set up again.

var TABS = {
  winners: { name: 'Winners', old: 'Creatives', sortBy: 'ROAS',
    headers: ['Creative', 'Ad', 'Product', 'Launch date', 'Day 7 date', 'Spend', 'ROAS', 'CPA', 'CTR', 'Label', 'Testing', 'Why it won', 'Next iteration'] },
  killed: { name: 'Killed', sortBy: 'Spend',
    headers: ['Creative', 'Ad', 'Product', 'Launch date', 'Day 7 date', 'Spend', 'ROAS', 'CPA', 'CTR', 'Label', 'Testing', 'What we learned'] },
};
var COLORS = [['Breakthrough', '#93c47d'], ['Scale winner', '#b6d7a8'], ['Winner', '#d9ead3'], ['Keep running', '#fff2cc'], ['Check', '#fce5cd']];

function doPost(e) {
  var body = JSON.parse(e.postData.contents || '{}');
  var secret = PropertiesService.getScriptProperties().getProperty('DAY7_SECRET');
  if (!secret || body.secret !== secret) return out({ error: 'bad secret' });
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (body.action === 'add') return out(add(body.rows || []));
    if (body.action === 'list') return out({ rows: list('winners').concat(list('killed')) });
    return out({ error: 'unknown action' });
  } finally {
    lock.releaseLock();
  }
}

function tab(key) {
  var t = TABS[key];
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(t.name) || (t.old && ss.getSheetByName(t.old)) || ss.insertSheet(t.name);
  if (sh.getName() !== t.name) sh.setName(t.name);
  var n = t.headers.length;
  if (sh.getRange(1, 1, 1, n).getValues()[0].join('|') === t.headers.join('|')) return sh;
  sh.clear();
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).clearDataValidations();
  sh.getRange(1, 1, 1, n).setValues([t.headers]).setFontWeight('bold').setFontColor('#ffffff').setBackground('#1f3864');
  sh.setFrozenRows(1);
  sh.setFrozenColumns(0);
  var rows = sh.getMaxRows() - 1;
  var rules = [];
  if (key === 'winners') {
    COLORS.forEach(function (c) {
      rules.push(rule('=REGEXMATCH($J2,"' + c[0] + '")', c[1], sh.getRange(2, 1, rows, 10)));
    });
    // Empty cells the team owes show red: Testing on every row, why and next on the three winner labels.
    rules.push(rule('=AND($A2<>"",K2="")', '#f4cccc', sh.getRange(2, 11, rows, 1)));
    rules.push(rule('=AND(REGEXMATCH($J2,"Breakthrough|Scale winner|✅ Winner"),L2="")', '#f4cccc', sh.getRange(2, 12, rows, 2)));
  } else {
    rules.push(rule('=AND($A2<>"",K2="")', '#f4cccc', sh.getRange(2, 11, rows, 2)));
  }
  sh.setConditionalFormatRules(rules);
  sh.getRange(2, 1, rows, n).setVerticalAlignment('top');
  sh.getRange(2, 11, rows, n - 10).setWrap(true);
  sh.setColumnWidth(1, 320);
  sh.setColumnWidths(11, n - 10, 280);
  return sh;
}

function rule(formula, color, range) {
  return SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(formula).setBackground(color).setRanges([range]).build();
}

function add(rows) {
  var added = 0;
  ['winners', 'killed'].forEach(function (key) {
    var t = TABS[key];
    var sh = tab(key);
    var n = t.headers.length;
    var have = {};
    var last = sh.getLastRow();
    if (last > 1) sh.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) { have[String(r[0]).trim()] = true; });
    var fresh = [];
    rows.forEach(function (r) {
      var name = String(r.creative || '').trim();
      if ((r.tab || 'winners') !== key || !name || have[name]) return;
      have[name] = true;
      var row = [name, r.link ? '=HYPERLINK("' + String(r.link).replace(/"/g, '') + '","View ad")' : '', r.product, day(r.launch), day(r.day7), r.spend, r.roas, r.cpa, r.ctr, r.label, ''];
      while (row.length < n) row.push('');
      fresh.push(row);
    });
    if (!fresh.length) return;
    sh.getRange(sh.getLastRow() + 1, 1, fresh.length, n).setValues(fresh);
    var count = sh.getLastRow() - 1;
    sh.getRange(2, 4, count, 2).setNumberFormat('yyyy-mm-dd');
    sh.getRange(2, 6, count, 1).setNumberFormat('$#,##0');
    sh.getRange(2, 7, count, 1).setNumberFormat('0.00');
    sh.getRange(2, 8, count, 1).setNumberFormat('$#,##0.00');
    sh.getRange(2, 9, count, 1).setNumberFormat('0.00%');
    sh.getRange(2, 1, count, n).sort({ column: t.headers.indexOf(t.sortBy) + 1, ascending: false });
    added += fresh.length;
  });
  return { added: added, skipped: rows.length - added };
}

function list(key) {
  var sh = tab(key);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var tz = Session.getScriptTimeZone();
  var d = function (v) { return v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v || ''); };
  return sh.getRange(2, 1, last - 1, TABS[key].headers.length).getValues().map(function (r) {
    var s = function (i) { return String(r[i] || '').trim(); };
    return { tab: key, creative: s(0), product: s(2), launch: d(r[3]), day7: d(r[4]), spend: r[5], roas: r[6], label: s(9), testing: s(10),
      why: key === 'winners' ? s(11) : '', next: key === 'winners' ? s(12) : '', learned: key === 'killed' ? s(11) : '' };
  });
}

// A yyyy-mm-dd string is read as a date in the sheet's own time zone, so it shows the day Donnaa sent.
function day(s) {
  return s || '';
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
