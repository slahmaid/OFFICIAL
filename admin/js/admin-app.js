(function () {
    var STATUS_LABELS = {
        new: 'جديد',
        confirmed: 'مؤكد',
        shipped: 'قيد الشحن',
        delivered: 'تم التسليم',
        cancelled: 'ملغي'
    };

    var PRODUCTS = [
        'كاميرا موكا',
        'موكا برو ماكس',
        'كاميرا الصقر',
        'بروجيكتور شمسي'
    ];

    var auth = null;
    var db = null;
    var unsubscribe = null;
    var allOrders = [];
    var lastStats = { total: 0, new: 0, today: 0, revenue: 0 };
    var dashboardAnimated = false;

    var loginView = document.getElementById('loginView');
    var dashboardView = document.getElementById('dashboardView');
    var configWarn = document.getElementById('configWarn');
    var loginForm = document.getElementById('loginForm');
    var loginError = document.getElementById('loginError');
    var logoutBtn = document.getElementById('logoutBtn');
    var logoutBtnSidebar = document.getElementById('logoutBtnSidebar');
    var exportBtn = document.getElementById('exportBtn');
    var refreshBtn = document.getElementById('refreshBtn');
    var userEmailSidebar = document.getElementById('userEmailSidebar');
    var ordersBody = document.getElementById('ordersBody');
    var ordersLoading = document.getElementById('ordersLoading');
    var ordersEmpty = document.getElementById('ordersEmpty');
    var ordersCountBadge = document.getElementById('ordersCountBadge');
    var filterSearch = document.getElementById('filterSearch');
    var filterStatus = document.getElementById('filterStatus');
    var filterProduct = document.getElementById('filterProduct');
    var statTotal = document.getElementById('statTotal');
    var statNew = document.getElementById('statNew');
    var statToday = document.getElementById('statToday');
    var statRevenue = document.getElementById('statRevenue');
    var toastHost = document.getElementById('toastHost');

    var anim = window.PrAdminAnim;

    function toast(msg, type) {
        if (!toastHost) return;
        var el = document.createElement('div');
        el.className = 'toast' + (type ? ' toast-' + type : '');
        el.textContent = msg;
        toastHost.appendChild(el);
        if (window.gsap) {
            gsap.fromTo(el, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35 });
            gsap.to(el, {
                autoAlpha: 0,
                y: -8,
                delay: 3.2,
                duration: 0.3,
                onComplete: function () { el.remove(); }
            });
        } else {
            setTimeout(function () { el.remove(); }, 3200);
        }
    }

    function getConfig() {
        return window.PRUMYSL_FIREBASE_CONFIG || null;
    }

    function isConfigured(cfg) {
        if (!cfg || !cfg.apiKey || !cfg.projectId) return false;
        if (String(cfg.apiKey).indexOf('YOUR_') === 0) return false;
        return true;
    }

    function initFirebase() {
        var cfg = getConfig();
        if (!isConfigured(cfg)) {
            if (configWarn) configWarn.classList.remove('hidden');
            return false;
        }
        if (configWarn) configWarn.classList.add('hidden');
        if (!firebase.apps.length) {
            firebase.initializeApp(cfg);
        }
        auth = firebase.auth();
        db = firebase.firestore();
        return true;
    }

    function formatDate(ts) {
        if (!ts || !ts.toDate) return '—';
        return ts.toDate().toLocaleString('ar-MA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatPrice(price) {
        if (price == null || price === '') return '—';
        return Number(price).toLocaleString('ar-MA') + ' د.م';
    }

    function whatsappUrl(phone) {
        var p = String(phone || '').replace(/\D/g, '');
        if (p.length === 10 && p.charAt(0) === '0') p = '212' + p.slice(1);
        else if (p.length === 9 && p.charAt(0) !== '2') p = '212' + p;
        return 'https://wa.me/' + p;
    }

    function statusBadgeClass(status) {
        return 'status-badge status-' + (status || 'new');
    }

    function isToday(ts) {
        if (!ts || !ts.toDate) return false;
        var d = ts.toDate();
        var now = new Date();
        return d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
    }

    function getFilteredOrders() {
        var q = (filterSearch.value || '').trim().toLowerCase();
        var status = filterStatus.value;
        var product = filterProduct.value;

        return allOrders.filter(function (o) {
            if (status && o.status !== status) return false;
            if (product && o.product.indexOf(product) === -1) return false;
            if (!q) return true;
            var hay = [o.name, o.city, o.phone, o.product, o.notes, o.source].join(' ').toLowerCase();
            return hay.indexOf(q) !== -1;
        });
    }

    function computeStats() {
        var todayCount = 0;
        var newCount = 0;
        var revenue = 0;
        allOrders.forEach(function (o) {
            if (o.status === 'new') newCount++;
            if (isToday(o.createdAt)) todayCount++;
            if (o.price != null && o.status !== 'cancelled') {
                revenue += Number(o.price) || 0;
            }
        });
        return {
            total: allOrders.length,
            new: newCount,
            today: todayCount,
            revenue: revenue
        };
    }

    function updateStats(animate) {
        var stats = computeStats();
        var els = {
            total: statTotal,
            new: statNew,
            today: statToday,
            revenue: statRevenue
        };

        if (animate && anim) {
            anim.animateStatValues(lastStats, stats, els);
        } else {
            statTotal.textContent = stats.total;
            statNew.textContent = stats.new;
            statToday.textContent = stats.today;
            statRevenue.textContent = stats.revenue.toLocaleString('ar-MA');
        }
        lastStats = stats;
    }

    function statusSelectHtml(order) {
        var html = '<select class="status-select" data-id="' + order.id + '" data-field="status">';
        Object.keys(STATUS_LABELS).forEach(function (key) {
            html += '<option value="' + key + '"' + (order.status === key ? ' selected' : '') + '>' + STATUS_LABELS[key] + '</option>';
        });
        return html + '</select>';
    }

    function renderTable(animateRows) {
        var rows = getFilteredOrders();
        updateStats(true);

        if (ordersCountBadge) {
            ordersCountBadge.textContent = rows.length;
        }

        if (!rows.length) {
            ordersBody.innerHTML = '';
            ordersEmpty.classList.remove('hidden');
            return;
        }

        ordersEmpty.classList.add('hidden');
        ordersBody.innerHTML = rows.map(function (o) {
            var rowClass = o.status === 'new' ? ' class="row-new"' : '';
            return '<tr data-id="' + o.id + '"' + rowClass + '>' +
                '<td>' + formatDate(o.createdAt) + '</td>' +
                '<td><strong>' + escapeHtml(o.name) + '</strong><br><span class="cell-muted">' + escapeHtml(o.city) + '</span></td>' +
                '<td><a class="phone-link" href="' + whatsappUrl(o.phone) + '" target="_blank" rel="noopener">💬 ' + escapeHtml(o.phone) + '</a></td>' +
                '<td>' + escapeHtml(o.product) + '</td>' +
                '<td>' + escapeHtml(String(o.quantity)) + '</td>' +
                '<td>' + formatPrice(o.price) + '</td>' +
                '<td>' + statusSelectHtml(o) + '</td>' +
                '<td><input type="text" class="notes-input" data-id="' + o.id + '" value="' + escapeAttr(o.notes || '') + '" placeholder="ملاحظة..."></td>' +
                '<td><span class="' + statusBadgeClass(o.status) + '">' + (STATUS_LABELS[o.status] || o.status) + '</span><br><span class="cell-muted">' + escapeHtml(o.source || '') + '</span></td>' +
                '<td><button type="button" class="btn btn-danger btn-sm btn-delete" data-id="' + o.id + '">حذف</button></td>' +
                '</tr>';
        }).join('');

        bindRowEvents();
        if (animateRows && anim) anim.animateTableRows();
    }

    function escapeHtml(s) {
        var d = document.createElement('di' + 'v');
        d.textContent = s;
        return d.innerHTML;
    }

    function escapeAttr(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;');
    }

    function bindRowEvents() {
        ordersBody.querySelectorAll('.status-select').forEach(function (el) {
            el.addEventListener('change', function () {
                updateOrderField(el.dataset.id, { status: el.value });
            });
        });
        ordersBody.querySelectorAll('.notes-input').forEach(function (el) {
            el.addEventListener('change', function () {
                updateOrderField(el.dataset.id, { notes: el.value.trim() });
            });
        });
        ordersBody.querySelectorAll('.btn-delete').forEach(function (el) {
            el.addEventListener('click', function () {
                if (!confirm('حذف هذا الطلب نهائياً؟')) return;
                var row = el.closest('tr');
                if (row && window.gsap) {
                    gsap.to(row, {
                        autoAlpha: 0,
                        x: 20,
                        duration: 0.25,
                        onComplete: function () { deleteOrder(el.dataset.id); }
                    });
                } else {
                    deleteOrder(el.dataset.id);
                }
            });
        });
    }

    function updateOrderField(id, patch) {
        if (!db || !id) return;
        db.collection('orders').doc(id).update(patch)
            .then(function () { toast('تم التحديث', 'success'); })
            .catch(function (err) { toast('خطأ: ' + (err.message || err), 'error'); });
    }

    function deleteOrder(id) {
        if (!db || !id) return;
        db.collection('orders').doc(id).delete()
            .then(function () { toast('تم الحذف', 'success'); })
            .catch(function (err) { toast('خطأ: ' + (err.message || err), 'error'); });
    }

    function subscribeOrders() {
        if (unsubscribe) unsubscribe();
        ordersLoading.classList.remove('hidden');
        ordersEmpty.classList.add('hidden');
        if (anim) anim.loadingPulse(ordersLoading);

        unsubscribe = db.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(500)
            .onSnapshot(function (snap) {
                ordersLoading.classList.add('hidden');
                if (anim) anim.killLoadingPulse(ordersLoading);
                allOrders = [];
                snap.forEach(function (doc) {
                    var data = doc.data();
                    data.id = doc.id;
                    allOrders.push(data);
                });
                renderTable(true);
            }, function (err) {
                ordersLoading.classList.add('hidden');
                if (anim) anim.killLoadingPulse(ordersLoading);
                var msg = err.message || String(err);
                if (msg.indexOf('permission') !== -1) {
                    msg = 'صلاحيات Firestore: انشر قواعد firestore.rules من Firebase Console';
                }
                toast(msg, 'error');
            });
    }

    function showDashboard(user) {
        var email = user.email || '';
        if (userEmailSidebar) userEmailSidebar.textContent = email;

        if (anim) {
            anim.crossfadeViews(loginView, dashboardView, function () {
                if (!dashboardAnimated) {
                    anim.animateDashboardEnter();
                    dashboardAnimated = true;
                }
                subscribeOrders();
            });
        } else {
            loginView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
            subscribeOrders();
        }
    }

    function showLogin() {
        dashboardAnimated = false;
        if (anim) {
            anim.crossfadeViews(dashboardView, loginView);
        } else {
            dashboardView.classList.add('hidden');
            loginView.classList.remove('hidden');
        }
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
        allOrders = [];
    }

    function exportCsv() {
        var rows = getFilteredOrders();
        if (!rows.length) {
            toast('لا توجد طلبات للتصدير', 'error');
            return;
        }
        var headers = ['Date', 'Name', 'City', 'Phone', 'Product', 'Qty', 'Price', 'Status', 'Source', 'Notes'];
        var lines = [headers.join(',')];
        rows.forEach(function (o) {
            var date = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toISOString() : '';
            lines.push([
                date,
                csvCell(o.name),
                csvCell(o.city),
                csvCell(o.phone),
                csvCell(o.product),
                o.quantity,
                o.price != null ? o.price : '',
                csvCell(o.status),
                csvCell(o.source),
                csvCell(o.notes)
            ].join(','));
        });
        var blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'prumysl-orders-' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        URL.revokeObjectURL(a.href);
        toast('تم تصدير ' + rows.length + ' طلب', 'success');
    }

    function csvCell(v) {
        return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    }

    function doLogout() {
        auth.signOut();
    }

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        loginError.textContent = '';
        var btn = loginForm.querySelector('.btn-login');
        if (btn) btn.disabled = true;
        auth.signInWithEmailAndPassword(
            document.getElementById('loginEmail').value.trim(),
            document.getElementById('loginPassword').value
        ).catch(function (err) {
            loginError.textContent = err.code === 'auth/invalid-credential'
                ? 'البريد أو كلمة المرور غير صحيحة.'
                : (err.message || 'فشل تسجيل الدخول');
            if (anim) anim.shakeError(loginForm);
        }).finally(function () {
            if (btn) btn.disabled = false;
        });
    });

    logoutBtn.addEventListener('click', doLogout);
    if (logoutBtnSidebar) logoutBtnSidebar.addEventListener('click', doLogout);
    exportBtn.addEventListener('click', exportCsv);
    refreshBtn.addEventListener('click', function () {
        if (auth.currentUser) {
            subscribeOrders();
            toast('جاري التحديث...');
        }
    });

    var filterTimer;
    function onFilterChange() {
        clearTimeout(filterTimer);
        filterTimer = setTimeout(function () { renderTable(false); }, 180);
    }

    filterSearch.addEventListener('input', onFilterChange);
    filterStatus.addEventListener('change', onFilterChange);
    filterProduct.addEventListener('change', onFilterChange);

    function populateProductFilter() {
        filterProduct.innerHTML = '<option value="">كل المنتجات</option>';
        PRODUCTS.forEach(function (p) {
            var opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            filterProduct.appendChild(opt);
        });
    }

    if (!initFirebase()) {
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
        return;
    }

    populateProductFilter();

    auth.onAuthStateChanged(function (user) {
        if (user) showDashboard(user);
        else showLogin();
    });
})();
