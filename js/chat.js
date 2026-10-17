/**
 * chat.js — Interactive Virtual Style Concierge & Live Assistant for R.N Readymade
 */
window.RN = window.RN || {};

(function () {
    let chatModal = null;
    let chatMessages = null;
    let chatInput = null;
    let isTyping = false;

    const QUICK_ACTIONS = [
        { label: '📦 Track My Order', action: 'track_order' },
        { label: '🎁 Discount Coupons', action: 'show_coupons' },
        { label: '👗 Find My Style', action: 'find_style' },
        { label: '📍 Store Location & Hours', action: 'store_info' },
        { label: '💬 Live WhatsApp Support', action: 'whatsapp_support' }
    ];

    function createChatUI() {
        if (document.getElementById('rnChatDrawer')) return;

        const drawer = document.createElement('div');
        drawer.id = 'rnChatDrawer';
        drawer.className = 'rn-chat-drawer';
        drawer.setAttribute('aria-hidden', 'true');
        drawer.innerHTML = `
            <div class="rn-chat-header">
                <div class="rn-chat-agent-info">
                    <div class="rn-chat-avatar">
                        <i class="fa-solid fa-sparkles"></i>
                        <span class="rn-chat-status-dot" title="Online"></span>
                    </div>
                    <div>
                        <div class="rn-chat-title">R.N Style Concierge</div>
                        <div class="rn-chat-subtitle">Instant Assistant · Birgunj</div>
                    </div>
                </div>
                <div class="rn-chat-header-actions">
                    <button type="button" class="rn-chat-action-btn" id="rnChatClearBtn" title="Clear chat history">
                        <i class="fa-solid fa-rotate-right"></i>
                    </button>
                    <button type="button" class="rn-chat-close-btn" id="rnChatCloseBtn" aria-label="Close chat">&times;</button>
                </div>
            </div>

            <div class="rn-chat-body">
                <div class="rn-chat-messages" id="rnChatMessages">
                    <div class="rn-chat-msg bot">
                        <div class="rn-chat-bubble">
                            👋 Namaste! Welcome to <strong>R.N Readymade</strong>. I am your personal shopping assistant. How can I help you elevate your style today?
                        </div>
                        <span class="rn-chat-time">${formatTime()}</span>
                    </div>
                </div>

                <div class="rn-chat-quick-actions" id="rnChatQuickActions">
                    ${QUICK_ACTIONS.map(q => `<button type="button" class="rn-chat-chip" data-action="${q.action}">${q.label}</button>`).join('')}
                </div>
            </div>

            <form class="rn-chat-footer" id="rnChatForm">
                <input type="text" id="rnChatInput" class="rn-chat-input" placeholder="Ask about sizes, styles, orders..." autocomplete="off">
                <button type="submit" class="rn-chat-send-btn" aria-label="Send message">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </form>
        `;

        document.body.appendChild(drawer);

        chatModal = drawer;
        chatMessages = document.getElementById('rnChatMessages');
        chatInput = document.getElementById('rnChatInput');

        // Events
        document.getElementById('rnChatCloseBtn')?.addEventListener('click', RN.closeChat);
        document.getElementById('rnChatClearBtn')?.addEventListener('click', clearChat);
        document.getElementById('rnChatForm')?.addEventListener('submit', handleSend);

        chatModal.addEventListener('click', (e) => {
            const chip = e.target.closest('.rn-chat-chip');
            if (chip) {
                handleQuickAction(chip.dataset.action, chip.textContent);
            }
            const viewProdBtn = e.target.closest('[data-view-product]');
            if (viewProdBtn) {
                const prodId = viewProdBtn.dataset.viewProduct;
                if (typeof openProductDetail === 'function') {
                    RN.closeChat();
                    openProductDetail(prodId);
                }
            }
            const applyCpnBtn = e.target.closest('[data-apply-coupon]');
            if (applyCpnBtn) {
                const code = applyCpnBtn.dataset.applyCoupon;
                applyCouponDirectly(code);
            }
        });
    }

    function formatTime() {
        const d = new Date();
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function addMessage(text, sender = 'bot', extraHtml = '') {
        if (!chatMessages) return;
        const msgEl = document.createElement('div');
        msgEl.className = `rn-chat-msg ${sender}`;
        msgEl.innerHTML = `
            <div class="rn-chat-bubble">${text}</div>
            ${extraHtml}
            <span class="rn-chat-time">${formatTime()}</span>
        `;
        chatMessages.appendChild(msgEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        if (isTyping) return;
        isTyping = true;
        const typingEl = document.createElement('div');
        typingEl.className = 'rn-chat-msg bot rn-chat-typing';
        typingEl.id = 'rnChatTyping';
        typingEl.innerHTML = `
            <div class="rn-chat-bubble">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        chatMessages.appendChild(typingEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTypingIndicator() {
        isTyping = false;
        const typingEl = document.getElementById('rnChatTyping');
        if (typingEl) typingEl.remove();
    }

    function botReply(text, extraHtml = '', delay = 600) {
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            addMessage(text, 'bot', extraHtml);
        }, delay);
    }

    function clearChat() {
        if (!chatMessages) return;
        chatMessages.innerHTML = `
            <div class="rn-chat-msg bot">
                <div class="rn-chat-bubble">
                    👋 Chat cleared. How can I help you today?
                </div>
                <span class="rn-chat-time">${formatTime()}</span>
            </div>
        `;
        RN.showToast({ message: 'Chat history cleared', type: 'info' });
    }

    function handleSend(e) {
        e.preventDefault();
        const text = (chatInput?.value || '').trim();
        if (!text) return;
        chatInput.value = '';
        addMessage(RN.escapeHtml ? RN.escapeHtml(text) : text, 'user');
        processUserQuery(text);
    }

    function handleQuickAction(action, label) {
        addMessage(label, 'user');
        if (action === 'track_order') {
            const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
            const orders = (typeof getOrders === 'function') ? getOrders() : [];
            const userOrders = user ? orders.filter(o => !o.userEmail || o.userEmail === user.email) : orders;

            if (userOrders.length > 0) {
                const latest = userOrders[0];
                const statusLbl = (typeof getOrderStatusLabel === 'function') ? getOrderStatusLabel(latest.status) : latest.status;
                const total = (typeof formatPrice === 'function') ? formatPrice(latest.total) : `Rs. ${latest.total}`;
                botReply(
                    `📦 Here is your most recent order:`,
                    `<div class="rn-chat-card">
                        <div class="rn-chat-card-header">
                            <strong>${latest.orderId}</strong>
                            <span class="status-pill ${latest.status || 'pending'}">${statusLbl}</span>
                        </div>
                        <p style="margin:4px 0;font-size:0.82rem"><strong>Items:</strong> ${latest.items?.map(i => `${i.name} × ${i.qty}`).join(', ') || '—'}</p>
                        <p style="margin:4px 0;font-size:0.82rem"><strong>Total:</strong> ${total}</p>
                        <p style="margin:4px 0;font-size:0.82rem;color:var(--color-muted)">Delivery: ${[latest.address, latest.city].filter(Boolean).join(', ')}</p>
                    </div>`
                );
            } else {
                botReply(`To track an order, please enter your <strong>Order ID</strong> (e.g. <code>RN12345678</code>) or log in to view past orders.`);
            }
        } else if (action === 'show_coupons') {
            const coupons = RN.CONFIG?.COUPONS || {};
            const cardsHtml = Object.entries(coupons).map(([code, c]) => `
                <div class="rn-chat-card" style="margin-top:8px">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <strong style="color:var(--color-accent);font-size:1rem;letter-spacing:0.05em">${code}</strong>
                        <span style="font-size:0.75rem;background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:99px;font-weight:700">
                            ${c.type === 'percent' ? `${c.discount}% OFF` : `Rs. ${c.discount} OFF`}
                        </span>
                    </div>
                    <p style="font-size:0.8rem;color:var(--color-muted);margin:4px 0">${c.minOrder ? `Min. order Rs. ${c.minOrder}` : 'No minimum order'}</p>
                    <button type="button" class="btn btn-primary" style="padding:6px 12px;font-size:0.78rem;width:100%;margin-top:6px" data-apply-coupon="${code}">
                        Apply to Cart
                    </button>
                </div>
            `).join('');

            botReply(`🎉 Here are active discount promo codes you can use today:`, cardsHtml);
        } else if (action === 'find_style') {
            botReply(
                `Which collection are you interested in exploring?`,
                `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
                    <button type="button" class="rn-chat-chip" data-action="search_men">👔 Men's Fashion</button>
                    <button type="button" class="rn-chat-chip" data-action="search_women">👗 Women's Styles</button>
                    <button type="button" class="rn-chat-chip" data-action="search_kids">🧸 Kids Collection</button>
                    <button type="button" class="rn-chat-chip" data-action="search_bestsellers">🔥 Best Sellers</button>
                </div>`
            );
        } else if (action === 'store_info') {
            botReply(
                `📍 <strong>R.N Readymade Store Information:</strong>`,
                `<div class="rn-chat-card">
                    <p><strong>Location:</strong> Main Road Ghantaghar, Birgunj, Parsa — 44300</p>
                    <p><strong>Shop Hours:</strong> Monday – Saturday (10:00 AM – 8:00 PM)</p>
                    <p><strong>Phone:</strong> <a href="tel:+9779845266990" style="color:var(--color-accent)">+977 9845266990</a></p>
                    <p><strong>Delivery:</strong> 2–3 Days in Birgunj · Free above Rs. 5,000</p>
                    <a href="https://maps.google.com/maps?q=Ghantaghar+Birgunj+Nepal" target="_blank" rel="noopener" class="btn btn-outline" style="padding:6px 12px;font-size:0.8rem;display:inline-block;margin-top:8px">
                        <i class="fa-solid fa-map-location-dot"></i> Open in Google Maps
                    </a>
                </div>`
            );
        } else if (action === 'whatsapp_support') {
            botReply(`Connecting you with our store manager on WhatsApp...`);
            setTimeout(() => {
                window.open('https://wa.me/9779845266990?text=Hello%20R.N%20Readymade!%20I%20need%20assistance.', '_blank');
            }, 600);
        } else if (action.startsWith('search_')) {
            const category = action.replace('search_', '');
            searchAndDisplayProducts(category);
        }
    }

    function applyCouponDirectly(code) {
        const couponInput = document.getElementById('couponInput');
        if (couponInput) couponInput.value = code;
        const checkoutCoupon = document.getElementById('checkoutCoupon');
        if (checkoutCoupon) checkoutCoupon.value = code;

        RN.showToast({
            message: `Coupon ${code} copied & selected! Open your cart or checkout to see discounts.`,
            type: 'success',
            actionText: 'Open Cart',
            onAction: () => {
                if (typeof openCart === 'function') openCart();
            }
        });
    }

    function searchAndDisplayProducts(keyword) {
        const products = (typeof getProducts === 'function') ? getProducts() : [];
        const matches = products.filter(p => {
            const name = (p.name || '').toLowerCase();
            const cat = (p.category || '').toLowerCase();
            const col = (p.collection || []).join(' ').toLowerCase();
            const desc = (p.description || '').toLowerCase();
            const kw = keyword.toLowerCase();
            return name.includes(kw) || cat.includes(kw) || col.includes(kw) || desc.includes(kw);
        }).slice(0, 3);

        if (!matches.length) {
            botReply(`I couldn't find exact items matching "${keyword}". Try searching for Men, Women, Kids, Denim, or Dresses.`);
            return;
        }

        const cardsHtml = matches.map(p => {
            const img = p.images?.[0] || p.image || '';
            const price = (typeof formatPrice === 'function') ? formatPrice(p.price) : `Rs. ${p.price}`;
            return `
                <div class="rn-chat-product-item">
                    <img src="${img}" alt="${RN.escapeHtml(p.name)}" class="rn-chat-prod-thumb" onerror="this.style.display='none'">
                    <div class="rn-chat-prod-info">
                        <div class="rn-chat-prod-name">${RN.escapeHtml(p.name)}</div>
                        <div class="rn-chat-prod-price">${price} ${p.discount ? `<span style="color:#27ae60;font-size:0.75rem">${p.discount}% OFF</span>` : ''}</div>
                        <button type="button" class="rn-chat-prod-btn" data-view-product="${p.id}">View Details</button>
                    </div>
                </div>
            `;
        }).join('');

        botReply(`Here are top styles for you:`, `<div class="rn-chat-product-list">${cardsHtml}</div>`);
    }

    function processUserQuery(query) {
        const q = query.toLowerCase().trim();

        // Check for Order ID pattern
        if (q.startsWith('rn') || /^\d{6,}$/.test(q)) {
            const orders = (typeof getOrders === 'function') ? getOrders() : [];
            const match = orders.find(o => o.orderId?.toLowerCase() === q || o.orderId?.toLowerCase().includes(q));
            if (match) {
                const statusLbl = (typeof getOrderStatusLabel === 'function') ? getOrderStatusLabel(match.status) : match.status;
                const total = (typeof formatPrice === 'function') ? formatPrice(match.total) : `Rs. ${match.total}`;
                botReply(
                    `Found your order <strong>${match.orderId}</strong>:`,
                    `<div class="rn-chat-card">
                        <div class="rn-chat-card-header">
                            <span>Status</span>
                            <span class="status-pill ${match.status || 'pending'}">${statusLbl}</span>
                        </div>
                        <p style="margin:4px 0;font-size:0.82rem"><strong>Customer:</strong> ${match.customerName || '—'}</p>
                        <p style="margin:4px 0;font-size:0.82rem"><strong>Total:</strong> ${total}</p>
                        <p style="margin:4px 0;font-size:0.82rem"><strong>Delivery:</strong> ${[match.address, match.city, match.state].filter(Boolean).join(', ')}</p>
                    </div>`
                );
                return;
            }
        }

        // Keywords detection
        if (q.includes('order') || q.includes('track') || q.includes('delivery status')) {
            handleQuickAction('track_order', 'Track Order');
        } else if (q.includes('coupon') || q.includes('discount') || q.includes('promo') || q.includes('offer')) {
            handleQuickAction('show_coupons', 'Discount Coupons');
        } else if (q.includes('store') || q.includes('location') || q.includes('address') || q.includes('time') || q.includes('hour') || q.includes('birgunj')) {
            handleQuickAction('store_info', 'Store Info');
        } else if (q.includes('whatsapp') || q.includes('contact') || q.includes('phone') || q.includes('call') || q.includes('owner') || q.includes('manager')) {
            handleQuickAction('whatsapp_support', 'WhatsApp');
        } else if (q.includes('size') || q.includes('fit') || q.includes('measurement')) {
            botReply(
                `📏 Need sizing assistance? Most of our items follow standard South Asian regular fits.`,
                `<div class="rn-chat-card">
                    <p style="font-size:0.82rem"><strong>Quick Size Guide:</strong></p>
                    <p style="font-size:0.8rem;color:var(--color-muted)">• <strong>S:</strong> Chest 36-38" · Waist 28-30"<br>• <strong>M:</strong> Chest 38-40" · Waist 31-33"<br>• <strong>L:</strong> Chest 40-42" · Waist 34-36"<br>• <strong>XL:</strong> Chest 42-44" · Waist 37-39"</p>
                </div>`
            );
        } else if (q.includes('payment') || q.includes('esewa') || q.includes('khalti') || q.includes('cod') || q.includes('card')) {
            botReply(`We support <strong>Cash on Delivery (COD)</strong> throughout Nepal, instant <strong>eSewa QR</strong> payment, <strong>Khalti</strong>, and Debit/Credit cards at checkout.`);
        } else if (q.includes('return') || q.includes('refund') || q.includes('exchange')) {
            botReply(`We offer a hassle-free <strong>7-day return/exchange policy</strong> on unworn items with original tags. Contact us on WhatsApp to initiate an exchange.`);
        } else if (q.includes('jacket') || q.includes('shirt') || q.includes('tee') || q.includes('dress') || q.includes('pant') || q.includes('shorts') || q.includes('men') || q.includes('women') || q.includes('kid') || q.includes('summer')) {
            searchAndDisplayProducts(q);
        } else {
            botReply(`Thanks for reaching out! You can ask me to find products, check discounts, track orders, or view store details.`);
        }
    }

    RN.openChat = function () {
        createChatUI();
        chatModal?.classList.add('open');
        chatModal?.setAttribute('aria-hidden', 'false');
        chatInput?.focus();
    };

    RN.closeChat = function () {
        chatModal?.classList.remove('open');
        chatModal?.setAttribute('aria-hidden', 'true');
    };

    RN.toggleChat = function () {
        if (!chatModal || !chatModal.classList.contains('open')) {
            RN.openChat();
        } else {
            RN.closeChat();
        }
    };

    // Attach to existing live-chat button on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelector('.live-chat-btn')?.addEventListener('click', RN.toggleChat);
    });
})();
