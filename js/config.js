/**
 * R.N Readymade — shared configuration & utilities
 */
window.RN = window.RN || {};

RN.CONFIG = {
    CART_KEY: 'rn_cart',
    WISHLIST_KEY: 'rn_wishlist',
    COMPARE_KEY: 'rn_compare',
    RECENT_KEY: 'rn_recently_viewed',
    VISITORS_KEY: 'rn_visitors',
    THEME_KEY: 'rn_theme',
    LANG_KEY: 'rn_lang',
    STORAGE_KEYS: {
        USER: 'rn_user_profile',
        ADDRESSES: 'rn_user_addresses',
        REWARDS: 'rn_user_rewards',
        NOTIFICATIONS: 'rn_notifications',
        ORDERS: 'rn_orders',
        CART: 'rn_cart',
        WISHLIST: 'rn_wishlist',
        COMPARE: 'rn_compare',
        RECENT: 'rn_recently_viewed'
    },
    API_BASE: (function() {
        try {
            return localStorage.getItem('rn_api_base') || (
                window.location.origin && window.location.origin !== 'null' && !window.location.protocol.startsWith('file')
                    ? `${window.location.origin}/api`
                    : 'http://localhost:5000/api'
            );
        } catch {
            return 'http://localhost:5000/api';
        }
    })(),
    SHIPPING_FREE_MIN: 5000,
    SHIPPING_FLAT: 150,
    TAX_RATE: 0.13,
    MAX_COMPARE: 4,
    MAX_RECENT: 8,
    COUPONS: {
        RNWELCOME10: { discount: 10, type: 'percent', minOrder: 0 },
        FASHION20: { discount: 20, type: 'percent', minOrder: 3000 },
        FLAT500: { discount: 500, type: 'fixed', minOrder: 4000 }
    }
};

RN.storage = (typeof safeStorage !== 'undefined' ? safeStorage : {
    getItem(k) { try { return localStorage.getItem(k); } catch { return null; } },
    setItem(k, v) { try { localStorage.setItem(k, v); } catch {} },
    removeItem(k) { try { localStorage.removeItem(k); } catch {} }
});

RN.parseJSON = (raw, fallback) => {
    if (raw === null || raw === undefined) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
};

RN.getWishlist = () => {
    const v = RN.parseJSON(RN.storage.getItem(RN.CONFIG.WISHLIST_KEY), []);
    return Array.isArray(v) ? v : [];
};
RN.saveWishlist = (items) => RN.storage.setItem(RN.CONFIG.WISHLIST_KEY, JSON.stringify(Array.isArray(items) ? items : []));

RN.getCompareList = () => {
    const v = RN.parseJSON(RN.storage.getItem(RN.CONFIG.COMPARE_KEY), []);
    return Array.isArray(v) ? v : [];
};
RN.saveCompareList = (items) => RN.storage.setItem(RN.CONFIG.COMPARE_KEY, JSON.stringify(Array.isArray(items) ? items : []));

RN.getRecentlyViewed = () => {
    const v = RN.parseJSON(RN.storage.getItem(RN.CONFIG.RECENT_KEY), []);
    return Array.isArray(v) ? v : [];
};
RN.addRecentlyViewed = (productId) => {
    if (!productId) return;
    let recent = RN.getRecentlyViewed().filter(id => id !== productId);
    recent.unshift(productId);
    recent = recent.slice(0, RN.CONFIG.MAX_RECENT);
    RN.storage.setItem(RN.CONFIG.RECENT_KEY, JSON.stringify(recent));
};

RN.trackVisitor = () => {
    try {
        const count = Number(RN.storage.getItem(RN.CONFIG.VISITORS_KEY) || 0) + 1;
        RN.storage.setItem(RN.CONFIG.VISITORS_KEY, String(count));
        return count;
    } catch {
        return 1;
    }
};

RN.getVisitorCount = () => {
    try {
        return Number(RN.storage.getItem(RN.CONFIG.VISITORS_KEY) || 1247);
    } catch {
        return 1247;
    }
};

RN.calcCartTotals = (items, couponCode) => {
    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = safeItems.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
    const shipping = subtotal >= RN.CONFIG.SHIPPING_FREE_MIN || subtotal === 0 ? 0 : RN.CONFIG.SHIPPING_FLAT;
    let discount = 0;
    const coupon = couponCode ? RN.CONFIG.COUPONS[couponCode.toUpperCase()] : null;
    if (coupon && subtotal >= coupon.minOrder) {
        discount = coupon.type === 'percent'
            ? Math.round(subtotal * coupon.discount / 100)
            : coupon.discount;
    }
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(taxable * RN.CONFIG.TAX_RATE);
    const total = Math.max(0, subtotal - discount + shipping + tax);
    return { subtotal, shipping, tax, discount, total, couponValid: !!coupon };
};

RN.escapeHtml = (str) => {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

RN.simpleHash = async (password) => {
    try {
        const enc = new TextEncoder().encode(password);
        const buf = await crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
        return String(password);
    }
};
