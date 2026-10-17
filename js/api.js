/**
 * Optional API client — syncs with Node/Express backend when available
 */
window.RN = window.RN || {};

RN.api = {
    async request(path, options = {}) {
        const url = `${RN.CONFIG.API_BASE}${path}`;
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        const token = RN.storage.getItem('rn_admin_token') || RN.storage.getItem('rn_user_token');
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(url, { ...options, headers });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    },

    async healthCheck() {
        try {
            await this.request('/health');
            return true;
        } catch {
            return false;
        }
    },

    async fetchProducts(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.request(`/products${qs ? '?' + qs : ''}`);
    },

    async adminLogin(email, password) {
        const data = await this.request('/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        RN.storage.setItem('rn_admin_token', data.token);
        return data;
    },

    async submitOrder(order) {
        return this.request('/orders', { method: 'POST', body: JSON.stringify(order) });
    }
};

RN.initApi = async () => {
    const online = await RN.api.healthCheck();
    document.body.classList.toggle('api-online', online);
    if (online) console.info('R.N API connected');
};
