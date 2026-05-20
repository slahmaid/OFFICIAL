/**
 * Shared thank-you conversion tracking: real order + campaign on + single Purchase/CompletePayment.
 */
(function (global) {
    var CURRENCY = 'MAD';

    function orderSourceFromMeta(meta) {
        if (!meta) return null;
        if (meta.isSaqr) return 'saqr';
        var k = meta.key || '';
        if (k === 'projectors' || k === 'projector' || k === '300w' || k === '400w') return 'projectors';
        if (k === 'moka-pro-max' || k === '1_camera' || k === '2_camera') return 'moka-pro-max';
        if (k.indexOf('moka') !== -1) return 'moka';
        return null;
    }

    function adsActiveForSource(source) {
        var ads = global.PRUMYSL_ADS;
        if (!ads || !source) return false;
        if (source === 'saqr') return !!ads.saqrActive;
        if (source === 'projectors') return !!ads.projectorsActive;
        if (source === 'moka') return !!ads.mokaActive;
        if (source === 'moka-pro-max') return !!ads.mokaProMaxActive;
        return false;
    }

    global.prumyslThankYouSourceFromMeta = orderSourceFromMeta;

    global.prumyslShouldTrackThankYou = function (source) {
        if (!source || typeof global.prumyslConsumeOrderPending !== 'function') return false;
        return global.prumyslConsumeOrderPending(source) && adsActiveForSource(source);
    };

    function runTtq(fn) {
        if (typeof global.ttq === 'undefined' || typeof global.ttq.ready !== 'function') return;
        global.ttq.ready(function () {
            try {
                var idRaw = sessionStorage.getItem('prumysl_ttq_ident');
                if (idRaw) {
                    var o = JSON.parse(idRaw);
                    global.ttq.identify({
                        phone_number: o.phone_number,
                        external_id: o.external_id
                    });
                    sessionStorage.removeItem('prumysl_ttq_ident');
                }
            } catch (_) {}
            fn();
        });
    }

    /**
     * @param {{ source?: string, meta?: object, pp: object, isSaqr?: boolean }} opts
     */
    global.prumyslFireThankYouConversion = function (opts) {
        if (!opts || !opts.pp) return;
        var source = opts.source || orderSourceFromMeta(opts.meta);
        if (!global.prumyslShouldTrackThankYou(source)) return;

        var pp = opts.pp;
        var isSaqr = !!opts.isSaqr || !!(opts.meta && opts.meta.isSaqr);

        if (typeof global.prumyslFbqPurchase === 'function') {
            global.prumyslFbqPurchase({
                contentId: pp.contentId,
                contentName: pp.contentName,
                value: pp.value,
                numItems: pp.numItems
            });
        }

        runTtq(function () {
            var contents = [{
                content_id: pp.contentId,
                content_type: 'product',
                content_name: pp.contentName
            }];
            var payload = { contents: contents, value: pp.value, currency: CURRENCY };
            if (isSaqr) global.ttq.track('CompletePayment', payload);
            else global.ttq.track('Purchase', payload);
        });
    };
})(typeof window !== 'undefined' ? window : this);
