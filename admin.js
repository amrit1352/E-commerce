const ADMIN_ID = 'rnadmin';
const ADMIN_PASS = 'Rn@2026';
const ADMIN_SESSION_KEY = 'rn_admin_session';

const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');
const adminLoginForm = document.getElementById('adminLoginForm');
const loginMsg = document.getElementById('loginMsg');
const logoutAdminBtn = document.getElementById('logoutAdminBtn');
const addProductForm = document.getElementById('addProductForm');
const addMsg = document.getElementById('addMsg');
const productTableBody = document.getElementById('productTableBody');
const ordersTableBody = document.getElementById('ordersTableBody');
const stockSummary = document.getElementById('stockSummary');

function isAdminLoggedIn() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

function showPanel() {
    loginScreen.classList.add('is-hidden');
    adminPanel.classList.remove('is-hidden');
    renderProducts();
    renderOrders();
}

function showLogin() {
    loginScreen.classList.remove('is-hidden');
    adminPanel.classList.add('is-hidden');
}

function stockBadge(stock) {
    if (stock <= 0) return '<span class="stock-badge out-stock">Out of Stock</span>';
    if (stock <= 5) return `<span class="stock-badge low-stock">${stock} left</span>`;
    return `<span class="stock-badge in-stock">${stock} in stock</span>`;
}

function renderProducts() {
    const products = getProducts();
    productTableBody.innerHTML = '';

    let inStock = 0;
    let outStock = 0;

    products.forEach(p => {
        if (p.stock > 0) inStock++;
        else outStock++;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td>${p.category}</td>
            <td>${formatPrice(p.price)}</td>
            <td>${stockBadge(p.stock)}</td>
            <td>${(p.collection || []).join(', ') || '—'}</td>
            <td>
                <div class="table-actions">
                    <button type="button" data-action="edit-stock" data-id="${p.id}">Edit Stock</button>
                    <button type="button" class="delete-btn" data-action="delete" data-id="${p.id}">Delete</button>
                </div>
            </td>
        `;
        productTableBody.appendChild(tr);
    });

    stockSummary.textContent = `${products.length} products · ${inStock} in stock · ${outStock} out of stock`;
}

function renderOrders() {
    const orders = getOrders();
    ordersTableBody.innerHTML = '';

    if (orders.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#7c8a96;">No orders yet</td></tr>';
        return;
    }

    orders.slice(0, 20).forEach(o => {
        const tr = document.createElement('tr');
        const address = [o.address, o.city, o.state, o.zipCode].filter(Boolean).join(', ');
        const deliveryText = address || o.deliveryAddress || 'Address not provided';
        tr.innerHTML = `
            <td>${o.orderId}</td>
            <td>${o.customerName || 'Guest'}</td>
            <td>${formatPrice(o.total)}</td>
            <td>${o.txnId || '—'}</td>
            <td>${o.customerPhone || '—'}</td>
            <td>${deliveryText}</td>
            <td>
                <select class="order-status-select" data-order-id="${o.orderId}">
                    <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending Confirmation</option>
                    <option value="packed" ${o.status === 'packed' ? 'selected' : ''}>Packed & Ready</option>
                    <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="out-for-delivery" ${o.status === 'out-for-delivery' ? 'selected' : ''}>Out for Delivery</option>
                    <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>${new Date(o.date).toLocaleString()}</td>
        `;
        ordersTableBody.appendChild(tr);
    });
}

adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('adminId').value.trim();
    const pass = document.getElementById('adminPass').value;

    if (id === ADMIN_ID && pass === ADMIN_PASS) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        loginMsg.textContent = '';
        showPanel();
    } else {
        loginMsg.textContent = 'Invalid Admin ID or Password.';
        loginMsg.className = 'admin-msg error';
    }
});

logoutAdminBtn.addEventListener('click', () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    showLogin();
});

addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('prodName').value.trim();
    const price = Number(document.getElementById('prodPrice').value) || 0;
    const category = document.getElementById('prodCategory').value;
    const stock = Number(document.getElementById('prodStock').value) || 0;
    const imageUrls = (document.getElementById('prodImageUrls').value || '').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const fileInput = document.getElementById('prodImages');
    const sizes = (document.getElementById('prodSizes').value || '').split(',').map(s=>s.trim()).filter(Boolean);
    const colorsRaw = (document.getElementById('prodColors').value || '')
        .split(/\r?\n|,/)
        .map(s=>s.trim())
        .filter(Boolean);
    const colors = colorsRaw.map(c => {
        const [n, hex] = c.split(':').map(x=>x.trim());
        return { name: n || '', hex: hex || '#cccccc' };
    });
    const discount = Number(document.getElementById('prodDiscount').value) || 0;
    const description = document.getElementById('prodDescription').value.trim() || '';
    const collection = Array.from(document.querySelectorAll('input[name="prodCollection"]:checked')).map(c => c.value);

    if (!name || !price) {
        addMsg.textContent = 'Name and price are required.';
        addMsg.className = 'admin-msg error';
        return;
    }

    // read uploaded files as data URLs (if any)
    let uploaded = [];
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const readers = Array.from(fileInput.files).map(f => new Promise(res => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result);
            fr.onerror = () => res(null);
            fr.readAsDataURL(f);
        }));
        try { uploaded = (await Promise.all(readers)).filter(Boolean); } catch (err) { console.warn('file read failed', err); }
    }

    const images = [...imageUrls, ...uploaded];

    const payload = { name, price, category, stock, collection, images, sizes, colors, discount, description };

    addProduct(payload);
    addProductForm.reset();
    addMsg.textContent = `"${name}" added to database successfully!`;
    addMsg.className = 'admin-msg success';
    renderProducts();
});

productTableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'delete') {
        if (confirm('Delete this product from database?')) {
            deleteProduct(id);
            renderProducts();
        }
    }

    if (action === 'edit-stock') {
        const product = getProductById(id);
        if (!product) return;
        const newStock = prompt(`Update stock for "${product.name}":`, product.stock);
        if (newStock === null) return;
        const qty = parseInt(newStock, 10);
        if (Number.isNaN(qty) || qty < 0) {
            alert('Enter a valid stock number (0 or more).');
            return;
        }
        updateProduct(id, { stock: qty });
        renderProducts();
    }
});

ordersTableBody.addEventListener('change', (e) => {
    const select = e.target.closest('.order-status-select');
    if (!select) return;
    const orderId = select.dataset.orderId;
    const status = select.value;
    const updatedOrder = updateOrderStatus(orderId, status);
    if (updatedOrder) {
        addMsg.textContent = `Order ${orderId} marked as ${getOrderStatusLabel(status)}.`;
        addMsg.className = 'admin-msg success';
        renderOrders();
    }
});

if (isAdminLoggedIn()) {
    showPanel();
} else {
    showLogin();
}
