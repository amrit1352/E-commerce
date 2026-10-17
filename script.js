const storage = (typeof safeStorage !== 'undefined' ? safeStorage : {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch {
            // Ignore storage errors.
        }
    },
    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch {
            // Ignore storage errors.
        }
    }
});

// --- Product Database Rendering ---
let productCards = [];
const productGrids = document.querySelectorAll('.product-grid');
const productsSection = document.querySelector('.products');
const CART_KEY = 'rn_cart';
let activeCoupon = null; // currently applied coupon code for cart sidebar

function getStoredCart() {
    try { return JSON.parse(storage.getItem(CART_KEY) || '[]'); } catch { return []; }
}

function saveCartItems(items) {
    storage.setItem(CART_KEY, JSON.stringify(items));
}

const GRID_MAP = {
    men: document.getElementById('menGrid'),
    women: document.getElementById('womenGrid'),
    children: document.getElementById('childrenGrid')
};

function renderProductCard(product, index) {
    const outOfStock = product.stock <= 0;
    const lowStock = product.stock > 0 && product.stock <= 5;
    const card = document.createElement('div');
    card.className = 'product-card' + (outOfStock ? ' out-of-stock' : '');
    card.dataset.id = product.id;
    card.dataset.collection = (product.collection || []).join(',');
    card.dataset.category = product.category || '';
    card.dataset.sizes = (product.sizes || []).join(',');
    card.dataset.colors = (product.colors || []).map(c => c.name).join(',');
    card.dataset.brand = product.brand || '';
    card.dataset.sold = String(product.soldThisMonth || 0);
    card.dataset.rating = String(product.rating || 0);
    card.dataset.createdAt = product.createdAt || '';
    card.dataset.originalIndex = String(index);

    const stockLabel = outOfStock
        ? '<span class="stock-tag out">Out of Stock</span>'
        : lowStock
            ? `<span class="stock-tag low">${product.stock} left</span>`
            : `<span class="stock-tag ok">${product.stock} in stock</span>`;

    const displayImage = (product.images && product.images.length > 0) ? product.images[0] : product.image;
    const imgStyle = displayImage && !displayImage.startsWith('images/')
        ? `background-image: url('${displayImage}');`
        : '';

    const imgContent = displayImage && displayImage.startsWith('images/')
        ? `<img src="${displayImage}" alt="${product.name}">`
        : '';

    const oldPrice = product.discount ? formatPrice(Math.round(product.price / (1 - product.discount / 100))) : '';
    const oldPriceHtml = product.discount ? `<span class="old-price">${oldPrice}</span>` : '';
    const ratingText = product.rating ? `${product.rating.toFixed(1)} ★` : '';
    const isNew = product.collection?.includes('new');

    const inWish = typeof RN !== 'undefined' && typeof RN.isInWishlist === 'function' ? RN.isInWishlist(product.id) : false;
    const inComp = typeof RN !== 'undefined' && typeof RN.getCompareList === 'function' && product.id ? RN.getCompareList().includes(product.id) : false;

    card.innerHTML = `
        <div class="product-img" style="${imgStyle}">
            ${imgContent}
            <div class="product-card-top-actions">
                <button type="button" class="icon-btn wishlist-btn ${inWish ? 'active' : ''}" data-product-id="${product.id}" aria-label="Add to Wishlist" title="Wishlist">
                    <i class="${inWish ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
                <button type="button" class="icon-btn compare-btn ${inComp ? 'active' : ''}" data-product-id="${product.id}" aria-label="Compare Product" title="Compare">
                    <i class="fa-solid fa-code-compare"></i>
                </button>
            </div>
        </div>
        <div class="product-info">
            <div class="product-badges">
                ${isNew ? '<span class="product-badge new">New</span>' : ''}
                ${product.discount ? `<span class="product-badge sale">${product.discount}% Off</span>` : ''}
                ${ratingText ? `<span class="product-badge rating">${ratingText}</span>` : ''}
            </div>
            <h3 class="product-name">${product.name}</h3>
            ${stockLabel}
            <p class="price" data-price="${product.price}">${formatPrice(product.price)} ${oldPriceHtml}</p>
            <p class="product-subtitle">Sizes: ${product.sizes?.join(', ') || 'Varied'}</p>
            <div class="product-card-actions">
                <button type="button" class="view-details" data-product-id="${product.id}">View Details</button>
                <button type="button" class="add-to-cart" data-product-id="${product.id}" ${outOfStock ? 'disabled' : ''}>${outOfStock ? 'Out of Stock' : 'Add to Cart'}</button>
            </div>
        </div>
    `;

    return card;
}

function addProductToCart(productId, qty = 1, size = null, color = null) {
    const product = getProductById(productId);
    if (!product || product.stock <= 0) {
        if (typeof RN !== 'undefined' && RN.showToast) {
            RN.showToast({ message: 'Sorry, this item is currently out of stock.', type: 'warning' });
        }
        return;
    }

    const itemQty = Math.max(1, parseInt(qty, 10) || 1);
    const itemSize = size || (product.sizes?.[0] || '');
    const itemColor = color ? (typeof color === 'object' ? color.name : color) : (product.colors?.[0]?.name || '');

    // Check if same item with same size/color is already in cart
    const existing = cartItems.find(item => item.id === productId && item.size === itemSize && item.color === itemColor);
    if (existing) {
        if (existing.qty + itemQty > product.stock) {
            if (typeof RN !== 'undefined' && RN.showToast) {
                RN.showToast({ message: `Only ${product.stock} items available in stock.`, type: 'warning' });
            }
            return;
        }
        existing.qty += itemQty;
    } else {
        cartItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            qty: itemQty,
            size: itemSize,
            color: itemColor,
            image: product.images?.[0] || product.image || ''
        });
    }

    saveCartItems(cartItems);
    renderCart();
    openCart();

    if (typeof RN !== 'undefined' && RN.showToast) {
        RN.showToast({
            message: `🛍️ ${product.name} (${itemQty}x${itemSize ? `, Size ${itemSize}` : ''}) added to cart!`,
            type: 'success',
            actionText: 'Checkout',
            onAction: () => { window.location.href = 'checkout.html'; }
        });
    }
}

function renderAllProducts() {
    try {
        const products = (typeof getProducts === 'function') ? getProducts() : [];
        const grids = {
            men: document.getElementById('menGrid'),
            women: document.getElementById('womenGrid'),
            children: document.getElementById('childrenGrid')
        };
        Object.values(grids).forEach(grid => { if (grid) grid.innerHTML = ''; });

        const byCategory = { men: [], women: [], children: [] };
        products.forEach(p => {
            if (p && p.category && byCategory[p.category]) byCategory[p.category].push(p);
        });

        Object.keys(byCategory).forEach(cat => {
            const grid = grids[cat];
            if (!grid) return;
            byCategory[cat].forEach((p, i) => grid.appendChild(renderProductCard(p, i)));
        });

        productCards = document.querySelectorAll('.product-card');
        if (typeof applyProductFilters === 'function') applyProductFilters();
    } catch (err) {
        console.error('renderAllProducts error:', err);
    }
}
window.renderAllProducts = renderAllProducts;
window.renderProductCard = renderProductCard;


// --- Cart ---
let cartItems = getStoredCart();
const badge = document.querySelector('.badge');
const cartSidebar = document.querySelector('.cart-sidebar');
const cartBackdrop = document.querySelector('.cart-backdrop');
const cartIcon = document.querySelector('.cart-icon');
const cartCloseBtn = document.querySelector('.cart-close');
const cartItemsList = document.querySelector('.cart-items');
const cartTotalAmount = document.querySelector('.cart-total-amount');
const cartEmptyMessage = document.querySelector('.cart-empty');
const cartClearBtn = document.querySelector('.cart-clear-btn');
const cartCheckoutBtn = document.querySelector('.cart-checkout-btn');

function updateCartBadge() {
    const count = cartItems.reduce((sum, item) => sum + item.qty, 0);
    if (badge) {
        badge.innerText = count;
        badge.style.transform = 'scale(1.2)';
        setTimeout(() => { badge.style.transform = 'scale(1)'; }, 200);
    }
}

function getCartTotal() {
    return cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function renderCart() {
    if (!cartItemsList || !cartTotalAmount || !cartEmptyMessage) return;
    cartItemsList.innerHTML = '';

    // Elements for breakdown
    const subtotalEl = document.querySelector('.cart-subtotal');
    const discountEl = document.querySelector('.cart-discount');
    const shippingEl = document.querySelector('.cart-shipping');
    const taxEl = document.querySelector('.cart-tax');
    const totalEl = document.querySelector('.cart-total-amount');
    const couponMsgEl = document.querySelector('.coupon-msg');

    if (cartItems.length === 0) {
        cartEmptyMessage.style.display = 'block';
        // show zeros
        if (subtotalEl) subtotalEl.textContent = formatPrice(0);
        if (discountEl) discountEl.textContent = formatPrice(0);
        if (shippingEl) shippingEl.textContent = formatPrice(0);
        if (taxEl) taxEl.textContent = formatPrice(0);
        if (totalEl) totalEl.textContent = formatPrice(0);
        if (couponMsgEl) { couponMsgEl.textContent = ''; couponMsgEl.className = 'coupon-msg'; }
        updateCartBadge();
        return;
    }

    cartEmptyMessage.style.display = 'none';

    cartItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.classList.add('cart-item');
        li.innerHTML = `
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-meta">${formatPrice(item.price)} x ${item.qty}</div>
            </div>
            <div class="cart-item-actions">
                <div class="cart-qty-controls">
                    <button type="button" class="cart-qty-btn" data-action="minus" data-index="${index}">-</button>
                    <span>${item.qty}</span>
                    <button type="button" class="cart-qty-btn" data-action="plus" data-index="${index}">+</button>
                </div>
                <button type="button" class="cart-remove-btn" data-action="remove" data-index="${index}">Remove</button>
            </div>
        `;
        cartItemsList.appendChild(li);
    });

    // Calculate totals (supports coupon via RN.calcCartTotals)
    const totals = (typeof RN !== 'undefined' && typeof RN.calcCartTotals === 'function')
        ? RN.calcCartTotals(cartItems, activeCoupon)
        : { subtotal: getCartTotal(), shipping: 0, tax: 0, discount: 0, total: getCartTotal(), couponValid: false };

    if (subtotalEl) subtotalEl.textContent = formatPrice(totals.subtotal);
    if (discountEl) discountEl.textContent = formatPrice(totals.discount);
    if (shippingEl) shippingEl.textContent = totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping);
    if (taxEl) taxEl.textContent = formatPrice(totals.tax);
    if (totalEl) totalEl.textContent = formatPrice(totals.total);
    if (couponMsgEl) {
        couponMsgEl.textContent = totals.couponValid && activeCoupon ? `Coupon ${activeCoupon.toUpperCase()} applied.` : (activeCoupon ? 'Invalid or ineligible coupon.' : '');
        couponMsgEl.className = 'coupon-msg ' + (totals.couponValid && activeCoupon ? 'success' : (activeCoupon ? 'error' : ''));
    }

    updateCartBadge();
}

productsSection?.addEventListener('click', (e) => {
    const detailsBtn = e.target.closest('.view-details');
    if (detailsBtn) {
        openProductDetail(detailsBtn.dataset.productId);
        return;
    }

    const btn = e.target.closest('.add-to-cart');
    if (!btn || btn.disabled) return;
    addProductToCart(btn.dataset.productId);
});

cartItemsList?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const index = parseInt(btn.dataset.index, 10);
    const action = btn.dataset.action;
    if (Number.isNaN(index) || index < 0 || index >= cartItems.length) return;

    if (action === 'minus') changeItemQty(index, cartItems[index].qty - 1);
    if (action === 'plus') {
        const product = getProductById(cartItems[index].id);
        if (product && cartItems[index].qty >= product.stock) {
            alert(`Only ${product.stock} available in stock.`);
            return;
        }
        changeItemQty(index, cartItems[index].qty + 1);
    }
    if (action === 'remove') removeItem(index);
});

function changeItemQty(index, newQty) {
    if (newQty <= 0) cartItems.splice(index, 1);
    else cartItems[index].qty = newQty;
    saveCartItems(cartItems);
    renderCart();
}

function removeItem(index) {
    cartItems.splice(index, 1);
    saveCartItems(cartItems);
    renderCart();
}

function openCart() {
    cartSidebar?.classList.add('open');
    cartBackdrop?.classList.add('visible');
}

function closeCart() {
    cartSidebar?.classList.remove('open');
    cartBackdrop?.classList.remove('visible');
}

cartIcon?.addEventListener('click', () => {
    if (!cartSidebar) return;
    cartSidebar.classList.contains('open') ? closeCart() : openCart();
});
cartCloseBtn?.addEventListener('click', closeCart);
cartBackdrop?.addEventListener('click', closeCart);

cartClearBtn?.addEventListener('click', () => {
    cartItems = [];
    activeCoupon = null;
    document.getElementById('couponInput') && (document.getElementById('couponInput').value = '');
    saveCartItems(cartItems);
    renderCart();
});

// Coupon apply
const applyCouponBtnEl = document.getElementById('applyCouponBtn');
applyCouponBtnEl?.addEventListener('click', () => {
    const code = (document.getElementById('couponInput')?.value || '').trim();
    if (!code) {
        const msg = document.querySelector('.coupon-msg');
        if (msg) { msg.textContent = 'Please enter a coupon code.'; msg.className = 'coupon-msg error'; }
        return;
    }
    // Validate quickly using RN.calcCartTotals
    const totals = (typeof RN !== 'undefined' && typeof RN.calcCartTotals === 'function') ? RN.calcCartTotals(cartItems, code) : null;
    if (totals && totals.couponValid) {
        activeCoupon = code;
    } else {
        activeCoupon = code; // still set to show invalid message
    }
    renderCart();
});

// --- Payment Gateway ---
const paymentModal = document.querySelector('.payment-modal');
const paymentCloseBtn = document.querySelector('.payment-close-btn');
const paymentForm = document.getElementById('paymentForm');
const paymentTotalEl = document.querySelector('.payment-total');
const paymentItemsEl = document.querySelector('.payment-items');
const paymentQrImage = document.querySelector('.payment-qr');
const paymentMsg = document.querySelector('.payment-msg');
const userOrdersSection = document.getElementById('userOrdersSection');
const userOrdersList = document.getElementById('userOrdersList');

const productDetailModal = document.querySelector('.product-detail-modal');
const detailCloseBtn = document.querySelector('.detail-close-btn');
const detailName = document.querySelector('.detail-name');
const detailRating = document.querySelector('.detail-rating');
const detailReviewCount = document.querySelector('.detail-review-count');
const detailSoldMonth = document.querySelector('.detail-sold-month');
const detailPrice = document.querySelector('.detail-price');
const detailDiscount = document.querySelector('.detail-discount');
const detailDescription = document.querySelector('.detail-description');
const detailTags = document.querySelector('.detail-tags');
const detailMainImage = document.querySelector('.detail-main-image img');
const detailThumbs = document.querySelector('.detail-thumbs');
const detailColorList = document.querySelector('.detail-color-list');
const detailSizeList = document.querySelector('.detail-size-list');
const detailAddToCartBtn = document.querySelector('.detail-add-to-cart');
const reviewList = document.querySelector('.review-list');

let selectedProduct = null;
let selectedColor = null;
let selectedSize = null;

function renderProductDetail(product) {
    if (!product) return;

    selectedColor = product.colors?.[0] || null;
    selectedSize = product.sizes?.[0] || null;

    detailName.textContent = product.name;
    detailRating.textContent = `${product.rating?.toFixed(1) || '0.0'} ★`;
    detailReviewCount.textContent = `${product.reviewCount || 0} reviews`;
    detailSoldMonth.textContent = `${product.soldThisMonth || 0} sold this month`;
    detailPrice.textContent = formatPrice(product.price);
    detailDiscount.textContent = product.discount ? `${product.discount}% off` : '';
    detailDiscount.style.display = product.discount ? 'inline-flex' : 'none';
    detailDescription.textContent = product.description || 'No additional details available.';

    // Stock tag
    const stockEl = document.querySelector('.detail-stock-status');
    if (stockEl) {
        if (product.stock <= 0) {
            stockEl.innerHTML = '<span class="stock-tag out">Out of Stock</span>';
        } else if (product.stock <= 5) {
            stockEl.innerHTML = `<span class="stock-tag low"><i class="fa-solid fa-fire"></i> Only ${product.stock} left in stock</span>`;
        } else {
            stockEl.innerHTML = `<span class="stock-tag ok"><i class="fa-solid fa-circle-check"></i> ${product.stock} in stock (Ready to Ship)</span>`;
        }
    }

    // Reset qty
    const qtyInput = document.getElementById('detailQtyInput');
    if (qtyInput) qtyInput.value = '1';

    const tags = [
        ...(product.collection || []).map(tag => tag.charAt(0).toUpperCase() + tag.slice(1)),
        product.stock <= 0 ? 'Out of Stock' : `${product.stock} in stock`,
        `${product.sizes?.length ? product.sizes.length : 'Varied'} sizes`
    ];
    detailTags.innerHTML = tags.map(tag => `<span class="detail-tag">${tag}</span>`).join('');

    const primaryImage = product.images?.[0] || product.image || '';
    detailMainImage.src = primaryImage;
    detailMainImage.alt = product.name;
    detailThumbs.innerHTML = (product.images || [product.image || ''])
        .filter(Boolean)
        .map((src, index) => `
            <button type="button" class="detail-thumb${index === 0 ? ' selected' : ''}" data-index="${index}">
                <img src="${src}" alt="${product.name} image ${index + 1}">
            </button>
        `)
        .join('');

    detailColorList.innerHTML = (product.colors || []).map((color, index) => `
        <button type="button" class="color-swatch${index === 0 ? ' selected' : ''}" data-index="${index}" title="${color.name}" style="background:${color.hex};"></button>
    `).join('');

    detailSizeList.innerHTML = (product.sizes || []).map((size, index) => `
        <button type="button" class="size-pill${index === 0 ? ' selected' : ''}" data-size="${size}">${size}</button>
    `).join('');

    // Render review rating breakdown & review cards
    renderReviews(product);
}

function renderReviews(product) {
    if (!product) return;
    const summaryEl = document.getElementById('reviewsRatingSummary');
    const reviews = product.reviews || [];
    const avgRating = product.rating || 4.5;

    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="rating-big-num">${avgRating.toFixed(1)}</div>
            <div class="rating-stars-wrap">
                <div class="rating-stars">${renderProductIconStars(avgRating)}</div>
                <div class="rating-count-sub">Based on ${reviews.length || product.reviewCount || 1} verified ratings</div>
            </div>
        `;
    }

    reviewList.innerHTML = reviews.length > 0
        ? reviews.map(review => `
            <li>
                <div class="review-author">
                    <span><strong>${RN.escapeHtml ? RN.escapeHtml(review.name) : review.name}</strong> <span class="verified-badge"><i class="fa-solid fa-certificate"></i> Verified Buyer</span></span>
                    <span style="color:#f59e0b;font-weight:700">${review.rating} ★</span>
                </div>
                <p class="review-comment">${RN.escapeHtml ? RN.escapeHtml(review.comment) : review.comment}</p>
            </li>
        `).join('')
        : '<li><p class="review-comment">No customer reviews yet. Be the first to share your thoughts!</p></li>';
}

function openProductDetail(productId) {
    const product = getProductById(productId);
    if (!product) return;
    selectedProduct = product;
    // Track recently viewed
    try { RN.addRecentlyViewed(productId); } catch (e) { /* ignore if RN not available */ }
    renderProductDetail(product);
    productDetailModal?.classList.add('open');
    productDetailModal?.setAttribute('aria-hidden', 'false');
    // Refresh featured/recent sections to show recently viewed
    try { if (RN.renderFeaturedSections) RN.renderFeaturedSections(); } catch (e) { /* no-op */ }
}

function closeProductDetail() {
    productDetailModal?.classList.remove('open');
    productDetailModal?.setAttribute('aria-hidden', 'true');
}

window.openProductDetail = openProductDetail;
window.openProductModal = openProductDetail;
window.closeProductDetail = closeProductDetail;
window.addProductToCart = addProductToCart;
window.openCart = openCart;
window.closeCart = closeCart;

function changeProductImage(index) {
    if (!selectedProduct || !selectedProduct.images?.[index]) return;
    detailMainImage.src = selectedProduct.images[index];
    detailThumbs.querySelectorAll('.detail-thumb').forEach((btn, idx) => {
        btn.classList.toggle('selected', idx === index);
    });
}

function selectProductColor(index) {
    if (!selectedProduct || !selectedProduct.colors?.[index]) return;
    selectedColor = selectedProduct.colors[index];
    detailColorList.querySelectorAll('.color-swatch').forEach((btn, idx) => {
        btn.classList.toggle('selected', idx === index);
    });
}

function selectProductSize(size) {
    selectedSize = size;
    detailSizeList.querySelectorAll('.size-pill').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.size === size);
    });
}

function renderProductIconStars(rating) {
    const fullStars = Math.floor(rating);
    const emptyStars = Math.max(0, 5 - fullStars);
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
}

// Quantity plus / minus in Product Detail modal
document.getElementById('detailQtyMinus')?.addEventListener('click', () => {
    const input = document.getElementById('detailQtyInput');
    if (input) input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
});

document.getElementById('detailQtyPlus')?.addEventListener('click', () => {
    const input = document.getElementById('detailQtyInput');
    if (input && selectedProduct) {
        const cur = parseInt(input.value, 10) || 1;
        if (cur >= selectedProduct.stock) {
            if (RN.showToast) RN.showToast({ message: `Only ${selectedProduct.stock} items available in stock.`, type: 'warning' });
            return;
        }
        input.value = cur + 1;
    }
});

// Size Guide trigger in detail modal
document.getElementById('openSizeGuideBtn')?.addEventListener('click', () => {
    if (typeof RN !== 'undefined' && RN.openSizeGuide) RN.openSizeGuide();
});

// Buy Now button (adds to cart and goes directly to checkout)
document.getElementById('detailBuyNowBtn')?.addEventListener('click', () => {
    if (!selectedProduct) return;
    const qty = parseInt(document.getElementById('detailQtyInput')?.value, 10) || 1;
    addProductToCart(selectedProduct.id, qty, selectedSize, selectedColor);
    window.location.href = 'checkout.html';
});

// Share Product button
document.getElementById('detailShareBtn')?.addEventListener('click', () => {
    if (selectedProduct && typeof RN !== 'undefined' && RN.shareProduct) {
        RN.shareProduct(selectedProduct);
    }
});

// Check Delivery Estimator Widget
document.getElementById('checkDeliveryBtn')?.addEventListener('click', () => {
    const cityInput = document.getElementById('deliveryCityInput')?.value.trim().toLowerCase();
    const resEl = document.getElementById('deliveryCheckResult');
    if (!resEl) return;

    if (!cityInput) {
        resEl.innerHTML = '<span style="color:#e74c3c">Please enter a city or district name.</span>';
        return;
    }

    if (cityInput.includes('birgunj') || cityInput.includes('parsa')) {
        resEl.innerHTML = `
            <i class="fa-solid fa-truck-bolt" style="color:#27ae60"></i>
            <span><strong>Birgunj / Parsa:</strong> ⚡ Express Same-Day / 24-Hr Delivery · <strong>Free</strong> for orders over Rs. 5,000</span>
        `;
    } else {
        resEl.innerHTML = `
            <i class="fa-solid fa-truck" style="color:var(--color-accent)"></i>
            <span><strong>${cityInput.charAt(0).toUpperCase() + cityInput.slice(1)}:</strong> 2–4 Business Days across Nepal · Flat shipping Rs. 150 (Free over Rs. 5,000)</span>
        `;
    }
});

// Write a Review form submission
const reviewFormEl = document.getElementById('reviewForm');
reviewFormEl?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const name = document.getElementById('reviewName')?.value.trim();
    const rating = parseInt(document.getElementById('reviewRating')?.value, 10) || 5;
    const comment = document.getElementById('reviewComment')?.value.trim();

    if (!name || !comment) {
        if (RN.showToast) RN.showToast({ message: 'Please fill in your name and comment.', type: 'warning' });
        return;
    }

    // Add review to product
    selectedProduct.reviews = selectedProduct.reviews || [];
    selectedProduct.reviews.unshift({ name, rating, comment, date: new Date().toISOString() });

    // Recalculate average rating
    const totalStars = selectedProduct.reviews.reduce((s, r) => s + r.rating, 0);
    selectedProduct.rating = Math.round((totalStars / selectedProduct.reviews.length) * 10) / 10;
    selectedProduct.reviewCount = selectedProduct.reviews.length;

    // Save in storage
    if (typeof updateProduct === 'function') {
        updateProduct(selectedProduct.id, {
            reviews: selectedProduct.reviews,
            rating: selectedProduct.rating,
            reviewCount: selectedProduct.reviewCount
        });
    }

    // Update modal view
    renderProductDetail(selectedProduct);
    renderAllProducts();
    reviewFormEl.reset();

    if (typeof RN !== 'undefined' && RN.showToast) {
        RN.showToast({
            message: `🌟 Thank you, ${name}! Your review has been published.`,
            type: 'success'
        });
    }
});

function openPaymentModal() {
    const user = getCurrentUser();
    if (!user) {
        if (RN.showToast) RN.showToast({ message: 'Please sign in or create an account first.', type: 'info' });
        openAuthModal('login');
        return;
    }

    const totalAmount = getCartTotal();
    paymentTotalEl.textContent = formatPrice(totalAmount);
    paymentItemsEl.innerHTML = cartItems.map(i =>
        `<li>${i.name} x ${i.qty} — ${formatPrice(i.price * i.qty)}</li>`
    ).join('');

    const qrPayload = `eSewa Payment\nAmount: Rs. ${totalAmount.toFixed(2)}\nOrder Total: Rs. ${totalAmount.toFixed(2)}`;
    paymentQrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}`;
    paymentQrImage.alt = `QR code for Rs. ${totalAmount.toFixed(2)} payment`;

    document.getElementById('payerName').value = user.name || '';
    document.getElementById('payerPhone').value = user.phone || '';

    paymentModal.classList.add('open');
    paymentModal.setAttribute('aria-hidden', 'false');
    closeCart();
}

function closePaymentModal() {
    paymentModal.classList.remove('open');
    paymentModal.setAttribute('aria-hidden', 'true');
    paymentForm.reset();
    paymentMsg.textContent = '';
}

function renderUserOrders() {
    if (!userOrdersSection || !userOrdersList) return;
    const user = getCurrentUser();
    if (!user) {
        userOrdersSection.style.display = 'none';
        userOrdersList.innerHTML = '';
        return;
    }

    userOrdersSection.style.display = 'block';
    const orders = getOrders().filter(order => !order.userEmail || order.userEmail === user.email);

    if (!orders.length) {
        userOrdersList.innerHTML = '<div class="order-tracking-empty">No orders yet. Checkout from your cart to see your delivery progress here.</div>';
        return;
    }

    userOrdersList.innerHTML = orders.slice(0, 5).map(order => {
        const address = [order.address, order.city, order.state, order.zipCode, order.landmark].filter(Boolean).join(', ');
        return `
            <article class="order-track-card">
                <div class="order-track-top">
                    <div>
                        <h3>${order.orderId}</h3>
                        <p>${new Date(order.date).toLocaleString()}</p>
                    </div>
                    <span class="order-status-pill">${getOrderStatusLabel(order.status)}</span>
                </div>
                <div class="order-track-details">
                    <p><strong>Items:</strong> ${order.items?.map(item => `${item.name} x ${item.qty}`).join(', ') || '—'}</p>
                    <p><strong>Delivery:</strong> ${address || 'Address not provided'}</p>
                    <p><strong>Total:</strong> ${formatPrice(order.total)}</p>
                </div>
            </article>
        `;
    }).join('');
}

cartCheckoutBtn?.addEventListener('click', () => {
    const user = getCurrentUser();
    if (!user) {
        if (RN.showToast) RN.showToast({ message: 'Please sign in or sign up before checkout.', type: 'info' });
        openAuthModal('login');
        return;
    }

    if (cartItems.length === 0) {
        if (RN.showToast) RN.showToast({ message: 'Your cart is empty. Add items to checkout!', type: 'warning' });
        return;
    }
    // Navigate to the dedicated checkout page
    window.location.href = 'checkout.html';
});

paymentCloseBtn?.addEventListener('click', closePaymentModal);
paymentModal?.addEventListener('click', (e) => {
    if (e.target === paymentModal) closePaymentModal();
});

detailCloseBtn?.addEventListener('click', closeProductDetail);
productDetailModal?.addEventListener('click', (e) => {
    if (e.target === productDetailModal) closeProductDetail();
});

detailThumbs?.addEventListener('click', (e) => {
    const btn = e.target.closest('.detail-thumb');
    if (!btn) return;
    changeProductImage(parseInt(btn.dataset.index, 10));
});

detailColorList?.addEventListener('click', (e) => {
    const btn = e.target.closest('.color-swatch');
    if (!btn) return;
    selectProductColor(parseInt(btn.dataset.index, 10));
});

detailSizeList?.addEventListener('click', (e) => {
    const btn = e.target.closest('.size-pill');
    if (!btn) return;
    selectProductSize(btn.dataset.size);
});

detailAddToCartBtn?.addEventListener('click', () => {
    if (!selectedProduct) return;
    const qty = parseInt(document.getElementById('detailQtyInput')?.value, 10) || 1;
    addProductToCart(selectedProduct.id, qty, selectedSize, selectedColor);
});

// Image zoom behavior for product detail main image
(function setupDetailImageZoom(){
    const img = detailMainImage;
    if (!img) return;
    const container = img.closest('.zoom-container');
    if (!container) return;

    container.addEventListener('mouseenter', (e) => {
        img.style.transition = 'transform 0.15s ease';
        img.style.willChange = 'transform';
        img.style.transform = 'scale(2)';
    });
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 100;
        const y = (e.clientY - rect.top) / rect.height * 100;
        img.style.transformOrigin = `${x}% ${y}%`;
    });
    container.addEventListener('mouseleave', () => {
        img.style.transform = 'scale(1)';
        img.style.transformOrigin = '50% 50%';
    });
})();

paymentForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const txnId = document.getElementById('txnId').value.trim();
    const payerName = document.getElementById('payerName').value.trim();
    const payerPhone = document.getElementById('payerPhone').value.trim();
    const address = document.getElementById('deliveryAddress').value.trim();
    const city = document.getElementById('deliveryCity').value.trim();
    const state = document.getElementById('deliveryState').value.trim();
    const zipCode = document.getElementById('deliveryZip').value.trim();
    const landmark = document.getElementById('deliveryLandmark').value.trim();

    if (!txnId || !payerName || !payerPhone || !address || !city || !state || !zipCode) {
        paymentMsg.textContent = 'Please fill all payment and delivery details.';
        paymentMsg.className = 'auth-message payment-msg error';
        return;
    }

    const user = getCurrentUser();
    const order = {
        orderId: 'RN' + Date.now().toString().slice(-8),
        customerName: payerName,
        customerPhone: payerPhone,
        userEmail: user?.email || '',
        txnId,
        address,
        city,
        state,
        zipCode,
        landmark,
        deliveryAddress: address,
        items: [...cartItems],
        total: getCartTotal(),
        date: new Date().toISOString(),
        status: 'pending'
    };

    reduceStock(cartItems);
    saveOrder(order);

    cartItems = [];
    saveCartItems(cartItems);
    renderCart();
    renderAllProducts();
    renderUserOrders();

    paymentMsg.textContent = `Payment confirmed! Order ID: ${order.orderId}`;
    paymentMsg.className = 'auth-message payment-msg success';

    setTimeout(() => {
        closePaymentModal();
        alert(`Thank you! Your order ${order.orderId} has been placed successfully.`);
    }, 1500);
});

// --- Filters & Search ---
const collectionFilters = document.querySelectorAll('.collection-filter');
const searchInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.search-btn');
const filterBtn = document.querySelector('.filter-btn');
const filterPanel = document.querySelector('.filter-panel');
const filterCloseBtn = document.querySelector('.filter-close-btn');
const filterApplyBtn = document.querySelector('.filter-apply-btn');
const filterResetBtn = document.querySelector('.filter-reset-btn');
const priceMinInput = document.querySelector('#priceMin');
const priceMaxInput = document.querySelector('#priceMax');
const sortBySelect = document.querySelector('#sortBy');

let activeCollectionFilter = 'all';
let activeSearchQuery = '';
let activePriceMin = null;
let activePriceMax = null;
let activeSortKey = 'default';

let activeCategoryFilter = '';
let activeSizeFilters = [];
let activeColorFilters = [];
let activeBrandFilter = '';

function applyProductFilters() {
    productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        const matchesCollection = (() => {
            if (activeCollectionFilter === 'all') return true;
            const tags = (card.dataset.collection || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
            return tags.includes(activeCollectionFilter);
        })();

        const matchesCategory = (() => {
            if (!activeCategoryFilter) return true;
            return (card.dataset.category || '').toLowerCase() === activeCategoryFilter;
        })();

        const matchesSearch = (() => {
            if (!activeSearchQuery) return true;
            const name = (card.querySelector('.product-name')?.innerText || '').toLowerCase();
            return name.includes(activeSearchQuery);
        })();

        const matchesPrice = (() => {
            const price = parseFloat(card.querySelector('.price')?.dataset?.price || '0');
            if (Number.isNaN(price)) return false;
            if (activePriceMin !== null && price < activePriceMin) return false;
            if (activePriceMax !== null && price > activePriceMax) return false;
            return true;
        })();

        const matchesSizes = (() => {
            if (!activeSizeFilters.length) return true;
            const sizes = (card.dataset.sizes || '').split(',').map(s => s.trim()).filter(Boolean);
            return activeSizeFilters.some(s => sizes.includes(s));
        })();

        const matchesColors = (() => {
            if (!activeColorFilters.length) return true;
            const colors = (card.dataset.colors || '').split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
            return activeColorFilters.some(c => colors.includes(c.toLowerCase()));
        })();

        const matchesBrand = (() => {
            if (!activeBrandFilter) return true;
            return (card.dataset.brand || '').toLowerCase() === activeBrandFilter;
        })();

        const visible = matchesCollection && matchesCategory && matchesSearch && matchesPrice && matchesSizes && matchesColors && matchesBrand;
        card.classList.toggle('is-hidden', !visible);
    });
    applySort();
}

function applyCollectionFilter(filterKey) {
    activeCollectionFilter = filterKey;
    applyProductFilters();
}

function applySearchFilter(query) {
    activeSearchQuery = (query || '').trim().toLowerCase();
    applyProductFilters();
}

function applySort() {
    productGrids.forEach(grid => {
        const cards = Array.from(grid.querySelectorAll('.product-card'));
        const visible = cards.filter(c => !c.classList.contains('is-hidden'));
        const hidden = cards.filter(c => c.classList.contains('is-hidden'));

        const getPrice = (c) => parseFloat(c.querySelector('.price')?.dataset?.price || '0');
        const getName = (c) => (c.querySelector('.product-name')?.innerText || '').toLowerCase();
        const getOriginal = (c) => parseInt(c.dataset.originalIndex || '0', 10);

        visible.sort((a, b) => {
            if (activeSortKey === 'priceAsc') return getPrice(a) - getPrice(b);
            if (activeSortKey === 'priceDesc') return getPrice(b) - getPrice(a);
            if (activeSortKey === 'nameAsc') return getName(a).localeCompare(getName(b));
            if (activeSortKey === 'nameDesc') return getName(b).localeCompare(getName(a));
            if (activeSortKey === 'newest') {
                const da = Date.parse(a.dataset.createdAt || '1970-01-01');
                const db = Date.parse(b.dataset.createdAt || '1970-01-01');
                return db - da; // newest first
            }
            if (activeSortKey === 'popular') {
                return parseInt(b.dataset.sold || '0', 10) - parseInt(a.dataset.sold || '0', 10);
            }
            if (activeSortKey === 'bestRated') {
                return parseFloat(b.dataset.rating || '0') - parseFloat(a.dataset.rating || '0');
            }
            return getOriginal(a) - getOriginal(b);
        });

        [...visible, ...hidden].forEach(c => grid.appendChild(c));
    });
}

function openFilterPanel() {
    filterPanel?.classList.add('open');
    filterPanel?.setAttribute('aria-hidden', 'false');
}

function closeFilterPanel() {
    filterPanel?.classList.remove('open');
    filterPanel?.setAttribute('aria-hidden', 'true');
}

window.applySearchFilter = applySearchFilter;
window.applyProductFilters = applyProductFilters;
window.openFilterPanel = openFilterPanel;
window.closeFilterPanel = closeFilterPanel;
window.resetFilterInputs = resetFilterInputs;

function readFilterInputs() {
    const minVal = priceMinInput?.value ? parseFloat(priceMinInput.value) : null;
    const maxVal = priceMaxInput?.value ? parseFloat(priceMaxInput.value) : null;
    activePriceMin = (minVal !== null && !Number.isNaN(minVal)) ? minVal : null;
    activePriceMax = (maxVal !== null && !Number.isNaN(maxVal)) ? maxVal : null;
    activeSortKey = sortBySelect?.value || 'default';
}

function resetFilterInputs() {
    if (priceMinInput) priceMinInput.value = '';
    if (priceMaxInput) priceMaxInput.value = '';
    if (sortBySelect) sortBySelect.value = 'default';
    activePriceMin = null;
    activePriceMax = null;
    activeSortKey = 'default';
    activeCategoryFilter = '';
    activeSizeFilters = [];
    activeColorFilters = [];
    activeBrandFilter = '';
    // reset UI extras if present
    document.querySelectorAll('.filter-size input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.filter-color .color-swatch-input').forEach(cb => cb.checked = false);
    const brandSel = document.querySelector('#filterBrand'); if (brandSel) brandSel.value = '';
    applyProductFilters();
}

// Create dynamic filter extras (sizes, colors, brands, and a dual-range price slider)
function populateFilterExtras() {
    const panelInner = document.querySelector('.filter-panel-inner');
    if (!panelInner) return;
    // avoid duplicate
    if (panelInner.querySelector('.filter-extras')) return;

    const products = getProducts();
    const allSizes = new Set();
    const allColors = new Map();
    const allBrands = new Set();
    let maxPrice = 0;

    products.forEach(p => {
        (p.sizes || []).forEach(s => allSizes.add(s));
        (p.colors || []).forEach(c => allColors.set(c.name, c.hex || '#ccc'));
        if (p.brand) allBrands.add(p.brand);
        if (p.price && p.price > maxPrice) maxPrice = p.price;
    });

    const extras = document.createElement('div');
    extras.className = 'filter-extras';

    // Category select hook
    const catSelect = document.querySelector('#filterCategory');
    if (catSelect) {
        catSelect.addEventListener('change', () => {
            activeCategoryFilter = (catSelect.value || '').toLowerCase();
            applyProductFilters();
        });
    }

    // Sizes
    if (allSizes.size) {
        const sizeDiv = document.createElement('div');
        sizeDiv.className = 'filter-row filter-size';
        sizeDiv.innerHTML = `<label class="filter-label">Sizes</label><div class="filter-values"></div>`;
        const values = sizeDiv.querySelector('.filter-values');
        Array.from(allSizes).sort().forEach(sz => {
            const id = 'sz_' + sz;
            const wrapper = document.createElement('label');
            wrapper.innerHTML = `<input type="checkbox" id="${id}" value="${sz}"> ${sz}`;
            const cb = wrapper.querySelector('input');
            cb.addEventListener('change', () => {
                activeSizeFilters = Array.from(document.querySelectorAll('.filter-size input:checked')).map(i => i.value);
                applyProductFilters();
            });
            values.appendChild(wrapper);
        });
        extras.appendChild(sizeDiv);
    }

    // Colors
    if (allColors.size) {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'filter-row filter-color';
        colorDiv.innerHTML = `<label class="filter-label">Colors</label><div class="filter-values color-list"></div>`;
        const values = colorDiv.querySelector('.filter-values');
        Array.from(allColors.entries()).forEach(([name, hex]) => {
            const id = 'cl_' + name.replace(/\s+/g, '_');
            const wrapper = document.createElement('label');
            wrapper.style.marginRight = '8px';
            wrapper.innerHTML = `
                <input type="checkbox" class="color-swatch-input" id="${id}" value="${name}">
                <span class="color-swatch" title="${name}" style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${hex};vertical-align:middle;margin-left:6px;border:1px solid #ddd"></span>
                <span style="margin-left:6px">${name}</span>
            `;
            const cb = wrapper.querySelector('input');
            cb.addEventListener('change', () => {
                activeColorFilters = Array.from(document.querySelectorAll('.filter-color input:checked')).map(i => i.value);
                applyProductFilters();
            });
            values.appendChild(wrapper);
        });
        extras.appendChild(colorDiv);
    }

    // Brand
    if (allBrands.size) {
        const brandDiv = document.createElement('div');
        brandDiv.className = 'filter-row filter-brand';
        brandDiv.innerHTML = `<label class="filter-label" for="filterBrand">Brand</label><select id="filterBrand" class="filter-select"><option value="">All Brands</option></select>`;
        const sel = brandDiv.querySelector('#filterBrand');
        Array.from(allBrands).sort().forEach(b => { const opt = document.createElement('option'); opt.value = b; opt.textContent = b; sel.appendChild(opt); });
        sel.addEventListener('change', () => { activeBrandFilter = (sel.value || '').toLowerCase(); applyProductFilters(); });
        extras.appendChild(brandDiv);
    }

    // Price double range
    const priceDiv = document.createElement('div');
    priceDiv.className = 'filter-row filter-price-range';
    const max = Math.max(1000, Math.ceil(maxPrice / 100) * 100);
    priceDiv.innerHTML = `
        <label class="filter-label">Price Range</label>
        <div class="range-wrap">
            <input type="range" id="priceRangeMin" min="0" max="${max}" value="0">
            <input type="range" id="priceRangeMax" min="0" max="${max}" value="${max}">
            <div class="range-values"><span id="rangeMinVal">0</span> — <span id="rangeMaxVal">${max}</span></div>
        </div>
    `;
    extras.appendChild(priceDiv);

    const filterActions = panelInner.querySelector('.filter-actions');
    filterActions ? panelInner.insertBefore(extras, filterActions) : panelInner.appendChild(extras);

    // wire range inputs
    const rMin = document.getElementById('priceRangeMin');
    const rMax = document.getElementById('priceRangeMax');
    const rMinVal = document.getElementById('rangeMinVal');
    const rMaxVal = document.getElementById('rangeMaxVal');
    if (rMin && rMax && rMinVal && rMaxVal) {
        const syncRange = () => {
            let minV = parseInt(rMin.value, 10);
            let maxV = parseInt(rMax.value, 10);
            if (minV > maxV) { const t = minV; minV = maxV; maxV = t; }
            rMinVal.textContent = minV;
            rMaxVal.textContent = maxV;
            priceMinInput.value = minV === 0 ? '' : String(minV);
            priceMaxInput.value = maxV === max ? '' : String(maxV);
            activePriceMin = minV === 0 ? null : minV;
            activePriceMax = maxV === max ? null : maxV;
            applyProductFilters();
        };
        rMin.addEventListener('input', syncRange);
        rMax.addEventListener('input', syncRange);
    }
}

collectionFilters.forEach(btn => {
    btn.addEventListener('click', () => {
        const key = (btn.dataset.filter || 'all').toLowerCase();
        collectionFilters.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        applyCollectionFilter(key);
        productsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

if (searchInput) {
    searchInput.addEventListener('input', () => applySearchFilter(searchInput.value));
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            applySearchFilter(searchInput.value);
            productsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (e.key === 'Escape') {
            searchInput.value = '';
            applySearchFilter('');
            searchInput.blur();
        }
    });
}

if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
        applySearchFilter(searchInput.value);
        productsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

filterBtn?.addEventListener('click', openFilterPanel);
filterCloseBtn?.addEventListener('click', closeFilterPanel);
filterPanel?.addEventListener('click', (e) => { if (e.target === filterPanel) closeFilterPanel(); });
filterApplyBtn?.addEventListener('click', () => { readFilterInputs(); applyProductFilters(); closeFilterPanel(); });
filterResetBtn?.addEventListener('click', () => { resetFilterInputs(); closeFilterPanel(); });

document.querySelector('.btn')?.addEventListener('click', () => {
    productsSection?.scrollIntoView({ behavior: 'smooth' });
});

renderAllProducts();
renderCart();
// Populate dynamic filter controls (sizes, colors, brands, price slider)
try { populateFilterExtras(); } catch (e) { /* ignore */ }
// Initialize UI modules, i18n, extra features, and API
try { if (typeof RN !== 'undefined' && typeof RN.initUI === 'function') RN.initUI(); } catch (e) {}
try { if (typeof RN !== 'undefined' && typeof RN.initI18n === 'function') RN.initI18n(); } catch (e) {}
try { if (typeof RN !== 'undefined' && typeof RN.initFeatures === 'function') RN.initFeatures(); } catch (e) {}
try { if (typeof RN !== 'undefined' && typeof RN.initApi === 'function') RN.initApi(); } catch (e) {}

// Global click delegation for Wishlist and Compare buttons on product cards
document.addEventListener('click', (e) => {
    const wishBtn = e.target.closest('.wishlist-btn');
    if (wishBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = wishBtn.dataset.productId;
        if (id && typeof RN !== 'undefined' && typeof RN.toggleWishlist === 'function') {
            const added = RN.toggleWishlist(id);
            const icon = wishBtn.querySelector('i');
            if (icon) icon.className = added ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            wishBtn.classList.toggle('active', added);
        }
        return;
    }

    const compBtn = e.target.closest('.compare-btn');
    if (compBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = compBtn.dataset.productId;
        if (id && typeof RN !== 'undefined' && typeof RN.toggleCompare === 'function') {
            const added = RN.toggleCompare(id);
            compBtn.classList.toggle('active', added);
        }
        return;
    }
});

// Render wishlist grid
function renderWishlist() {
    const grid = document.getElementById('wishlistGrid');
    const emptyMsg = document.querySelector('.wishlist-empty');
    if (!grid) return;
    const ids = (typeof RN !== 'undefined' && RN.getWishlist) ? RN.getWishlist() : [];
    grid.innerHTML = '';
    if (!ids.length) {
        if (emptyMsg) emptyMsg.classList.remove('is-hidden');
        return;
    }
    if (emptyMsg) emptyMsg.classList.add('is-hidden');
    ids.forEach(id => {
        const p = getProductById(id);
        if (!p) return;
        const card = renderProductCard(p, 0);
        grid.appendChild(card);
    });
}

// Wrap RN.updateWishlistUI to also render wishlist grid when the wishlist changes
if (typeof RN !== 'undefined' && RN.updateWishlistUI) {
    const _origUpd = RN.updateWishlistUI.bind(RN);
    RN.updateWishlistUI = function() { _origUpd(); try { renderWishlist(); } catch (e) {} };
}
// Initial render
try { renderWishlist(); } catch (e) {}

// --- User Sign Up / Login ---
const USERS_KEY = 'rn_users';
const SESSION_KEY = 'rn_current_user';

const authModal = document.querySelector('.auth-modal');
const authOpenBtn = document.querySelector('.auth-open-btn');
const authCloseBtn = document.querySelector('.auth-close-btn');
const authTabs = document.querySelectorAll('.auth-tab');
const signupForm = document.querySelector('#signupForm');
const loginForm = document.querySelector('#loginForm');
const authModalTitle = document.querySelector('.auth-modal-title');
const userMenu = document.querySelector('.user-menu');
const userNameEl = document.querySelector('.user-name');
const logoutBtn = document.querySelector('.logout-btn');

function getUsers() {
    try { return JSON.parse(storage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}
function saveUsers(users) { storage.setItem(USERS_KEY, JSON.stringify(users)); }
function getCurrentUser() {
    try { return JSON.parse(storage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
function setCurrentUser(user) {
    user ? storage.setItem(SESSION_KEY, JSON.stringify(user)) : storage.removeItem(SESSION_KEY);
}

function updateAuthUI() {
    const user = getCurrentUser();
    if (user) {
        authOpenBtn.classList.add('is-hidden');
        userMenu.classList.remove('is-hidden');
        userNameEl.textContent = user.name.split(' ')[0];
    } else {
        authOpenBtn.classList.remove('is-hidden');
        userMenu.classList.add('is-hidden');
        userNameEl.textContent = '';
    }
    renderUserOrders();
}

function openAuthModal(tab = 'signup') {
    authModal.classList.add('open');
    authModal.setAttribute('aria-hidden', 'false');
    switchAuthTab(tab);
}

function closeAuthModal() {
    authModal.classList.remove('open');
    authModal.setAttribute('aria-hidden', 'true');
    signupForm.reset();
    loginForm.reset();
    document.querySelectorAll('.auth-message').forEach(el => { el.textContent = ''; el.classList.remove('error', 'success'); });
}

function switchAuthTab(tab) {
    authTabs.forEach(t => t.classList.toggle('is-active', t.dataset.authTab === tab));
    signupForm.classList.toggle('is-hidden', tab !== 'signup');
    loginForm.classList.toggle('is-hidden', tab !== 'login');
    authModalTitle.textContent = tab === 'signup' ? 'Create Account' : 'Welcome Back';
}

function showAuthMessage(form, text, type) {
    const msg = form.querySelector('.auth-message');
    msg.textContent = text;
    msg.className = 'auth-message ' + type;
}

authOpenBtn?.addEventListener('click', () => openAuthModal('signup'));
authCloseBtn?.addEventListener('click', closeAuthModal);
authModal?.addEventListener('click', (e) => { if (e.target === authModal) closeAuthModal(); });
authTabs.forEach(tab => tab.addEventListener('click', () => switchAuthTab(tab.dataset.authTab)));

signupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.querySelector('#signupName').value.trim();
    const email = document.querySelector('#signupEmail').value.trim().toLowerCase();
    const phone = document.querySelector('#signupPhone').value.trim();
    const password = document.querySelector('#signupPassword').value;
    const confirm = document.querySelector('#signupConfirm').value;

    if (!name || !email || !password) { showAuthMessage(signupForm, 'Please fill in all required fields.', 'error'); return; }
    if (password.length < 6) { showAuthMessage(signupForm, 'Password must be at least 6 characters.', 'error'); return; }
    if (password !== confirm) { showAuthMessage(signupForm, 'Passwords do not match.', 'error'); return; }

    const users = getUsers();
    if (users.some(u => u.email === email)) { showAuthMessage(signupForm, 'Email already registered.', 'error'); return; }

    users.push({ name, email, phone, password, createdAt: new Date().toISOString() });
    saveUsers(users);
    setCurrentUser({ name, email, phone });
    updateAuthUI();
    showAuthMessage(signupForm, 'Account created! Welcome to R.N Readymade.', 'success');
    setTimeout(closeAuthModal, 1200);
});

loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.querySelector('#loginEmail').value.trim().toLowerCase();
    const password = document.querySelector('#loginPassword').value;
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) { showAuthMessage(loginForm, 'Invalid email or password.', 'error'); return; }
    setCurrentUser({ name: user.name, email: user.email, phone: user.phone });
    updateAuthUI();
    showAuthMessage(loginForm, `Welcome back, ${user.name.split(' ')[0]}!`, 'success');
    setTimeout(closeAuthModal, 1000);
});

logoutBtn?.addEventListener('click', () => { setCurrentUser(null); updateAuthUI(); });
updateAuthUI();
renderCart();
renderAllProducts();

// --- Initialise RN modules ---
if (typeof RN !== 'undefined') {
    if (typeof RN.initUI === 'function') RN.initUI();
    if (typeof RN.initI18n === 'function') RN.initI18n();
    if (typeof RN.initFeatures === 'function') RN.initFeatures();
    if (typeof RN.initSearch === 'function') RN.initSearch();
    if (typeof RN.initApi === 'function') RN.initApi();
}

