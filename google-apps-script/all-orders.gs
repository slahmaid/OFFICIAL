/**
 * Prumysl — all landing pages → one Google Sheet
 *
 * Columns: Date | Name | City | Phone Number | Product | Quantity | Price
 *
 * Setup:
 * 1. Create a new Google Sheet.
 * 2. Extensions → Apps Script → paste this file → Save.
 * 3. Run setupSheet once (authorize when prompted).
 * 4. Deploy → New deployment → Web app:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the /exec URL into js/orders-sheet.js → ORDERS_SCRIPT_URL
 */

var SHEET_NAME = 'Orders';
var HEADERS = ['Date', 'Name', 'City', 'Phone Number', 'Product', 'Quantity', 'Price'];

function getOrdersSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function setupSheet() {
  var sheet = getOrdersSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function parsePostParams_(e) {
  var p = {};
  if (e && e.parameter) {
    var keys = Object.keys(e.parameter);
    for (var i = 0; i < keys.length; i++) {
      p[keys[i]] = e.parameter[keys[i]];
    }
  }
  if (Object.keys(p).length) return p;

  if (e && e.postData && e.postData.contents) {
    var type = String(e.postData.type || '').toLowerCase();
    if (type.indexOf('application/x-www-form-urlencoded') !== -1) {
      var pairs = String(e.postData.contents).split('&');
      for (var j = 0; j < pairs.length; j++) {
        var eq = pairs[j].indexOf('=');
        var key = decodeURIComponent((eq >= 0 ? pairs[j].substring(0, eq) : pairs[j]).replace(/\+/g, ' '));
        var val = decodeURIComponent((eq >= 0 ? pairs[j].substring(eq + 1) : '').replace(/\+/g, ' '));
        p[key] = val;
      }
    }
  }
  return p;
}

function productLabel_(p) {
  if (p.product) return String(p.product).trim();

  if (p.model) {
    var m = String(p.model).toLowerCase();
    if (m === '300w') return 'بروجيكتور شمسي 300 واط';
    if (m === '400w') return 'بروجيكتور شمسي 400 واط';
    return 'بروجيكتور شمسي ' + String(p.model).trim();
  }

  if (p.product_offer === '2_camera') return 'كاميرا موكا (عرض ×2)';
  if (p.product_offer === '1_camera') return 'كاميرا موكا';

  return '';
}

function parseQuantity_(p) {
  if (p.quantity) {
    var q = parseInt(p.quantity, 10);
    if (!isNaN(q) && q > 0) return q;
  }
  if (p.product_offer === '2_camera') return 2;
  return 1;
}

function parsePrice_(p) {
  if (p.price) {
    var price = parseFloat(String(p.price).replace(',', '.'));
    if (!isNaN(price) && price >= 0) return price;
  }
  return '';
}

function doGet() {
  return ContentService.createTextOutput('Prumysl orders endpoint OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    setupSheet();
    var p = parsePostParams_(e);
    var quantity = parseQuantity_(p);
    var price = parsePrice_(p);

    getOrdersSheet_().appendRow([
      new Date(),
      String(p.name || '').trim(),
      String(p.city || '').trim(),
      String(p.phone || '').replace(/\D/g, ''),
      productLabel_(p),
      quantity,
      price
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
