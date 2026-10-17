/**
 * drawers.js — Dedicated Wishlist Drawer, Orders Tracking Drawer, and Notification Center
 * R.N Readymade
 */
window.RN = window.RN || {};

(function () {
    const CART_KEY = 'rn_cart';

    // =========================================================================
    // 1. WISHLIST DRAWER
    // =========================================================================
    RN.openWishlistDrawer = () => {
        const drawer = document.getElementById('wishlistDrawer');
        const overlay = document.getElementById('drawerOverlay');
        if (!drawer) return;

        RN.renderWishlistDrawer();
        drawer.classList.add('open');
        if (overlay) overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    RN.closeWishlistDrawer = () => {
        const drawer = document.getElementById('wishlistDrawer');
        const overlay = document.getElementById('drawerOverlay');
        if (drawer) drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    };

    RN.renderWishlistDrawer = () => {
        const listEl = document.getElementById('wishlistDrawerList');
        const countBadge = document.getElementById('wishlistDrawerCount');
        const footerEl = document.getElementById('wishlistDrawerFooter');
        if (!listEl) return;

        const wishlistIds = RN.getWishlist();
        if (countBadge) countBadge.textContent = `${wishlistIds.length} item${wishlistIds.length === 1 ? '' : 's'}`;

        if (!wishlistIds.length) {
            listEl.innerHTML = `
                <div class="drawer-empty-state">
                    <div class="empty-icon-ring"><i class="fa-regular fa-heart"></i></div>
                    <h3>Your Wishlist is Empty</h3>
                    <p>Tap the heart icon on any outfit you love to save it here for later!</p>
                    <button class="drawer-explore-btn" onclick="RN.closeWishlistDrawer(); document.querySelector('.featured-section')?.scrollIntoView({behavior:'smooth'})">
                        Explore Trending Outfits
                    </button>
                </div>
            `;
            if (footerEl) footerEl.style.display = 'none';
            return;
        }

        if (footerEl) footerEl.style.display = 'flex';

        const products = wishlistIds
            .map(id => typeof getProductById === 'function' ? getProductById(id) : null)
            .filter(Boolean);

        listEl.innerHTML = products.map(p => {
            const imgSrc = (p.images && p.images[0]) || p.image || '';
            const fmtPrice = typeof formatPrice === 'function' ? formatPrice(p.price) : `Rs. ${p.price}`;
            const inStock = (p.stock || 0) > 0;

            return `
                <div class="drawer-product-item" data-id="${p.id}">
                    <img class="drawer-prod-img" src="${RN.escapeHtml(imgSrc)}" alt="${RN.escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=300'">
                    <div class="drawer-prod-info">
                        <span class="drawer-prod-cat">${RN.escapeHtml(p.category || 'Fashion')}</span>
                        <h4 class="drawer-prod-title">${RN.escapeHtml(p.name)}</h4>
                        <div class="drawer-prod-pricing">
                            <span class="drawer-prod-price">${fmtPrice}</span>
                            ${p.discount ? `<span class="drawer-prod-disc">-${p.discount}%</span>` : ''}
                        </div>
                        <span class="drawer-stock-badge ${inStock ? 'in' : 'out'}">
                            ${inStock ? `<i class="fa-solid fa-circle-check"></i> In Stock (${p.stock})` : '<i class="fa-solid fa-circle-xmark"></i> Out of Stock'}
                        </span>
                    </div>
                    <div class="drawer-item-actions">
                        <button class="drawer-action-cart" title="Move to Cart" ${!inStock ? 'disabled' : ''} onclick="RN.moveWishlistItemToCart('${p.id}')">
                            <i class="fa-solid fa-cart-plus"></i> Move to Cart
                        </button>
                        <button class="drawer-action-remove" title="Remove" onclick="RN.toggleWishlist('${p.id}'); RN.renderWishlistDrawer();">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    };

    RN.moveWishlistItemToCart = (productId) => {
        const product = typeof getProductById === 'function' ? getProductById(productId) : null;
        if (!product) return;

        let cart = RN.parseJSON(RN.storage.getItem(CART_KEY), []);
        const size = (product.sizes && product.sizes[0]) || 'M';
        const color = (product.colors && product.colors[0] && product.colors[0].name) || 'Default';

        const existing = cart.find(i => i.id === product.id && i.size === size);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                qty: 1,
                size,
                color
            });
        }

        RN.storage.setItem(CART_KEY, JSON.stringify(cart));
        RN.toggleWishlist(productId);
        RN.renderWishlistDrawer();

        // Update main cart badges & UI if loaded
        if (typeof updateCartUI === 'function') updateCartUI();

        if (RN.showToast) {
            RN.showToast({
                message: `🛒 ${product.name} moved to Cart!`,
                type: 'success',
                actionText: 'View Cart',
                onAction: () => {
                    RN.closeWishlistDrawer();
                    document.querySelector('.cart-sidebar')?.classList.add('is-open');
                }
            });
        }
    };

    RN.moveAllWishlistToCart = () => {
        const wishlistIds = RN.getWishlist();
        if (!wishlistIds.length) return;

        let cart = RN.parseJSON(RN.storage.getItem(CART_KEY), []);

        wishlistIds.forEach(id => {
            const product = typeof getProductById === 'function' ? getProductById(id) : null;
            if (product && product.stock > 0) {
                const size = (product.sizes && product.sizes[0]) || 'M';
                const color = (product.colors && product.colors[0] && product.colors[0].name) || 'Default';
                const existing = cart.find(i => i.id === product.id && i.size === size);
                if (existing) existing.qty += 1;
                else cart.push({ id: product.id, name: product.name, price: product.price, qty: 1, size, color });
            }
        });

        RN.storage.setItem(CART_KEY, JSON.stringify(cart));
        RN.saveWishlist([]);
        RN.renderWishlistDrawer();
        RN.updateWishlistUI();

        if (typeof updateCartUI === 'function') updateCartUI();

        if (RN.showToast) {
            RN.showToast({
                message: '🎉 All available wishlist items moved to your Cart!',
                type: 'success',
                actionText: 'Open Cart',
                onAction: () => {
                    RN.closeWishlistDrawer();
                    document.querySelector('.cart-sidebar')?.classList.add('is-open');
                }
            });
        }
    };

    // =========================================================================
    // 2. ORDERS TRACKING HUB DRAWER
    // =========================================================================
    RN.currentOrdersFilter = 'all';

    RN.openOrdersDrawer = () => {
        const drawer = document.getElementById('ordersDrawer');
        const overlay = document.getElementById('drawerOverlay');
        if (!drawer) return;

        RN.renderOrdersDrawer(RN.currentOrdersFilter);
        drawer.classList.add('open');
        if (overlay) overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    RN.closeOrdersDrawer = () => {
        const drawer = document.getElementById('ordersDrawer');
        const overlay = document.getElementById('drawerOverlay');
        if (drawer) drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    };

    RN.renderOrdersDrawer = (filter = 'all') => {
        RN.currentOrdersFilter = filter;
        const listEl = document.getElementById('ordersDrawerList');
        const countBadge = document.getElementById('ordersDrawerCount');
        if (!listEl) return;

        // Update filter tab active classes
        document.querySelectorAll('.orders-filter-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        const allOrders = typeof getOrders === 'function' ? getOrders() : [];
        if (countBadge) countBadge.textContent = `${allOrders.length} Order${allOrders.length === 1 ? '' : 's'}`;

        let filtered = allOrders;
        if (filter === 'active') {
            filtered = allOrders.filter(o => ['pending', 'processing', 'packed', 'shipped', 'out-for-delivery'].includes(o.status));
        } else if (filter === 'delivered') {
            filtered = allOrders.filter(o => o.status === 'delivered');
        }

        if (!filtered.length) {
            listEl.innerHTML = `
                <div class="drawer-empty-state">
                    <div class="empty-icon-ring"><i class="fa-solid fa-box-open"></i></div>
                    <h3>No ${filter !== 'all' ? filter : ''} Orders Found</h3>
                    <p>Looks like you haven't placed any orders matching this category yet.</p>
                    <button class="drawer-explore-btn" onclick="RN.closeOrdersDrawer(); document.querySelector('.featured-section')?.scrollIntoView({behavior:'smooth'})">
                        Start Shopping
                    </button>
                </div>
            `;
            return;
        }

        const fmtPrice = (amount) => typeof formatPrice === 'function' ? formatPrice(amount) : `Rs. ${amount}`;
        const fmtDate = (d) => {
            try { return new Date(d).toLocaleDateString('en-NP', { month: 'short', day: 'numeric', year: 'numeric' }); }
            catch { return d; }
        };

        const statusMap = {
            pending: { label: 'Pending Confirmation', icon: 'fa-clock', cls: 'pending', step: 1 },
            processing: { label: 'Processing & Packing', icon: 'fa-boxes-packing', cls: 'processing', step: 2 },
            packed: { label: 'Packed & Ready', icon: 'fa-box', cls: 'processing', step: 2 },
            shipped: { label: 'In Transit / Shipped', icon: 'fa-truck-fast', cls: 'shipped', step: 3 },
            'out-for-delivery': { label: 'Out for Delivery', icon: 'fa-truck', cls: 'shipped', step: 4 },
            delivered: { label: 'Delivered', icon: 'fa-circle-check', cls: 'delivered', step: 5 },
            cancelled: { label: 'Cancelled', icon: 'fa-circle-xmark', cls: 'cancelled', step: 0 }
        };

        listEl.innerHTML = filtered.map(order => {
            const status = statusMap[order.status] || statusMap.pending;
            const items = order.items || [];
            const itemCount = items.reduce((sum, i) => sum + (i.qty || 1), 0);

            // Progress tracker dots
            const steps = [
                { label: 'Placed', num: 1 },
                { label: 'Packed', num: 2 },
                { label: 'Shipped', num: 3 },
                { label: 'Delivered', num: 5 }
            ];

            const trackerHtml = steps.map(s => {
                const isDone = status.step >= s.num;
                const isCurrent = status.step === s.num;
                return `
                    <div class="order-step-node ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}">
                        <div class="step-dot"><i class="fa-solid fa-${isDone ? 'check' : 'circle'}"></i></div>
                        <span class="step-name">${s.label}</span>
                    </div>
                `;
            }).join('');

            const itemsThumbnails = items.slice(0, 3).map(i => {
                const prod = typeof getProductById === 'function' ? getProductById(i.id) : null;
                const src = prod?.images?.[0] || prod?.image || '';
                return src ? `<img class="order-mini-thumb" src="${RN.escapeHtml(src)}" alt="${RN.escapeHtml(i.name)}">` : '';
            }).join('');

            return `
                <div class="order-drawer-card" data-order-id="${order.orderId}">
                    <div class="order-card-header">
                        <div>
                            <span class="order-id-tag">#${RN.escapeHtml(order.orderId)}</span>
                            <span class="order-date-tag">${fmtDate(order.date)}</span>
                        </div>
                        <span class="order-status-pill ${status.cls}">
                            <i class="fa-solid ${status.icon}"></i> ${status.label}
                        </span>
                    </div>

                    <!-- Progress Stepper -->
                    <div class="order-mini-stepper">
                        ${trackerHtml}
                    </div>

                    <!-- Summary details -->
                    <div class="order-card-body">
                        <div class="order-thumbs-row">
                            ${itemsThumbnails}
                            ${items.length > 3 ? `<span class="order-more-thumbs">+${items.length - 3} more</span>` : ''}
                        </div>
                        <div class="order-pricing-summary">
                            <span class="order-item-count">${itemCount} item${itemCount === 1 ? '' : 's'}</span>
                            <span class="order-grand-total">${fmtPrice(order.total || 0)}</span>
                        </div>
                    </div>

                    <!-- Address & Actions -->
                    <div class="order-card-footer">
                        <span class="order-dest-city"><i class="fa-solid fa-location-dot"></i> ${RN.escapeHtml(order.city || order.deliveryAddress || 'Birgunj')}</span>
                        <div class="order-action-btns">
                            <button class="order-reorder-btn" onclick="RN.reorderItems('${order.orderId}')">
                                <i class="fa-solid fa-arrow-rotate-right"></i> Reorder
                            </button>
                            <a class="order-support-btn" href="https://wa.me/9779845266990?text=${encodeURIComponent(`Hi R.N Readymade! I would like an update on my order #${order.orderId}.`)}" target="_blank" rel="noopener">
                                <i class="fa-brands fa-whatsapp"></i> Track
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    RN.reorderItems = (orderId) => {
        const orders = typeof getOrders === 'function' ? getOrders() : [];
        const order = orders.find(o => o.orderId === orderId);
        if (!order || !order.items) return;

        let cart = RN.parseJSON(RN.storage.getItem(CART_KEY), []);

        order.items.forEach(item => {
            const existing = cart.find(i => i.id === item.id && i.size === (item.size || 'M'));
            if (existing) existing.qty += (item.qty || 1);
            else cart.push({ ...item });
        });

        RN.storage.setItem(CART_KEY, JSON.stringify(cart));
        if (typeof updateCartUI === 'function') updateCartUI();

        if (RN.showToast) {
            RN.showToast({
                message: `✓ Added all items from order #${orderId} back to cart!`,
                type: 'success',
                actionText: 'Checkout',
                onAction: () => {
                    RN.closeOrdersDrawer();
                    window.location.href = 'checkout.html';
                }
            });
        }
    };

    // =========================================================================
    // 3. WIRE EVENTS & OVERLAY
    // =========================================================================
    document.addEventListener('DOMContentLoaded', () => {
        // Overlay close for all drawers
        document.getElementById('drawerOverlay')?.addEventListener('click', () => {
            RN.closeWishlistDrawer();
            RN.closeOrdersDrawer();
        });

        // Wishlist triggers & close
        document.querySelectorAll('.nav-wishlist-trigger, .mobile-nav-wishlist').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                RN.openWishlistDrawer();
            });
        });
        document.getElementById('wishlistDrawerClose')?.addEventListener('click', RN.closeWishlistDrawer);
        document.getElementById('wishlistMoveAllBtn')?.addEventListener('click', RN.moveAllWishlistToCart);

        // Orders triggers & close
        document.querySelectorAll('.nav-orders-trigger, .mobile-nav-orders').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                RN.openOrdersDrawer();
            });
        });
        document.getElementById('ordersDrawerClose')?.addEventListener('click', RN.closeOrdersDrawer);

        // Orders filter tabs
        document.querySelectorAll('.orders-filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                RN.renderOrdersDrawer(tab.dataset.filter);
            });
        });

        // Notification center popover
        document.querySelector('.nav-notifications-trigger')?.addEventListener('click', (e) => {
            e.stopPropagation();
            RN.toggleNotificationPopover();
        });

        document.addEventListener('click', (e) => {
            const pop = document.getElementById('notificationPopover');
            if (pop && !pop.contains(e.target) && !e.target.closest('.nav-notifications-trigger')) {
                pop.classList.remove('open');
            }
        });
    });

})();
