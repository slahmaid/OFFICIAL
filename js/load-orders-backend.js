/**
 * Loads Prumysl order backend: Firebase SDK + config + Firestore + Google Sheet.
 * Usage (from product folder): <script src="js/load-orders-backend.js"></script>
 * Usage (from site root):       <script src="js/load-orders-backend.js" data-base="../js/"></script>
 */
(function () {
    var script = document.currentScript;
    var base = (script && script.getAttribute('data-base')) || 'js/';
    if (base.slice(-1) !== '/') base += '/';

    var FIREBASE_VERSION = '10.14.1';
    var chain = [
        'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/firebase-firestore-compat.js',
        base + 'firebase-config.js',
        base + 'orders-firebase.js',
        base + 'orders-sheet.js',
        base + 'orders-backend.js'
    ];

    function loadNext(i) {
        if (i >= chain.length) {
            document.dispatchEvent(new CustomEvent('prumysl-orders-ready'));
            return;
        }
        var s = document.createElement('script');
        s.src = chain[i];
        s.async = false;
        s.onload = function () { loadNext(i + 1); };
        s.onerror = function () {
            if (i < 2) {
                console.warn('[Prumysl] Firebase SDK failed to load');
            } else if (chain[i].indexOf('firebase-config') !== -1) {
                console.warn('[Prumysl] Missing firebase-config.js — copy firebase-config.example.js');
            }
            loadNext(i + 1);
        };
        document.head.appendChild(s);
    }

    loadNext(0);
})();
