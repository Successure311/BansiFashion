/**
 * Bansi Fashion — Google Sheets backend.
 *
 * SETUP:
 * 1. Create a new Google Sheet.
 * 2. Extensions > Apps Script — delete the boilerplate, paste this whole file in.
 * 3. Save. Select "seedQualityMaster" in the function dropdown, click Run
 *    (approve permissions when asked). This creates the Inward, Outward and
 *    QualityMaster tabs and fills QualityMaster with the starting qualities.
 * 4. Deploy > New deployment > Web app.
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. Copy the deployment URL (ends in /exec) into src/config.js as WEBAPP_URL.
 *
 * If you edit this file later, redeploy via:
 * Deploy > Manage deployments > Edit (pencil) > New version > Deploy.
 * The /exec URL stays the same, so the app never needs to change.
 */

var SCHEMA = {
  Inward: ['Date', 'QualityName', 'ColourNo', 'Meter', 'LotNo'],
  Outward: ['Date', 'QualityName', 'ColourNo', 'Meter', 'ChallanNo'],
  QualityMaster: ['QualityName', 'RangeStart', 'RangeEnd']
};

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    var headers = SCHEMA[name];
    if (headers) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sh;
}

function readSheet_(name) {
  var sh = getSheet_(name);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.join('') === '') continue;
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var v = row[c];
      if (v instanceof Date) {
        v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      obj[headers[c]] = v;
    }
    rows.push(obj);
  }
  return rows;
}

function appendRow_(name, rowObj) {
  var sh = getSheet_(name);
  var headers = SCHEMA[name];
  var values = headers.map(function (h) { return rowObj[h] !== undefined ? rowObj[h] : ''; });
  sh.appendRow(values);
  var lastRow = sh.getLastRow();
  var dateCol = headers.indexOf('Date');
  if (dateCol !== -1) {
    sh.getRange(lastRow, dateCol + 1).setNumberFormat('@'); // keep Date as plain text
  }
}

function upsertRow_(name, rowObj, keyColumn) {
  var sh = getSheet_(name);
  var headers = SCHEMA[name];
  var keyIdx = headers.indexOf(keyColumn);
  if (keyIdx === -1) return appendRow_(name, rowObj);
  var values = sh.getDataRange().getValues();
  var keyValue = String(rowObj[keyColumn] || '').trim().toLowerCase();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][keyIdx] || '').trim().toLowerCase() === keyValue) {
      for (var c = 0; c < headers.length; c++) {
        if (rowObj[headers[c]] !== undefined) {
          sh.getRange(i + 1, c + 1).setValue(rowObj[headers[c]]);
        }
      }
      return;
    }
  }
  appendRow_(name, rowObj);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    var params = e.parameter;
    if (params.sheets) {
      var names = params.sheets.split(',');
      var out = {};
      names.forEach(function (n) { out[n] = readSheet_(n); });
      return json_(out);
    }
    if (params.sheet) {
      return json_(readSheet_(params.sheet));
    }
    return json_({ error: 'Missing sheet or sheets parameter' });
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    return json_({ error: 'Server busy, try again.', retryable: true });
  }
  try {
    var body = JSON.parse(e.postData.contents);
    if (!body.sheet || !SCHEMA[body.sheet]) {
      return json_({ error: 'Unknown sheet: ' + body.sheet });
    }
    if (body.action === 'upsert') {
      upsertRow_(body.sheet, body.row, body.key_column);
    } else {
      appendRow_(body.sheet, body.row);
    }
    SpreadsheetApp.flush();
    return json_({ ok: true });
  } catch (err) {
    return json_({ error: String(err), retryable: true });
  } finally {
    lock.releaseLock();
  }
}

// Run ONCE from the Apps Script editor to create tabs + seed default qualities.
function seedQualityMaster() {
  var defaults = [
    ['PURE MUL CHANDERI 56"', 201, 319],
    ['SIYA SILK 56"', 1, 101],
    ['MUL CRUSH 56"', 1901, 1939],
    ['BANARAS MUL CHIFFON 44"', 1501, 1528],
    ['MUL LINEN 56"', 901, 924],
    ['FLORENCE CRUSH SATIN 56"', 801, 824]
  ];
  getSheet_('Inward');
  getSheet_('Outward');
  defaults.forEach(function (d) {
    upsertRow_('QualityMaster', { QualityName: d[0], RangeStart: d[1], RangeEnd: d[2] }, 'QualityName');
  });
}
