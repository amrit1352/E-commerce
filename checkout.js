/**
 * checkout.js — R.N Readymade checkout page logic
 */

const CART_KEY = 'rn_cart';
let cartItems = [];
let activeCoupon = '';

// ── Helpers ──────────────────────────────────────────────
function fmt(amount) {
    return typeof formatPrice === 'function' ? formatPrice(amount) : ('Rs. ' + Number(amount).toLocaleString('en-NP'));
}

function escHtml(str) {
    if (typeof RN !== 'undefined' && RN.escapeHtml) return RN.escapeHtml(str);
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// ── Load cart ─────────────────────────────────────────────
function loadCart() {
    cartItems = (typeof RN !== 'undefined') ? RN.parseJSON(RN.storage.getItem(CART_KEY), []) : [];
    if (!Array.isArray(cartItems)) cartItems = [];

    if (!cartItems.length) {
        const page = document.querySelector('.checkout-page');
        if (page) {
            page.innerHTML = `
                <div class="checkout-empty">
                    <i class="fa-solid fa-cart-xmark"></i>
                    <h2>Your cart is empty</h2>
                    <p>You haven't added anything yet.</p>
                    <a href="index.html" class="auth-submit-btn" style="display:inline-flex;align-items:center;gap:8px;margin-top:16px;text-decoration:none;padding:14px 28px">
                        <i class="fa-solid fa-arrow-left"></i> Shop Now
                    </a>
                </div>`;
        }
        return false;
    }
    return true;
}

// ── Render order summary items ─────────────────────────────
function renderSummaryItems() {
    const list = document.getElementById('checkoutItems');
    if (!list) return;

    list.innerHTML = cartItems.map(item => {
        const product = (typeof getProductById === 'function') ? getProductById(item.id) : null;
        const imgSrc = product?.images?.[0] || product?.image || '';
        const size = item.size ? ` (${item.size})` : '';
        const color = item.color ? ` · ${item.color}` : '';
        const lineTotal = fmt(item.price * item.qty);

        const imgHtml = imgSrc
            ? `<img class="checkout-item-thumb" src="${escHtml(imgSrc)}" alt="${escHtml(item.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`
            : '';

        return `
            <li>
                ${imgHtml}
                <div class="checkout-item-img-placeholder" style="display:${imgSrc ? 'none' : 'grid'}">
                    <i class="fa-solid fa-shirt"></i>
                </div>
                <div class="checkout-item-info">
                    <div class="checkout-item-name">${escHtml(item.name)}</div>
                    <div class="checkout-item-meta">Qty: ${item.qty}${size}${color}</div>
                </div>
                <div class="checkout-item-price">${lineTotal}</div>
            </li>`;
    }).join('');
}

// ── Render price breakdown ─────────────────────────────────
function renderSummary() {
    if (typeof RN === 'undefined' || typeof RN.calcCartTotals !== 'function') return {};
    const totals = RN.calcCartTotals(cartItems, activeCoupon);

    document.getElementById('sumSubtotal').textContent = fmt(totals.subtotal);
    document.getElementById('sumDiscount').textContent = fmt(totals.discount);
    document.getElementById('sumShipping').textContent = totals.shipping === 0 ? 'Free' : fmt(totals.shipping);
    document.getElementById('sumTax').textContent = fmt(totals.tax);
    document.getElementById('sumTotal').textContent = fmt(totals.total);

    return totals;
}

// ── eSewa QR Code ─────────────────────────────────────────
function updateEsewaQr() {
    const totals = (typeof RN !== 'undefined' && RN.calcCartTotals) ? RN.calcCartTotals(cartItems, activeCoupon) : { total: 0 };
    const amount = totals.total || 0;
    const payload = `eSewa Payment\nMerchant: Amrit Prasad Sah\nNumber: 9829192619\nAmount: Rs.${amount}`;
    const qr = document.getElementById('esewaQr');
    if (qr) {
        qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payload)}`;
    }
}

// ── Toggle payment panels ─────────────────────────────────
function updatePaymentPanels(method) {
    const esewaBox = document.getElementById('esewaBox');
    const khaltiBox = document.getElementById('khaltiBox');
    const cardBox = document.getElementById('cardBox');

    [esewaBox, khaltiBox, cardBox].forEach(el => el?.classList.remove('active'));

    if (method === 'esewa') {
        esewaBox?.classList.add('active');
        updateEsewaQr();
    } else if (method === 'khalti') {
        khaltiBox?.classList.add('active');
    } else if (method === 'card') {
        cardBox?.classList.add('active');
    }

    // Update progress stepper
    const stepPayment = document.getElementById('stepPayment');
    if (method !== 'cod' && stepPayment) {
        stepPayment.classList.add('active');
    }
}

document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.checked) updatePaymentPanels(radio.value);
    });
});

// ── Validation ────────────────────────────────────────────
function validateForm(data, payment) {
    const errors = [];
    if (!data.name || data.name.length < 2) errors.push('Please enter your full name (at least 2 characters).');
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Please enter a valid email address.');
    if (!data.phone || data.phone.replace(/\D/g, '').length < 10) errors.push('Please enter a valid 10-digit phone number.');
    if (!data.address || data.address.length < 5) errors.push('Please enter your complete street address.');
    if (!data.city) errors.push('City is required.');
    if (!data.zip || !/^\d{5}$/.test(data.zip)) errors.push('Please enter a valid 5-digit postal code.');
    if (['esewa', 'khalti', 'card'].includes(payment) && !data.txnId) {
        errors.push('Please enter your Transaction ID after completing digital payment.');
    }
    return errors;
}

// ── Coupon ────────────────────────────────────────────────
document.getElementById('checkoutApplyCoupon')?.addEventListener('click', () => {
    const code = (document.getElementById('checkoutCoupon')?.value || '').trim();
    const msg = document.getElementById('couponMsg');
    if (!code) {
        if (msg) { msg.textContent = 'Please enter a coupon code.'; msg.className = 'checkout-msg error'; }
        return;
    }
    activeCoupon = code;
    const totals = renderSummary();
    updateEsewaQr();
    if (msg) {
        if (totals.couponValid) {
            msg.textContent = `✓ Coupon "${code.toUpperCase()}" applied!`;
            msg.className = 'checkout-msg success';
        } else {
            msg.textContent = 'Invalid or ineligible coupon code.';
            msg.className = 'checkout-msg error';
            activeCoupon = '';
            renderSummary();
        }
    }
});

// ── Submit ────────────────────────────────────────────────
document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formMsg = document.querySelector('.checkout-msg:not(#couponMsg)');
    const payment = document.querySelector('input[name="payment"]:checked')?.value || 'cod';

    // Get txnId from whichever visible field
    let txnId = '';
    if (payment === 'esewa') txnId = (document.getElementById('chkTxnId')?.value || '').trim();
    else if (payment === 'khalti') txnId = (document.getElementById('chkKhaltiTxn')?.value || '').trim();

    const data = {
        name: document.getElementById('chkName').value.trim(),
        email: document.getElementById('chkEmail').value.trim().toLowerCase(),
        phone: document.getElementById('chkPhone').value.trim(),
        address: document.getElementById('chkAddress').value.trim(),
        city: document.getElementById('chkCity').value.trim(),
        state: document.getElementById('chkState').value.trim(),
        zip: document.getElementById('chkZip').value.trim(),
        landmark: document.getElementById('chkLandmark').value.trim(),
        txnId
    };

    const errors = validateForm(data, payment);
    if (errors.length) {
        if (formMsg) { formMsg.textContent = errors[0]; formMsg.className = 'checkout-msg error'; }
        return;
    }

    // Disable button
    const btn = document.getElementById('placeOrderBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Placing Order…'; }

    const totals = (typeof RN !== 'undefined' && RN.calcCartTotals) ? RN.calcCartTotals(cartItems, activeCoupon) : { subtotal: 0, shipping: 0, tax: 0, discount: 0, total: 0 };
    const orderId = 'RN' + Date.now().toString().slice(-8);

    const order = {
        orderId,
        customerName: data.name,
        customerPhone: data.phone,
        userEmail: data.email,
        txnId: data.txnId || (payment === 'cod' ? 'COD' : ''),
        paymentMethod: payment,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zip,
        landmark: data.landmark,
        deliveryAddress: [data.address, data.city, data.state].filter(Boolean).join(', '),
        items: cartItems.map(i => ({ ...i })),
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        tax: totals.tax,
        discount: totals.discount,
        couponCode: activeCoupon || null,
        total: totals.total,
        date: new Date().toISOString(),
        status: payment === 'cod' ? 'pending' : 'processing'
    };

    // Reduce stock & save order locally
    if (typeof reduceStock === 'function') reduceStock(cartItems);
    if (typeof saveOrder === 'function') saveOrder(order);

    // Try backend sync
    try {
        if (typeof RN !== 'undefined' && RN.api && typeof RN.api.healthCheck === 'function') {
            if (await RN.api.healthCheck()) {
                await RN.api.submitOrder(order);
            }
        }
    } catch { /* offline mode OK */ }

    // Clear cart and redirect
    if (typeof RN !== 'undefined') RN.storage.removeItem(CART_KEY);
    else { try { localStorage.removeItem(CART_KEY); } catch {} }
    sessionStorage.setItem('rn_last_order', JSON.stringify(order));
    window.location.href = `order-confirmation.html?id=${orderId}`;
});

// ── Initialise ────────────────────────────────────────────
if (loadCart()) {
    renderSummaryItems();
    renderSummary();

    // Auto-fill from logged-in user
    try {
        const savedUser = (typeof RN !== 'undefined')
            ? RN.parseJSON(RN.storage.getItem('rn_current_user'), null)
            : JSON.parse(localStorage.getItem('rn_current_user') || 'null');
        if (savedUser) {
            const el = (id) => document.getElementById(id);
            if (savedUser.name) el('chkName').value = savedUser.name;
            if (savedUser.email) el('chkEmail').value = savedUser.email;
            if (savedUser.phone) el('chkPhone').value = savedUser.phone;
        }
    } catch { /* ignore */ }
}
