// Day 7 sheet bridge for Donnaa. Paste into the sheet's Extensions > Apps Script,
// set Project Settings > Script properties > DAY7_SECRET, then
// Deploy > New deployment > Web app, execute as Me, access Anyone.
//
//   {action:"add", rows:[...]}  adds a row per creative not already in the tab
//   {action:"list"}             returns every row (creative, owner, day7, verdict, why)

var TAB = 'Creatives';

function doPost(e) {
  var body = JSON.parse(e.postData.contents || '{}');
  var secret = PropertiesService.getScriptProperties().getProperty('DAY7_SECRET');
  if (!secret || body.secret !== secret) return out({ error: 'bad secret' });
  var sh = SpreadsheetApp.getActive().getSheetByName(TAB);
  if (body.action === 'add') return out(add(sh, body.rows || []));
  if (body.action === 'list') return out({ rows: list(sh) });
  return out({ error: 'unknown action' });
}

function add(sh, rows) {
  var have = {};
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) { have[String(r[0]).trim()] = true; });
  var added = 0, skipped = 0;
  rows.forEach(function (r) {
    if (!r.creative || have[r.creative]) { skipped++; return; }
    var n = sh.getLastRow() + 1;
    // Creative | Product | Angle | Avatar | Format | Type | Owner | Launch | Hypothesis | Day 7 | Spend | Hook | Hold | CTR | CPA | Verdict | Why
    sh.getRange(n, 1, 1, 17).setValues([[r.creative, r.product, '', '', '', '', '', new Date(r.launch + 'T00:00:00'), '', '', r.spend, r.hook, r.hold, r.ctr, r.cpa, r.verdict, '']]);
    sh.getRange(n, 10).setFormula('=IF(H' + n + '="","",H' + n + '+7)');
    sh.getRange(n, 8).setNumberFormat('yyyy-mm-dd');
    sh.getRange(n, 10).setNumberFormat('yyyy-mm-dd');
    sh.getRange(n, 11).setNumberFormat('$#,##0');
    sh.getRange(n, 12, 1, 2).setNumberFormat('0.0%');
    sh.getRange(n, 14).setNumberFormat('0.00%');
    sh.getRange(n, 15).setNumberFormat('$#,##0.00');
    have[r.creative] = true;
    added++;
  });
  return { added: added, skipped: skipped };
}

function list(sh) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  var tz = Session.getScriptTimeZone();
  var d = function (v) { return v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v || ''); };
  return sh.getRange(2, 1, last - 1, 17).getValues().map(function (r) {
    return { creative: String(r[0]), product: String(r[1]), owner: String(r[6]), launch: d(r[7]), day7: d(r[9]), spend: r[10], verdict: String(r[15]).trim(), why: String(r[16]).trim() };
  });
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
