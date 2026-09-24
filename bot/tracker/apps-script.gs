/*
 Blissta Creative Ops tracker -> Donnaa (Slack) bridge.

 Lives in the tracker spreadsheet (Extensions -> Apps Script). Watches the Videos, Revisions and
 Briefs tabs and POSTs changed rows to Donnaa, who posts into #creative-accountability and tags
 whoever owns the next move. This script only reads the sheet, it never writes to it.

 One-time setup, done by anyone with edit access to the sheet:
   1. Extensions -> Apps Script, delete the sample code, paste this whole file, save.
   2. Pick "setup" in the function dropdown, press Run, allow the permissions it asks for.
   3. Done. It fires on every change to the sheet and also checks once a minute as a safety net.
      The first run only takes a snapshot, nothing old is posted.

 To switch it off: Triggers (clock icon on the left) -> delete both triggers, or run "teardown".
*/
var DONNAA_URL = 'https://powerful-insight-production-d93f.up.railway.app/tracker';
var SECRET = 'PASTE_TRACKER_SECRET_HERE';

function setup() {
  teardown();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.newTrigger('scan').forSpreadsheet(ss).onChange().create();
  ScriptApp.newTrigger('scan').timeBased().everyMinutes(1).create();
  scan();
  Logger.log('Donnaa bridge installed. Snapshot taken, changes from now on are posted.');
}
function teardown() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
}
/* Forget the snapshot so the next scan re-baselines silently (never re-posts old rows). */
function resetSnapshot() {
  PropertiesService.getScriptProperties().deleteAllProperties();
}

/* ---------- reading ---------- */
function tabs() {
  var out = {};
  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach(function (sh) {
    if (sh.getLastRow() < 1) return;
    var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    var has = function (h) { return head.indexOf(h) >= 0; };
    if (has('Video ID') && has('Creative Strategist') && has('Status')) out.videos = { sheet: sh, head: head };
    else if (has('Revision ID') && has('Stage')) out.revisions = { sheet: sh, head: head };
    else if (has('Brief ID') && has('Routing Status')) out.briefs = { sheet: sh, head: head };
  });
  return out;
}
function rows(t) {
  if (!t) return [];
  var sh = t.sheet, n = sh.getLastRow() - 1;
  if (n < 1) return [];
  var vals = sh.getRange(2, 1, n, t.head.length).getValues();
  return vals.map(function (r) {
    var o = {};
    t.head.forEach(function (h, i) { var v = r[i]; o[h] = v instanceof Date ? v.toISOString() : String(v == null ? '' : v); });
    return o;
  });
}

/* ---------- events ---------- */
function videoEvent(v, prevStatus) {
  return {
    sheet: 'Videos', id: v['Video ID'], product: v['Product'], name: v['Brief Name'],
    status: v['Status'], prevStatus: prevStatus || '',
    strategist: v['Creative Strategist'], strategistEmail: v['Strategist Email'],
    editor: v['Editor Name'], editorEmail: v['Editor Email'],
    briefLink: v['Brief Link'], firstCut: v['First Cut Link'], finalLink: v['Final Link'],
    parentDrive: v['Parent Google Drive Link'],
    revisionVersion: v['Revision Version'], resubmitted: v['Revision Resubmitted'],
    reviewComment: v['Review Comment'], reviewer: v['Reviewer Name'],
    briefWrittenBy: v['Brief Written By'], blockedBy: v['Blocked By'], blockerReason: v['Blocker Reason'],
    updatedAt: v['Updated At']
  };
}
function sig(v) {
  return [v['Status'], v['Revision Version'], v['Revision Resubmitted'], v['Reviewed At'], v['Blocked At'], v['Editor Email']].join('|');
}

function scan() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;
  try {
    var props = PropertiesService.getScriptProperties();
    var snap = props.getProperties();
    var first = !snap['_init'];
    var t = tabs();
    var videos = rows(t.videos), revs = rows(t.revisions), briefs = rows(t.briefs);
    var byId = {};
    videos.forEach(function (v) { byId[v['Video ID']] = v; });

    var events = [], next = {};
    videos.forEach(function (v) {
      var id = v['Video ID']; if (!id) return;
      var s = sig(v), old = snap['v:' + id];
      next['v:' + id] = s;
      if (first || old === s) return;
      events.push(videoEvent(v, old ? old.split('|')[0] : ''));
    });
    revs.forEach(function (r) {
      var id = r['Revision ID']; if (!id) return;
      next['r:' + id] = '1';
      if (first || snap['r:' + id]) return;
      if (String(r['Stage']).toUpperCase() !== 'BRIEF') return; /* video comments ride along with the status change */
      var v = byId[r['Video ID']] || {};
      var e = videoEvent(v, v['Status']);
      e.sheet = 'Revisions'; e.id = r['Video ID']; e.revisionId = id; e.stage = r['Stage']; e.entryType = r['Entry Type'];
      e.author = r['Author Name']; e.authorEmail = r['Author Email']; e.comment = r['Comment']; e.revisionNumber = r['Revision Number'];
      events.push(e);
    });
    briefs.forEach(function (b) {
      var id = b['Brief ID']; if (!id) return;
      var s = String(b['Updated At']), old = snap['b:' + id];
      next['b:' + id] = s;
      if (first || !old || old === s) return; /* a brand-new brief shows up through the Videos tab instead */
      var v = byId[id] || {};
      var e = videoEvent(v, v['Status']);
      e.sheet = 'Briefs'; e.id = id; e.product = b['Product'] || e.product; e.name = b['Brief Name'] || e.name;
      e.briefLink = b['Brief Link'] || e.briefLink; e.strategist = b['Strategist'] || e.strategist; e.strategistEmail = b['Strategist Email'] || e.strategistEmail;
      e.editor = b['Video Editor'] || e.editor; e.editorEmail = b['Video Editor Email'] || e.editorEmail; e.briefWrittenBy = b['Brief Written By'] || e.briefWrittenBy;
      e.updatedAt = s;
      events.push(e);
    });

    if (events.length) {
      var res = UrlFetchApp.fetch(DONNAA_URL, {
        method: 'post', contentType: 'application/json', muteHttpExceptions: true,
        headers: { 'X-Tracker-Secret': SECRET }, payload: JSON.stringify({ events: events })
      });
      if (res.getResponseCode() !== 200) { Logger.log('Donnaa said ' + res.getResponseCode() + ': ' + res.getContentText()); return; } /* keep the old snapshot, retry next minute */
      Logger.log('sent ' + events.length + ' event(s): ' + res.getContentText().slice(0, 500));
    }
    next['_init'] = '1';
    /* Drop keys that vanished, write the rest. */
    Object.keys(snap).forEach(function (k) { if (!(k in next)) props.deleteProperty(k); });
    var changed = {};
    Object.keys(next).forEach(function (k) { if (snap[k] !== next[k]) changed[k] = next[k]; });
    if (Object.keys(changed).length) props.setProperties(changed);
  } finally { lock.releaseLock(); }
}
