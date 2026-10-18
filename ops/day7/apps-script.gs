// Day 7 sheet bridge for Donnaa. Paste into the sheet's Extensions > Apps Script,
// set Project Settings > Script properties > DAY7_SECRET, then
// Deploy > New deployment > Web app, execute as Me, access Anyone.
// After pasting a new version: Deploy > Manage deployments > edit > Version: New version > Deploy.
//
//   {action:"add", rows:[...]}  adds a row per creative not already in the tab, best ROAS first
//   {action:"list"}             returns every row
//
// If the header row is not the one below, the tab is cleared and set up again.

var TAB = 'Creatives';
var HEADERS = ['Creative', 'Product', 'Launch date', 'Day 7 date', 'Spend', 'ROAS', 'CPA', 'CTR', 'Label', 'Why it won', 'Next iteration'];
var COLORS = [['Breakthrough', '#93c47d'], ['Scale winner', '#b6d7a8'], ['Winner', '#d9ead3'], ['Keep running', '#fff2cc'], ['Check', '#fce5cd']];

function doPost(e) {
  var body = JSON.parse(e.postData.contents || '{}');
  var secret = PropertiesService.getScriptProperties().getProperty('DAY7_SECRET');
  if (!secret || body.secret !== secret) return out({ error: 'bad secret' });
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = setup(SpreadsheetApp.getActive().getSheetByName(TAB));
    if (body.action === 'add') return out(add(sh, body.rows || []));
    if (body.action === 'list') return out({ rows: list(sh) });
    return out({ error: 'unknown action' });
  } finally {
    lock.releaseLock();
  }
}

function setup(sh) {
  var have = sh.getRange(1, 1, 1, HEADERS.length).getValues()[0].join('|');
  if (have === HEADERS.join('|')) return sh;
  sh.clear();
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).clearDataValidations();
  sh.setConditionalFormatRules([]);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setFontColor('#ffffff').setBackground('#1f3864');
  sh.setFrozenRows(1);
  sh.setFrozenColumns(0);
  var body = sh.getRange('A2:K5000');
  var rules = COLORS.map(function (c) {
    return SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=REGEXMATCH($I2,"' + c[0] + '")').setBackground(c[1]).setRanges([sh.getRange('A2:I5000')]).build();
  });
  // A winner with no "why it won" or "next iteration" yet shows the empty cell in red.
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND(REGEXMATCH($I2,"Breakthrough|Scale winner|✅ Winner"),J2="")').setBackground('#f4cccc').setRanges([sh.getRange('J2:K5000')]).build());
  sh.setConditionalFormatRules(rules);
  body.setVerticalAlignment('top');
  sh.getRange('J2:K5000').setWrap(true);
  sh.setColumnWidth(1, 320);
  sh.setColumnWidths(10, 2, 300);
  return sh;
}

function add(sh, rows) {
  var have = {};
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) { have[String(r[0]).trim()] = true; });
  var fresh = [];
  rows.forEach(function (r) {
    var name = String(r.creative || '').trim();
    if (!name || have[name]) return;
    have[name] = true;
    fresh.push([name, r.product, day(r.launch), day(r.day7), r.spend, r.roas, r.cpa, r.ctr, r.label, '', '']);
  });
  if (fresh.length) {
    sh.getRange(sh.getLastRow() + 1, 1, fresh.length, HEADERS.length).setValues(fresh);
    var n = sh.getLastRow() - 1;
    sh.getRange(2, 3, n, 2).setNumberFormat('yyyy-mm-dd');
    sh.getRange(2, 5, n, 1).setNumberFormat('$#,##0');
    sh.getRange(2, 6, n, 1).setNumberFormat('0.00');
    sh.getRange(2, 7, n, 1).setNumberFormat('$#,##0.00');
    sh.getRange(2, 8, n, 1).setNumberFormat('0.00%');
    sh.getRange(2, 1, n, HEADERS.length).sort({ column: 6, ascending: false });
  }
  return { added: fresh.length, skipped: rows.length - fresh.length };
}

function list(sh) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  var tz = Session.getScriptTimeZone();
  var d = function (v) { return v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v || ''); };
  return sh.getRange(2, 1, last - 1, HEADERS.length).getValues().map(function (r) {
    return { creative: String(r[0]), product: String(r[1]), launch: d(r[2]), day7: d(r[3]), spend: r[4], roas: r[5], label: String(r[8]).trim(), why: String(r[9]).trim(), next: String(r[10]).trim() };
  });
}

function day(s) {
  return s ? new Date(s + 'T00:00:00') : '';
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
