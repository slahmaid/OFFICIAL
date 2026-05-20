/**
 * Toggle paid ad conversion tracking per product.
 * Set saqrActive to true only while the Saqr TikTok/Meta campaign is running.
 */
(function (global) {
    global.PRUMYSL_ADS = global.PRUMYSL_ADS || { saqrActive: false };
    global.prumyslSaqrAdsActive = function () {
        return !!(global.PRUMYSL_ADS && global.PRUMYSL_ADS.saqrActive);
    };
})(typeof window !== 'undefined' ? window : this);
