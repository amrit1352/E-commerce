/**
 * profile.js — User Profile & Lifestyle Hub, Loyalty Coins & Rewards, Address Book, and Settings
 * R.N Readymade
 */
window.RN = window.RN || {};

(function () {
    const PROFILE_KEY = 'rn_user_profile';
    const ADDRESSES_KEY = 'rn_user_addresses';
    const REWARDS_KEY = 'rn_user_rewards';
    const NOTIFICATIONS_KEY = 'rn_notifications';

    // ── Default Rewards State ──────────────────────────────
    const DEFAULT_REWARDS = {
        coins: 150,
        tier: 'Gold VIP',
        streak: 3,
        lastCheckIn: null,
        history: [
            { id: 'h1', desc: 'Welcome Bonus', coins: '+100', date: '2026-08-25' },
            { id: 'h2', desc: 'First Order Reward', coins: '+50', date: '2026-08-28' }
        ]
    };

    // ── Default Addresses ──────────────────────────────────
    const DEFAULT_ADDRESSES = [
        {
            id: 'addr_1',
            type: 'Home',
            name: 'Primary Residence',
            recipient: 'Amrit Prasad Sah',
            phone: '9829192619',
            street: 'Maisthan Chowk, Ward 6',
            city: 'Birgunj',
            state: 'Madhesh Province',
            zip: '44300',
            isDefault: true
        }
    ];

    // ── Notifications Data ─────────────────────────────────
    const DEFAULT_NOTIFICATIONS = [
        {
            id: 'notif_1',
            title: '🔥 Flash Sale Live!',
            message: 'Get 20% off on all Summer collections with code SUMMER20.',
            time: '10m ago',
            read: false,
            type: 'promo'
        },
        {
            id: 'notif_2',
            title: '📦 Order Status Update',
            message: 'Your recent order #RN88208398 is being prepared with premium packaging.',
            time: '2h ago',
            read: false,
            type: 'order'
        },
        {
            id: 'notif_3',
            title: '🎉 Coins Credited!',
            message: 'You earned 50 RN Loyalty Coins on your recent purchase.',
            time: '1d ago',
            read: true,
            type: 'rewards'
        }
    ];

    // ── Profile Helpers ────────────────────────────────────
    RN.getProfile = () => {
        let user = null;
        try {
            user = RN.parseJSON(RN.storage.getItem(RN.CONFIG.STORAGE_KEYS.USER), null);
        } catch {
            user = null;
        }
        return user;
    };

    RN.getRewards = () => {
        try {
            const data = RN.parseJSON(RN.storage.getItem(REWARDS_KEY), null);
            return data || DEFAULT_REWARDS;
        } catch {
            return DEFAULT_REWARDS;
        }
    };

    RN.saveRewards = (rewards) => {
        RN.storage.setItem(REWARDS_KEY, JSON.stringify(rewards));
        RN.updateRewardsUI();
    };

    RN.getAddresses = () => {
        try {
            const list = RN.parseJSON(RN.storage.getItem(ADDRESSES_KEY), null);
            return (Array.isArray(list) && list.length) ? list : DEFAULT_ADDRESSES;
        } catch {
            return DEFAULT_ADDRESSES;
        }
    };

    RN.saveAddresses = (addresses) => {
        RN.storage.setItem(ADDRESSES_KEY, JSON.stringify(addresses));
        RN.renderAddressBook();
    };

    RN.getNotifications = () => {
        try {
            const list = RN.parseJSON(RN.storage.getItem(NOTIFICATIONS_KEY), null);
            return (Array.isArray(list) && list.length) ? list : DEFAULT_NOTIFICATIONS;
        } catch {
            return DEFAULT_NOTIFICATIONS;
        }
    };

    RN.saveNotifications = (notifs) => {
        RN.storage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
        RN.updateNotificationsUI();
    };

    // ── Daily Check-in Streak ──────────────────────────────
    RN.dailyCheckIn = () => {
        const rewards = RN.getRewards();
        const today = new Date().toDateString();

        if (rewards.lastCheckIn === today) {
            if (RN.showToast) {
                RN.showToast({
                    message: "You have already claimed today's check-in bonus! Come back tomorrow 🎉",
                    type: 'info'
                });
            }
            return;
        }

        rewards.coins += 20;
        rewards.streak = (rewards.streak || 0) + 1;
        rewards.lastCheckIn = today;
        rewards.history.unshift({
            id: 'h_' + Date.now(),
            desc: `Day ${rewards.streak} Check-in Streak`,
            coins: '+20',
            date: new Date().toISOString().split('T')[0]
        });

        RN.saveRewards(rewards);

        if (RN.showToast) {
            RN.showToast({
                message: `✨ +20 RN Coins Claimed! Your streak is now ${rewards.streak} days 🔥`,
                type: 'success'
            });
        }
    };

    // ── Open / Close Profile Modal ─────────────────────────
    RN.openProfileModal = (initialTab = 'overview') => {
        const user = RN.getProfile();
        if (!user) {
            if (RN.showToast) {
                RN.showToast({
                    message: 'Please sign in or create an account to view your Profile & Rewards!',
                    type: 'info',
                    actionText: 'Sign In',
                    onAction: () => {
                        const authModal = document.querySelector('.auth-modal');
                        if (authModal) authModal.classList.add('open');
                    }
                });
            }
            const authModal = document.querySelector('.auth-modal');
            if (authModal) authModal.classList.add('open');
            return;
        }

        const modal = document.getElementById('profileModal');
        if (!modal) return;

        RN.renderProfileOverview();
        RN.renderAddressBook();
        RN.switchProfileTab(initialTab);
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    RN.closeProfileModal = () => {
        const modal = document.getElementById('profileModal');
        if (modal) modal.classList.remove('open');
        document.body.style.overflow = '';
    };

    RN.switchProfileTab = (tabId) => {
        document.querySelectorAll('.profile-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        document.querySelectorAll('.profile-tab-content').forEach(pane => {
            pane.classList.toggle('active', pane.id === `profileTab_${tabId}`);
        });
    };

    // ── Render Profile UI ──────────────────────────────────
    RN.renderProfileOverview = () => {
        const user = RN.getProfile() || { name: 'Fashion Enthusiast', email: 'guest@rnreadymade.com', phone: '98XXXXXXXX' };
        const rewards = RN.getRewards();

        // Update header elements
        const nameEl = document.getElementById('profileUserName');
        const emailEl = document.getElementById('profileUserEmail');
        const phoneEl = document.getElementById('profileUserPhone');
        const avatarEl = document.getElementById('profileAvatarLetter');
        const coinsEl = document.getElementById('profileCoinCount');
        const tierEl = document.getElementById('profileTierBadge');
        const streakEl = document.getElementById('profileStreakDays');
        const checkinBtn = document.getElementById('profileCheckinBtn');

        if (nameEl) nameEl.textContent = user.name || 'Member';
        if (emailEl) emailEl.textContent = user.email || '';
        if (phoneEl) phoneEl.textContent = user.phone || 'Not provided';
        if (avatarEl) avatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
        if (coinsEl) coinsEl.textContent = rewards.coins || 0;
        if (tierEl) tierEl.textContent = rewards.tier || 'Gold VIP';
        if (streakEl) streakEl.textContent = `${rewards.streak || 1} Days`;

        if (checkinBtn) {
            const today = new Date().toDateString();
            if (rewards.lastCheckIn === today) {
                checkinBtn.innerHTML = '<i class="fa-solid fa-check"></i> Checked in Today';
                checkinBtn.disabled = true;
                checkinBtn.classList.add('claimed');
            } else {
                checkinBtn.innerHTML = '<i class="fa-solid fa-gift"></i> Claim Daily +20 Coins';
                checkinBtn.disabled = false;
                checkinBtn.classList.remove('claimed');
            }
        }

        // Settings form values
        const editName = document.getElementById('settingEditName');
        const editEmail = document.getElementById('settingEditEmail');
        const editPhone = document.getElementById('settingEditPhone');
        if (editName) editName.value = user.name || '';
        if (editEmail) editEmail.value = user.email || '';
        if (editPhone) editPhone.value = user.phone || '';

        // Rewards history table
        const histEl = document.getElementById('profileRewardsHistory');
        if (histEl && rewards.history) {
            histEl.innerHTML = rewards.history.map(item => `
                <div class="reward-history-item">
                    <div class="reward-hist-info">
                        <span class="reward-hist-desc">${RN.escapeHtml(item.desc)}</span>
                        <span class="reward-hist-date">${RN.escapeHtml(item.date)}</span>
                    </div>
                    <span class="reward-hist-coins ${item.coins.startsWith('+') ? 'plus' : 'minus'}">${RN.escapeHtml(item.coins)}</span>
                </div>
            `).join('');
        }
    };

    RN.updateRewardsUI = () => {
        const rewards = RN.getRewards();
        document.querySelectorAll('.user-coin-badge').forEach(el => {
            el.textContent = rewards.coins;
        });
    };

    // ── Render Address Book ────────────────────────────────
    RN.renderAddressBook = () => {
        const listEl = document.getElementById('addressBookList');
        if (!listEl) return;

        const addresses = RN.getAddresses();
        listEl.innerHTML = addresses.map(addr => `
            <div class="address-card ${addr.isDefault ? 'is-default' : ''}" data-id="${addr.id}">
                <div class="address-card-header">
                    <span class="address-type-tag"><i class="fa-solid fa-${addr.type === 'Office' ? 'building' : 'house'}"></i> ${RN.escapeHtml(addr.type || 'Home')}</span>
                    ${addr.isDefault ? '<span class="default-badge">Default</span>' : `<button class="make-default-btn" onclick="RN.setDefaultAddress('${addr.id}')">Set Default</button>`}
                </div>
                <div class="address-card-body">
                    <strong>${RN.escapeHtml(addr.recipient || '')}</strong>
                    <p>${RN.escapeHtml(addr.street || '')}, ${RN.escapeHtml(addr.city || '')}</p>
                    <p>${RN.escapeHtml(addr.state || '')} — ${RN.escapeHtml(addr.zip || '')}</p>
                    <span class="address-phone"><i class="fa-solid fa-phone"></i> ${RN.escapeHtml(addr.phone || '')}</span>
                </div>
                <div class="address-card-actions">
                    <button class="address-delete-btn" onclick="RN.deleteAddress('${addr.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    };

    RN.setDefaultAddress = (id) => {
        const list = RN.getAddresses().map(a => ({ ...a, isDefault: a.id === id }));
        RN.saveAddresses(list);
        if (RN.showToast) RN.showToast({ message: 'Default delivery address updated!', type: 'success' });
    };

    RN.deleteAddress = (id) => {
        const list = RN.getAddresses().filter(a => a.id !== id);
        RN.saveAddresses(list);
        if (RN.showToast) RN.showToast({ message: 'Address removed.', type: 'info' });
    };

    RN.addNewAddress = (e) => {
        e.preventDefault();
        const type = document.getElementById('newAddrType')?.value || 'Home';
        const recipient = document.getElementById('newAddrRecipient')?.value.trim();
        const phone = document.getElementById('newAddrPhone')?.value.trim();
        const street = document.getElementById('newAddrStreet')?.value.trim();
        const city = document.getElementById('newAddrCity')?.value.trim();
        const state = document.getElementById('newAddrState')?.value.trim();
        const zip = document.getElementById('newAddrZip')?.value.trim();

        if (!recipient || !phone || !street || !city) {
            if (RN.showToast) RN.showToast({ message: 'Please complete all address fields.', type: 'warning' });
            return;
        }

        const addresses = RN.getAddresses();
        const newAddr = {
            id: 'addr_' + Date.now(),
            type,
            recipient,
            phone,
            street,
            city,
            state: state || 'Madhesh Province',
            zip: zip || '44300',
            isDefault: addresses.length === 0
        };

        addresses.push(newAddr);
        RN.saveAddresses(addresses);

        // Reset form & close accordion
        document.getElementById('newAddressForm')?.reset();
        const wrap = document.getElementById('newAddressCollapse');
        if (wrap) wrap.classList.remove('open');

        if (RN.showToast) RN.showToast({ message: '✓ New delivery address saved!', type: 'success' });
    };

    // ── Save Profile Settings ──────────────────────────────
    RN.saveProfileSettings = (e) => {
        e.preventDefault();
        const user = RN.getProfile() || {};
        const name = document.getElementById('settingEditName')?.value.trim();
        const phone = document.getElementById('settingEditPhone')?.value.trim();

        if (!name) {
            if (RN.showToast) RN.showToast({ message: 'Name cannot be blank.', type: 'warning' });
            return;
        }

        user.name = name;
        user.phone = phone;
        RN.storage.setItem(RN.CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));

        // Update nav bar displays
        document.querySelectorAll('.user-name').forEach(el => { el.textContent = name; });
        document.querySelectorAll('.nav-avatar-pill .avatar-initials').forEach(el => { el.textContent = name.charAt(0).toUpperCase(); });

        if (RN.showToast) RN.showToast({ message: '✓ Profile details successfully updated!', type: 'success' });
    };

    // ── Notifications UI ───────────────────────────────────
    RN.updateNotificationsUI = () => {
        const notifs = RN.getNotifications();
        const unread = notifs.filter(n => !n.read).length;
        document.querySelectorAll('.notif-badge').forEach(el => {
            el.textContent = unread;
            el.style.display = unread > 0 ? 'grid' : 'none';
        });

        const listEl = document.getElementById('notificationPopList');
        if (listEl) {
            listEl.innerHTML = notifs.map(n => `
                <div class="notif-pop-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}" onclick="RN.markNotificationRead('${n.id}')">
                    <div class="notif-pop-icon ${n.type}">
                        <i class="fa-solid fa-${n.type === 'order' ? 'box' : (n.type === 'rewards' ? 'coins' : 'bolt')}"></i>
                    </div>
                    <div class="notif-pop-info">
                        <span class="notif-pop-title">${RN.escapeHtml(n.title)}</span>
                        <p class="notif-pop-msg">${RN.escapeHtml(n.message)}</p>
                        <span class="notif-pop-time">${RN.escapeHtml(n.time)}</span>
                    </div>
                </div>
            `).join('');
        }
    };

    RN.markNotificationRead = (id) => {
        const notifs = RN.getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
        RN.saveNotifications(notifs);
    };

    RN.toggleNotificationPopover = () => {
        const pop = document.getElementById('notificationPopover');
        if (pop) pop.classList.toggle('open');
    };

    // ── Auth Synchronization ──────────────────────────────
    RN.syncAuthState = () => {
        const user = RN.getProfile();
        const authBtn = document.querySelector('.auth-open-btn');
        const userMenu = document.querySelector('.user-menu');
        const userNameEls = document.querySelectorAll('.user-name');
        const avatarInitials = document.querySelectorAll('.nav-avatar-pill .avatar-initials');

        if (user && user.name) {
            if (authBtn) authBtn.style.display = 'none';
            if (userMenu) userMenu.classList.remove('is-hidden');
            userNameEls.forEach(el => { el.textContent = user.name.split(' ')[0]; });
            avatarInitials.forEach(el => { el.textContent = user.name.charAt(0).toUpperCase(); });
        } else {
            if (authBtn) authBtn.style.display = 'inline-block';
            if (userMenu) userMenu.classList.add('is-hidden');
        }
    };

    RN.handleAuthSignUp = (name, email, phone, password) => {
        const user = {
            id: 'u_' + Date.now(),
            name,
            email,
            phone: phone || '',
            createdAt: new Date().toISOString()
        };
        RN.storage.setItem(RN.CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
        
        // Grant bonus welcome rewards
        const rewards = RN.getRewards();
        rewards.coins = (rewards.coins || 0) + 100;
        RN.saveRewards(rewards);

        RN.syncAuthState();
        const modal = document.querySelector('.auth-modal');
        if (modal) modal.classList.remove('open');

        if (RN.showToast) {
            RN.showToast({
                message: `🎉 Welcome to R.N Readymade, ${name}! +100 RN Coins credited to your wallet.`,
                type: 'success',
                actionText: 'View Profile',
                onAction: () => RN.openProfileModal()
            });
        }
    };

    RN.handleAuthLogin = (email) => {
        const existingName = email.split('@')[0];
        const formattedName = existingName.charAt(0).toUpperCase() + existingName.slice(1);
        const user = {
            id: 'u_' + Date.now(),
            name: formattedName,
            email,
            phone: '9829192619',
            createdAt: new Date().toISOString()
        };
        RN.storage.setItem(RN.CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
        RN.syncAuthState();

        const modal = document.querySelector('.auth-modal');
        if (modal) modal.classList.remove('open');

        if (RN.showToast) {
            RN.showToast({
                message: `✓ Welcome back, ${formattedName}!`,
                type: 'success',
                actionText: 'My Account',
                onAction: () => RN.openProfileModal()
            });
        }
    };

    RN.handleLogout = () => {
        RN.storage.removeItem(RN.CONFIG.STORAGE_KEYS.USER);
        RN.syncAuthState();
        RN.closeProfileModal();
        if (RN.showToast) {
            RN.showToast({
                message: 'You have been signed out successfully.',
                type: 'info'
            });
        }
    };

    // ── Wire Listeners ─────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        // Tab switching
        document.querySelectorAll('.profile-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                RN.switchProfileTab(btn.dataset.tab);
            });
        });

        // Close button
        document.getElementById('profileModalClose')?.addEventListener('click', RN.closeProfileModal);

        // Daily Check-in
        document.getElementById('profileCheckinBtn')?.addEventListener('click', RN.dailyCheckIn);

        // Address Form
        document.getElementById('newAddressForm')?.addEventListener('submit', RN.addNewAddress);
        document.getElementById('toggleNewAddrBtn')?.addEventListener('click', () => {
            document.getElementById('newAddressCollapse')?.classList.toggle('open');
        });

        // Settings Form
        document.getElementById('profileSettingsForm')?.addEventListener('submit', RN.saveProfileSettings);

        // Auth modal open / close / forms
        document.querySelector('.auth-open-btn')?.addEventListener('click', () => {
            document.querySelector('.auth-modal')?.classList.add('open');
        });
        document.querySelector('.auth-close-btn')?.addEventListener('click', () => {
            document.querySelector('.auth-modal')?.classList.remove('open');
        });

        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('is-active'));
                tab.classList.add('is-active');
                const isSignup = tab.dataset.authTab === 'signup';
                const signupForm = document.getElementById('signupForm');
                const loginForm = document.getElementById('loginForm');
                if (signupForm) signupForm.style.display = isSignup ? 'block' : 'none';
                if (loginForm) loginForm.style.display = isSignup ? 'none' : 'block';
            });
        });

        document.getElementById('signupForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName')?.value.trim();
            const email = document.getElementById('signupEmail')?.value.trim();
            const phone = document.getElementById('signupPhone')?.value.trim();
            const pass = document.getElementById('signupPassword')?.value;
            if (name && email) RN.handleAuthSignUp(name, email, phone, pass);
        });

        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value.trim();
            if (email) RN.handleAuthLogin(email);
        });

        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', RN.handleLogout);
        });

        // Initialize UI & Sync Auth
        RN.syncAuthState();
        RN.updateRewardsUI();
        RN.updateNotificationsUI();
    });

})();

