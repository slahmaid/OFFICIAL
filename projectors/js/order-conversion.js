/**
 * Fire Purchase/CompletePayment only after a real form submit (one-time, 30 min).
 */
(function (global) {
    var KEY = 'prumysl_order_pending';
    var MAX_AGE_MS = 30 * 60 * 1000;

    global.prumyslSetOrderPending = function (source) {
        if (!source) return;
        try {
            sessionStorage.setItem(KEY, JSON.stringify({ source: String(source), ts: Date.now() }));
        } catch (_) {}
    };

    global.prumyslConsumeOrderPending = function (source) {
        if (!source) return false;
        try {
            var raw = sessionStorage.getItem(KEY);
            if (!raw) return false;
            var o = JSON.parse(raw);
            sessionStorage.removeItem(KEY);
            if (!o || o.source !== String(source)) return false;
            if (!o.ts || Date.now() - o.ts > MAX_AGE_MS) return false;
            return true;
        } catch (_) {
            return false;
        }
    };
})(typeof window !== 'undefined' ? window : this);
