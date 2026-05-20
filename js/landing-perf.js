/**
 * Landing page performance helpers (order CTA, lazy images).
 * Does not touch order submission, redirects, or product links.
 */
(function (global) {
    function initMobileOrderCta(options) {
        var cta = document.getElementById(options.ctaId || 'mobileCta');
        var btn = document.getElementById(options.btnId || 'goToOrder');
        var order = document.getElementById(options.orderId || 'order');
        if (!cta || !btn || !order) return;

        var mq = global.matchMedia('(max-width: 480px)');

        btn.addEventListener('click', function () {
            order.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        function setVisible(show) {
            cta.style.display = show ? 'block' : 'none';
        }

        function bindObserver() {
            if (!mq.matches) {
                setVisible(false);
                return;
            }
            if ('IntersectionObserver' in global) {
                var io = new IntersectionObserver(
                    function (entries) {
                        var entry = entries[0];
                        setVisible(!(entry && entry.isIntersecting));
                    },
                    { root: null, threshold: 0.02 }
                );
                io.observe(order);
            } else {
                setVisible(true);
            }
        }

        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', bindObserver);
        } else if (typeof mq.addListener === 'function') {
            mq.addListener(bindObserver);
        }
        bindObserver();
    }

    function initLazyImageFade() {
        if (!global.document) return;
        global.document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
            function markLoaded() {
                img.classList.add('loaded');
            }
            if (img.complete) markLoaded();
            else img.addEventListener('load', markLoaded, { once: true });
        });
    }

    function deferThirdParty(fn) {
        if (typeof fn !== 'function') return;
        if ('requestIdleCallback' in global) {
            global.requestIdleCallback(fn, { timeout: 3000 });
        } else {
            global.addEventListener('load', fn, { once: true });
        }
    }

    global.prumyslLandingPerf = {
        initMobileOrderCta: initMobileOrderCta,
        initLazyImageFade: initLazyImageFade,
        deferThirdParty: deferThirdParty
    };
})(typeof window !== 'undefined' ? window : this);
