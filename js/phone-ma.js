(function (global) {
    var LOCAL_RE = /^0[67]\d{8}$/;
    var INTL_RE = /^212\d{9}$/;

    function cleanDigits(value) {
        return String(value || '').replace(/\D/g, '');
    }

    function isValidMaPhone(value) {
        var d = cleanDigits(value);
        return LOCAL_RE.test(d) || INTL_RE.test(d);
    }

    function sanitizeMaPhoneInput(value) {
        var d = cleanDigits(value);
        if (!d) return '';

        if (d.charAt(0) === '2') {
            if (d.length === 1) return '2';
            if (d.length === 2) return d.charAt(1) === '1' ? d : '2';
            if (!d.startsWith('212')) return '212'.slice(0, Math.min(d.length, 3));
            return d.slice(0, 12);
        }

        if (d.charAt(0) === '0') {
            d = d.slice(0, 10);
            if (d.length >= 2 && d.charAt(1) !== '6' && d.charAt(1) !== '7') return d.slice(0, 1);
            return d;
        }

        return '';
    }

    function bindMaPhoneInputs(selector) {
        var sel = selector || 'input[name="phone"]';
        if (!global.document) return;
        global.document.querySelectorAll(sel).forEach(function (input) {
            input.addEventListener('input', function () {
                input.value = sanitizeMaPhoneInput(input.value);
            });
        });
    }

    function toIntlMaPhone(value) {
        var d = cleanDigits(value);
        if (LOCAL_RE.test(d)) return '212' + d.slice(1);
        if (INTL_RE.test(d)) return d;
        return null;
    }

    global.prumyslMaPhone = {
        isValid: isValidMaPhone,
        sanitize: sanitizeMaPhoneInput,
        bind: bindMaPhoneInputs,
        toIntl: toIntlMaPhone,
        clean: cleanDigits,
        INVALID_MSG: 'المرجو إدخال رقم هاتف صحيح (06 أو 07 + 8 أرقام، أو 212 + 9 أرقام).'
    };
})(typeof window !== 'undefined' ? window : this);
