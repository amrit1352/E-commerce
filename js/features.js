/**
 * features.js — Wishlist, Compare, Flash Sale Countdown, Size Guide & Interactive Features
 */
window.RN = window.RN || {};

// ── Wishlist ──────────────────────────────────────────────
RN.toggleWishlist = (productId) => {
    if (!productId) return false;
    let list = Array.isArray(RN.getWishlist()) ? RN.getWishlist() : [];
    const idx = list.indexOf(productId);
    const product = (typeof getProductById === 'function') ? getProductById(productId) : null;
    let added = false;

    if (idx >= 0) {
        list.splice(idx, 1);
        added = false;
        if (RN.showToast) {
            RN.showToast({
                message: `${product ? product.name : 'Item'} removed from wishlist`,
                type: 'info'
            });
        }
    } else {
        list.push(productId);
        added = true;
        if (RN.showToast) {
            RN.showToast({
                message: `❤️ ${product ? product.name : 'Item'} saved to wishlist!`,
                type: 'success',
                actionText: 'View Wishlist',
                onAction: () => RN.openWishlistDrawer ? RN.openWishlistDrawer() : document.getElementById('wishlistSection')?.scrollIntoView({ behavior: 'smooth' })
            });
        }
    }

    RN.saveWishlist(list);
    RN.updateWishlistUI();
    RN.updateGlobalBadges();
    return added;
};

RN.isInWishlist = (productId) => {
    if (!productId) return false;
    const list = Array.isArray(RN.getWishlist()) ? RN.getWishlist() : [];
    return list.includes(productId);
};

RN.updateWishlistUI = () => {
    const list = Array.isArray(RN.getWishlist()) ? RN.getWishlist() : [];
    const count = list.length;
    document.querySelectorAll('.wishlist-count, .mobile-wishlist-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'grid' : 'none';
    });
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const id = btn.dataset.productId;
        const inWish = RN.isInWishlist(id);
        btn.classList.toggle('active', inWish);
        btn.setAttribute('aria-pressed', inWish);
        const icon = btn.querySelector('i');
        if (icon) icon.className = inWish ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    });
};

// ── Compare ──────────────────────────────────────────────
RN.toggleCompare = (productId) => {
    let list = Array.isArray(RN.getCompareList()) ? RN.getCompareList() : [];
    const idx = list.indexOf(productId);
    const product = (typeof getProductById === 'function') ? getProductById(productId) : null;

    if (idx >= 0) {
        list.splice(idx, 1);
        if (RN.showToast) RN.showToast({ message: `${product ? product.name : 'Item'} removed from comparison`, type: 'info' });
    } else {
        if (list.length >= RN.CONFIG.MAX_COMPARE) {
            if (RN.showToast) {
                RN.showToast({
                    message: `You can compare up to ${RN.CONFIG.MAX_COMPARE} products at a time.`,
                    type: 'warning'
                });
            }
            return false;
        }
        list.push(productId);
        if (RN.showToast) {
            RN.showToast({
                message: `⚖️ ${product ? product.name : 'Item'} added to comparison!`,
                type: 'success',
                actionText: 'Compare Now',
                onAction: RN.openCompareModal
            });
        }
    }
    RN.saveCompareList(list);
    RN.renderCompareBar();
    return list.includes(productId);
};

RN.renderCompareBar = () => {
    const bar = document.querySelector('.compare-bar');
    if (!bar) return;
    const ids = Array.isArray(RN.getCompareList()) ? RN.getCompareList() : [];
    if (!ids.length) {
        bar.classList.remove('visible');
        bar.innerHTML = '';
        return;
    }
    bar.classList.add('visible');
    const products = ids.map(id => typeof getProductById === 'function' ? getProductById(id) : null).filter(Boolean);
    bar.innerHTML = `
        <div class="compare-bar-inner">
            <span class="compare-bar-label"><i class="fa-solid fa-scale-balanced"></i> Compare (${products.length}/${RN.CONFIG.MAX_COMPARE})</span>
            <div class="compare-bar-items">${products.map(p =>
                `<span class="compare-chip">${RN.escapeHtml(p.name)} <button type="button" data-remove-compare="${p.id}" aria-label="Remove">&times;</button></span>`
            ).join('')}</div>
            <div style="display:flex;gap:8px;align-items:center">
                <button type="button" class="compare-open-btn"><i class="fa-solid fa-table-columns"></i> Compare Now</button>
                <button type="button" class="compare-clear-btn">Clear</button>
            </div>
        </div>`;

    bar.querySelector('.compare-clear-btn')?.addEventListener('click', () => {
        RN.saveCompareList([]);
        RN.renderCompareBar();
    });
    bar.querySelector('.compare-open-btn')?.addEventListener('click', RN.openCompareModal);
    bar.querySelectorAll('[data-remove-compare]').forEach(btn => {
        btn.addEventListener('click', () => {
            RN.toggleCompare(btn.dataset.removeCompare);
        });
    });
};

RN.openCompareModal = () => {
    const modal = document.querySelector('.compare-modal');
    if (!modal) return;
    const ids = Array.isArray(RN.getCompareList()) ? RN.getCompareList() : [];
    const products = ids.map(id => typeof getProductById === 'function' ? getProductById(id) : null).filter(Boolean);
    const body = modal.querySelector('.compare-modal-body');
    if (!body || !products.length) return;

    const rows = [
        ['Image', ...products.map(p => `<img src="${(p.images?.[0] || p.image || '').replace(/"/g, '')}" alt="${RN.escapeHtml(p.name)}" loading="lazy" class="compare-img">`)],
        ['Name', ...products.map(p => `<strong>${RN.escapeHtml(p.name)}</strong>`)],
        ['Category', ...products.map(p => (p.category || '—').toUpperCase())],
        ['Price', ...products.map(p => `<span style="font-weight:700;color:var(--color-accent)">${formatPrice(p.price)}</span>`)],
        ['Rating', ...products.map(p => `<span style="color:#f59e0b">★</span> ${p.rating?.toFixed(1) || '—'} (${p.reviewCount || 0})`)],
        ['Stock', ...products.map(p => p.stock > 0 ? `<span style="color:#27ae60">${p.stock} in stock</span>` : `<span style="color:#e74c3c">Out of stock</span>`)],
        ['Sizes', ...products.map(p => (p.sizes || []).join(', ') || '—')],
        ['Discount', ...products.map(p => p.discount ? `<span style="color:#27ae60;font-weight:700">${p.discount}% OFF</span>` : '—')],
        ['Action', ...products.map(p => `<button type="button" class="btn btn-primary" style="padding:6px 12px;font-size:0.8rem;width:100%" onclick="addProductToCart('${p.id}')">Add to Cart</button>`)]
    ];

    body.innerHTML = `
        <div style="overflow-x:auto">
            <table class="compare-table"><tbody>${rows.map(r =>
                `<tr><th>${r[0]}</th>${r.slice(1).map(c => `<td>${c}</td>`).join('')}</tr>`
            ).join('')}</tbody></table>
        </div>
    `;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
};

RN.closeCompareModal = () => {
    const modal = document.querySelector('.compare-modal');
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
};

// ── Featured Sections ──────────────────────────────────────
RN.renderFeaturedSections = () => {
    const products = (typeof getProducts === 'function') ? getProducts() : [];
    const renderGrid = (selector, filterFn) => {
        const grid = document.querySelector(selector);
        if (!grid) return;
        grid.innerHTML = '';
        products.filter(p => p && filterFn(p)).slice(0, 4).forEach((p, i) => {
            if (typeof renderProductCard === 'function') {
                grid.appendChild(renderProductCard(p, i));
            }
        });
    };
    renderGrid('#featuredGrid', p => p && (p.collection?.includes('bestsellers') || p.featured));
    renderGrid('#newArrivalsGrid', p => p && p.collection?.includes('new'));
    renderGrid('#bestSellersGrid', p => p && p.collection?.includes('bestsellers'));
};

// ── Flash Sale Countdown Timer ─────────────────────────────
RN.initFlashSaleTimer = () => {
    const banner = document.querySelector('.promo-banner p');
    if (!banner) return;

    function updateTimer() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setHours(24, 0, 0, 0);
        const diff = Math.max(0, tomorrow - now);

        const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
        const mins = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const secs = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');

        banner.innerHTML = `
            <span><i class="fa-solid fa-bolt" style="color:#f59e0b"></i> <strong>Flash Deal:</strong> Use code <button type="button" class="promo-code-btn" data-copy-coupon="RNWELCOME10" title="Click to copy">RNWELCOME10</button> for 10% OFF</span>
            <span class="promo-timer-wrap"><i class="fa-solid fa-stopwatch"></i> Ends in <span class="promo-timer-box">${hours}:${mins}:${secs}</span></span>
            <span class="promo-free-ship"><i class="fa-solid fa-truck-fast"></i> Free shipping over Rs. 5,000</span>
        `;
    }

    updateTimer();
    setInterval(updateTimer, 1000);

    // Coupon copy event
    document.querySelector('.promo-banner')?.addEventListener('click', (e) => {
        const cpnBtn = e.target.closest('[data-copy-coupon]');
        if (cpnBtn) {
            const code = cpnBtn.dataset.copyCoupon;
            navigator.clipboard?.writeText(code).then(() => {
                if (RN.showToast) {
                    RN.showToast({
                        message: `🎉 Coupon code "${code}" copied to clipboard!`,
                        type: 'success',
                        actionText: 'Apply in Cart',
                        onAction: () => {
                            const cInput = document.getElementById('couponInput');
                            if (cInput) cInput.value = code;
                            if (typeof openCart === 'function') openCart();
                        }
                    });
                }
            }).catch(() => {});
        }
    });
};

// ── Interactive Size Guide Modal ───────────────────────────
RN.initSizeGuide = () => {
    if (document.getElementById('sizeGuideModal')) return;

    const modal = document.createElement('div');
    modal.id = 'sizeGuideModal';
    modal.className = 'size-guide-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
        <div class="size-guide-inner">
            <div class="size-guide-header">
                <h2><i class="fa-solid fa-ruler-combined"></i> Size &amp; Fit Guide</h2>
                <button type="button" class="size-guide-close" aria-label="Close">&times;</button>
            </div>
            <div class="size-guide-body">
                <!-- Unit Switcher -->
                <div class="size-unit-switch">
                    <span>Unit:</span>
                    <button type="button" class="unit-btn active" data-unit="inches">Inches (in)</button>
                    <button type="button" class="unit-btn" data-unit="cm">Centimeters (cm)</button>
                </div>

                <!-- Tabs -->
                <div class="size-guide-tabs">
                    <button type="button" class="size-tab active" data-tab="men">Men's Sizing</button>
                    <button type="button" class="size-tab" data-tab="women">Women's Sizing</button>
                    <button type="button" class="size-tab" data-tab="kids">Kids' Sizing</button>
                    <button type="button" class="size-tab" data-tab="calc">✨ Fit Calculator</button>
                </div>

                <!-- Tables -->
                <div class="size-tab-content active" id="sizeTabMen">
                    <table class="size-table">
                        <thead><tr><th>Size</th><th>Chest (<span class="unit-label">in</span>)</th><th>Waist (<span class="unit-label">in</span>)</th><th>Shoulder (<span class="unit-label">in</span>)</th></tr></thead>
                        <tbody>
                            <tr><td><strong>S</strong></td><td>36 – 38</td><td>28 – 30</td><td>17.0</td></tr>
                            <tr><td><strong>M</strong></td><td>38 – 40</td><td>31 – 33</td><td>17.8</td></tr>
                            <tr><td><strong>L</strong></td><td>40 – 42</td><td>34 – 36</td><td>18.5</td></tr>
                            <tr><td><strong>XL</strong></td><td>42 – 44</td><td>37 – 39</td><td>19.2</td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="size-tab-content" id="sizeTabWomen">
                    <table class="size-table">
                        <thead><tr><th>Size</th><th>Bust (<span class="unit-label">in</span>)</th><th>Waist (<span class="unit-label">in</span>)</th><th>Hip (<span class="unit-label">in</span>)</th></tr></thead>
                        <tbody>
                            <tr><td><strong>XS</strong></td><td>32 – 33</td><td>24 – 25</td><td>34 – 35</td></tr>
                            <tr><td><strong>S</strong></td><td>34 – 35</td><td>26 – 27</td><td>36 – 37</td></tr>
                            <tr><td><strong>M</strong></td><td>36 – 37</td><td>28 – 29</td><td>38 – 39</td></tr>
                            <tr><td><strong>L</strong></td><td>38 – 40</td><td>30 – 32</td><td>40 – 42</td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="size-tab-content" id="sizeTabKids">
                    <table class="size-table">
                        <thead><tr><th>Size</th><th>Age</th><th>Height (<span class="unit-label">in</span>)</th><th>Weight (kg)</th></tr></thead>
                        <tbody>
                            <tr><td><strong>XS</strong></td><td>3 – 4 yrs</td><td>38 – 41</td><td>14 – 17 kg</td></tr>
                            <tr><td><strong>S</strong></td><td>5 – 6 yrs</td><td>42 – 45</td><td>18 – 22 kg</td></tr>
                            <tr><td><strong>M</strong></td><td>7 – 8 yrs</td><td>46 – 50</td><td>23 – 28 kg</td></tr>
                            <tr><td><strong>L</strong></td><td>9 – 10 yrs</td><td>51 – 54</td><td>29 – 35 kg</td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- Fit Calculator -->
                <div class="size-tab-content" id="sizeTabCalc">
                    <div class="fit-calc-box">
                        <p style="font-size:0.88rem;margin-bottom:14px;color:var(--color-muted)">Enter your measurements to get your recommended size:</p>
                        <div class="fit-calc-grid">
                            <div class="auth-field">
                                <label for="calcChest">Chest/Bust (<span class="unit-label">in</span>)</label>
                                <input id="calcChest" type="number" step="0.5" placeholder="e.g. 38">
                            </div>
                            <div class="auth-field">
                                <label for="calcWaist">Waist (<span class="unit-label">in</span>)</label>
                                <input id="calcWaist" type="number" step="0.5" placeholder="e.g. 32">
                            </div>
                        </div>
                        <button type="button" class="btn btn-primary" id="calcFitBtn" style="margin-top:12px;width:100%">Calculate Recommended Size</button>
                        <div class="fit-result is-hidden" id="fitResult"></div>
                    </div>
                </div>

                <div class="size-guide-tip">
                    <i class="fa-solid fa-lightbulb" style="color:var(--color-accent)"></i>
                    <span><strong>Fit Tip:</strong> If you are between two sizes, we recommend sizing up for a relaxed fit or sizing down for a tailored slim fit.</span>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    let currentUnit = 'inches';
    const cmMultiplier = 2.54;

    modal.querySelectorAll('.unit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentUnit = btn.dataset.unit;
            modal.querySelectorAll('.unit-label').forEach(el => el.textContent = currentUnit === 'cm' ? 'cm' : 'in');
        });
    });

    modal.querySelectorAll('.size-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            modal.querySelectorAll('.size-tab').forEach(t => t.classList.remove('active'));
            modal.querySelectorAll('.size-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const targetId = 'sizeTab' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
            document.getElementById(targetId)?.classList.add('active');
        });
    });

    document.getElementById('calcFitBtn')?.addEventListener('click', () => {
        const chest = parseFloat(document.getElementById('calcChest')?.value);
        const waist = parseFloat(document.getElementById('calcWaist')?.value);
        const resEl = document.getElementById('fitResult');
        if (!resEl) return;

        if (isNaN(chest) && isNaN(waist)) {
            resEl.className = 'fit-result error';
            resEl.textContent = 'Please enter at least your Chest or Waist measurement.';
            resEl.classList.remove('is-hidden');
            return;
        }

        const cInches = currentUnit === 'cm' ? (chest / cmMultiplier) : chest;
        let size = 'M';
        if (cInches < 37) size = 'S';
        else if (cInches <= 39) size = 'M';
        else if (cInches <= 42) size = 'L';
        else size = 'XL';

        resEl.className = 'fit-result success';
        resEl.innerHTML = `✨ Your recommended fit is <strong>Size ${size}</strong>.`;
        resEl.classList.remove('is-hidden');
    });

    modal.querySelector('.size-guide-close')?.addEventListener('click', RN.closeSizeGuide);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) RN.closeSizeGuide();
    });
};

RN.openSizeGuide = () => {
    RN.initSizeGuide();
    const modal = document.getElementById('sizeGuideModal');
    modal?.classList.add('open');
    modal?.setAttribute('aria-hidden', 'false');
};

RN.closeSizeGuide = () => {
    const modal = document.getElementById('sizeGuideModal');
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
};

// ── Share Product ──────────────────────────────────────────
RN.shareProduct = (product) => {
    if (!product) return;
    const url = window.location.origin + window.location.pathname + `?product=${product.id}`;
    const text = `Check out ${product.name} at R.N Readymade for only ${formatPrice(product.price)}!`;

    if (navigator.share) {
        navigator.share({ title: product.name, text, url }).catch(() => {});
    } else {
        navigator.clipboard?.writeText(`${text} ${url}`).then(() => {
            if (RN.showToast) RN.showToast({ message: '🔗 Product link copied to clipboard!', type: 'success' });
        }).catch(() => {});
    }
};

// ── Recently Viewed Outfits ───────────────────────────────
const RECENTLY_VIEWED_KEY = 'rn_recently_viewed';

RN.recordRecentlyViewed = (productId) => {
    if (!productId) return;
    let list = Array.isArray(RN.getRecentlyViewed()) ? RN.getRecentlyViewed() : [];
    list = list.filter(id => id !== productId);
    list.unshift(productId);
    if (list.length > 8) list = list.slice(0, 8);
    RN.storage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list));
    RN.renderRecentlyViewed();
};

RN.renderRecentlyViewed = () => {
    const container = document.getElementById('recentlyViewedGrid');
    const section = document.getElementById('recentlyViewedSection');
    if (!container) return;

    const ids = Array.isArray(RN.getRecentlyViewed()) ? RN.getRecentlyViewed() : [];
    if (!ids.length) {
        if (section) section.style.display = 'none';
        return;
    }

    if (section) section.style.display = 'block';

    const products = ids
        .map(id => typeof getProductById === 'function' ? getProductById(id) : null)
        .filter(Boolean);

    container.innerHTML = products.map(p => {
        const imgSrc = (p.images && p.images[0]) || p.image || '';
        const fmtPrice = typeof formatPrice === 'function' ? formatPrice(p.price) : `Rs. ${p.price}`;
        return `
            <div class="recent-card" onclick="if (typeof openProductDetail === 'function') { openProductDetail('${p.id}'); } else if (typeof openProductModal === 'function') { openProductModal('${p.id}'); }">
                <div class="recent-img-wrap">
                    <img src="${RN.escapeHtml(imgSrc)}" alt="${RN.escapeHtml(p.name)}" loading="lazy">
                    <button class="recent-quick-btn" title="Quick view"><i class="fa-solid fa-eye"></i></button>
                </div>
                <div class="recent-info">
                    <h5 class="recent-title">${RN.escapeHtml(p.name)}</h5>
                    <span class="recent-price">${fmtPrice}</span>
                </div>
            </div>
        `;
    }).join('');
};

// ── Story Highlights / Flash Drops ─────────────────────────
RN.filterByStory = (category, tag) => {
    if (RN.showToast) {
        RN.showToast({
            message: `✨ Viewing ${tag || category} collection!`,
            type: 'info'
        });
    }
    const filterInput = document.querySelector('.search-input');
    if (filterInput) {
        filterInput.value = category === 'all' ? '' : category;
        if (typeof applySearchFilter === 'function') applySearchFilter(filterInput.value);
        filterInput.dispatchEvent(new Event('input'));
    }
    const targetSection = document.querySelector('.featured-section') || document.querySelector('.products-section');
    targetSection?.scrollIntoView({ behavior: 'smooth' });
};

// ── Update Global Badges (Orders, Wishlist) ────────────────
RN.updateGlobalBadges = () => {
    // Wishlist
    const wishCount = Array.isArray(RN.getWishlist()) ? RN.getWishlist().length : 0;
    document.querySelectorAll('.wishlist-count, .mobile-wishlist-count').forEach(el => {
        el.textContent = wishCount;
        el.style.display = wishCount > 0 ? 'grid' : 'none';
    });

    // Orders
    const allOrders = typeof getOrders === 'function' ? getOrders() : [];
    const activeOrders = Array.isArray(allOrders) ? allOrders.filter(o => o && ['pending', 'processing', 'packed', 'shipped', 'out-for-delivery'].includes(o.status)) : [];
    document.querySelectorAll('.orders-count, .mobile-orders-count').forEach(el => {
        el.textContent = activeOrders.length || (allOrders ? allOrders.length : 0);
        el.style.display = (allOrders && allOrders.length > 0) ? 'grid' : 'none';
    });
};

// ── Initialise All Features ────────────────────────────────
RN.initFeatures = () => {
    RN.updateWishlistUI();
    RN.updateGlobalBadges();
    RN.renderCompareBar();
    RN.renderFeaturedSections();
    RN.initFlashSaleTimer();
    RN.initSizeGuide();
    RN.renderRecentlyViewed();

    document.querySelector('.compare-modal-close')?.addEventListener('click', RN.closeCompareModal);
    document.querySelector('.compare-modal')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('compare-modal')) RN.closeCompareModal();
    });
};
