/**
 * Sends order data to the unified Google Sheet (Apps Script Web App).
 * Paste your deployed /exec URL below after running google-apps-script/all-orders.gs
 */
(function (global) {
    var ORDERS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFR6sq_iWRbW47Nab2rwvyz43nva1BZdWiB_ZirRxXlQBz4LbWk83Vx1ej2ed2TYbC/exec';

    function submitOrderToSheet(order) {
        if (!ORDERS_SCRIPT_URL) return;
        var body = new URLSearchParams();
        body.set('name', order.name || '');
        body.set('city', order.city || '');
        body.set('phone', order.phone || '');
        body.set('product', order.product || '');
        body.set('quantity', String(order.quantity != null ? order.quantity : ''));
        body.set('price', String(order.price != null ? order.price : ''));
        fetch(ORDERS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: body,
            keepalive: true
        }).catch(function () {});
    }

    global.submitOrderToSheet = submitOrderToSheet;
})(typeof window !== 'undefined' ? window : this);
