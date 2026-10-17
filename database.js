const PRODUCTS_KEY = 'rn_products';
const ORDERS_KEY = 'rn_orders';

const STORAGE_AVAILABLE = (() => {
    try {
        localStorage.setItem('__rn_storage_test__', '1');
        localStorage.removeItem('__rn_storage_test__');
        return true;
    } catch {
        return false;
    }
})();

const safeStorage = {
    getItem(key) {
        if (!STORAGE_AVAILABLE) return null;
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem(key, value) {
        if (!STORAGE_AVAILABLE) return;
        try {
            localStorage.setItem(key, value);
        } catch {
            // Ignore storage errors so the site remains functional.
        }
    },
    removeItem(key) {
        if (!STORAGE_AVAILABLE) return;
        try {
            localStorage.removeItem(key);
        } catch {
            // Ignore storage errors.
        }
    }
};

// Self-heal: if stored products is null/corrupt, clear it so it resets to defaults
(function healStorage() {
    try {
        const raw = localStorage.getItem(PRODUCTS_KEY);
        if (raw !== null) {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                localStorage.removeItem(PRODUCTS_KEY);
            }
        }
    } catch {
        try { localStorage.removeItem(PRODUCTS_KEY); } catch {}
    }
})();


const DEFAULT_PRODUCTS = [
    {
        id: 'p1',
        name: 'Classic Denim Jacket',
        price: 5999,
        category: 'men',
        collection: ['bestsellers', 'new'],
        stock: 12,
        discount: 15,
        soldThisMonth: 32,
        rating: 4.8,
        reviewCount: 124,
        images: [
            'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=500',
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=500',
            'https://images.unsplash.com/photo-1521334884684-d80222895322?q=80&w=500'
        ],
        colors: [
            { name: 'Indigo', hex: '#3b5998' },
            { name: 'Charcoal', hex: '#3b3b3b' },
            { name: 'Sand', hex: '#cbb79d' }
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'A premium denim jacket with a classic cut, reinforced stitching, and a warm brushed lining.',
        reviews: [
            { name: 'Rajan', rating: 5, comment: 'Looks great and feels solid. Perfect for cooler evenings.' },
            { name: 'Priya', rating: 4, comment: 'Very comfortable and stylish, the fit is true to size.' }
        ]
    },
    {
        id: 'p2',
        name: 'Premium Cotton Tee',
        price: 2499,
        category: 'men',
        collection: ['bestsellers', 'summer'],
        stock: 25,
        discount: 10,
        soldThisMonth: 58,
        rating: 4.6,
        reviewCount: 78,
        images: [
            'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=500',
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=500'
        ],
        colors: [
            { name: 'White', hex: '#fdfdfd' },
            { name: 'Sand', hex: '#d4b483' },
            { name: 'Black', hex: '#202020' }
        ],
        sizes: ['M', 'L', 'XL'],
        description: 'Soft breathable cotton tee designed to keep you cool during the hot season with a clean, modern silhouette.',
        reviews: [
            { name: 'Sita', rating: 5, comment: 'Soft fabric and great quality. A summer wardrobe staple.' },
            { name: 'Bikram', rating: 4, comment: 'Fit was good, and the color stayed true after washing.' }
        ]
    },
    {
        id: 'p3',
        name: 'Linen Button-Down Shirt',
        price: 3450,
        category: 'men',
        collection: ['new', 'formal'],
        stock: 18,
        discount: 0,
        soldThisMonth: 21,
        rating: 4.5,
        reviewCount: 44,
        images: [
            'https://images.unsplash.com/photo-1520975958225-2d4fcbf0d3e8?q=80&w=500',
            'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=500'
        ],
        colors: [
            { name: 'White', hex: '#f7f3ee' },
            { name: 'Olive', hex: '#8b8c55' }
        ],
        sizes: ['S', 'M', 'L'],
        description: 'Lightweight linen shirt with a tailored fit, ideal for formal and smart casual occasions.',
        reviews: [
            { name: 'Nisha', rating: 5, comment: 'Exactly what I needed for summer events. Feels very breathable.' }
        ]
    },
    {
        id: 'p4',
        name: 'Slim Chino Pants',
        price: 3900,
        category: 'men',
        collection: ['bestsellers', 'formal'],
        stock: 15,
        discount: 20,
        soldThisMonth: 19,
        rating: 4.7,
        reviewCount: 39,
        images: [
            'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=500',
            'https://images.unsplash.com/photo-1520975916090-3b7b5bfcf5a5?q=80&w=500'
        ],
        colors: [
            { name: 'Stone', hex: '#c4b89d' },
            { name: 'Navy', hex: '#39475a' }
        ],
        sizes: ['M', 'L', 'XL'],
        description: 'Tailored slim-fit chinos built for everyday comfort and a polished formal look.',
        reviews: [
            { name: 'Anil', rating: 4, comment: 'Good value for the price. The slim fit is flattering.' }
        ]
    },
    {
        id: 'p5',
        name: 'Classic Bomber Jacket',
        price: 7499,
        category: 'men',
        collection: ['new'],
        stock: 8,
        discount: 25,
        soldThisMonth: 12,
        rating: 4.9,
        reviewCount: 66,
        images: [
            'https://images.unsplash.com/photo-1520975916090-3b7b5bfcf5a5?q=80&w=500',
            'https://images.unsplash.com/photo-1520975916090-7c8c2f0b9a8f?q=80&w=500'
        ],
        colors: [
            { name: 'Olive', hex: '#5f6b50' },
            { name: 'Black', hex: '#1c1c1c' }
        ],
        sizes: ['M', 'L', 'XL'],
        description: 'A refined bomber jacket with a soft lining and classic silhouette, perfect for evenings out.',
        reviews: [
            { name: 'Ramesh', rating: 5, comment: 'Beautiful jacket and good quality. Worth every penny.' }
        ]
    },
    {
        id: 'p6',
        name: 'Floral Summer Dress',
        price: 4500,
        category: 'women',
        collection: ['summer', 'bestsellers'],
        stock: 10,
        discount: 10,
        soldThisMonth: 43,
        rating: 4.5,
        reviewCount: 92,
        images: [
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=500',
            'https://images.unsplash.com/photo-1495121605193-b116b5b9c5d9?q=80&w=500'
        ],
        colors: [
            { name: 'Peach', hex: '#f3b5a3' },
            { name: 'Mint', hex: '#a2d5c6' }
        ],
        sizes: ['S', 'M', 'L'],
        description: 'Flowy floral dress with soft fabric and flattering waist detailing for summer outings.',
        reviews: [
            { name: 'Megha', rating: 5, comment: 'The print and fit are lovely. Very comfortable to wear all day.' }
        ]
    },
    {
        id: 'p7',
        name: 'Satin Evening Dress',
        price: 8900,
        category: 'women',
        collection: ['formal', 'new'],
        stock: 6,
        discount: 18,
        soldThisMonth: 8,
        rating: 4.9,
        reviewCount: 53,
        images: [
            'https://images.unsplash.com/photo-1520975916090-5d2cfcf4b6b8?q=80&w=500',
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=500'
        ],
        colors: [
            { name: 'Champagne', hex: '#d8c4b2' },
            { name: 'Black', hex: '#111' }
        ],
        sizes: ['S', 'M'],
        description: 'Elegant satin evening dress with soft draping and polished detailing for special occasions.',
        reviews: [
            { name: 'Sonal', rating: 5, comment: 'Amazing fabric and sparkle. I received many compliments.' }
        ]
    },
    {
        id: 'p8',
        name: 'Lace Overlay Skirt',
        price: 4950,
        category: 'women',
        collection: ['new'],
        stock: 14,
        discount: 12,
        soldThisMonth: 27,
        rating: 4.4,
        reviewCount: 34,
        images: [
            'https://images.unsplash.com/photo-1520975916090-2d86d9a9c7c4?q=80&w=500',
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=500'
        ],
        colors: [
            { name: 'Ivory', hex: '#f9f2e7' },
            { name: 'Rose', hex: '#d6a8a1' }
        ],
        sizes: ['S', 'M', 'L'],
        description: 'Romantic lace skirt with delicate overlay and comfortable lining for refined styling.',
        reviews: [
            { name: 'Gita', rating: 4, comment: 'Lovely lace and quality material. Matches many tops.' }
        ]
    },
    {
        id: 'p9',
        name: 'Pleated Midi Dress',
        price: 5999,
        category: 'women',
        collection: ['bestsellers', 'formal'],
        stock: 9,
        discount: 20,
        soldThisMonth: 31,
        rating: 4.7,
        reviewCount: 61,
        images: [
            'https://images.unsplash.com/photo-1520975916090-3c7b2b8b1a7a?q=80&w=500',
            'https://images.unsplash.com/photo-1495121605193-b116b5b9c5d9?q=80&w=500'
        ],
        colors: [
            { name: 'Sapphire', hex: '#274472' },
            { name: 'Rose', hex: '#c38d9e' }
        ],
        sizes: ['S', 'M', 'L'],
        description: 'Sophisticated pleated midi dress with a flattering waistline and elegant movement.',
        reviews: [
            { name: 'Uma', rating: 5, comment: 'The pleats fall beautifully and the dress feels luxurious.' }
        ]
    },
    {
        id: 'p10',
        name: 'Wrap-Style Top',
        price: 2999,
        category: 'women',
        collection: ['summer', 'new'],
        stock: 20,
        discount: 0,
        soldThisMonth: 52,
        rating: 4.3,
        reviewCount: 22,
        images: [
            'https://images.unsplash.com/photo-1520975916090-7c8c2f0b9a8f?q=80&w=500',
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=500'
        ],
        colors: [
            { name: 'Blush', hex: '#e6b6b0' },
            { name: 'Mint', hex: '#a7d7cd' }
        ],
        sizes: ['S', 'M', 'L'],
        description: 'Versatile wrap-style top with adjustable tie detail and a soft, comfortable fit.',
        reviews: [
            { name: 'Sarita', rating: 4, comment: 'Easy to style and looks great with jeans or skirts.' }
        ]
    },
    {
        id: 'p11',
        name: 'Kids T-Shirt',
        price: 100,
        category: 'children',
        collection: ['kids', 'bestsellers'],
        stock: 30,
        discount: 5,
        soldThisMonth: 75,
        rating: 4.2,
        reviewCount: 18,
        images: [
            'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=500',
            'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=500'
        ],
        colors: [
            { name: 'Blue', hex: '#85b6ff' },
            { name: 'Green', hex: '#8acc8b' }
        ],
        sizes: ['XS', 'S', 'M'],
        description: 'Soft kids tee with playful styling and durable fabric for everyday wear.',
        reviews: [
            { name: 'Anuj', rating: 4, comment: 'My son loves it. The fabric is gentle and washes well.' }
        ]
    },
    {
        id: 'p12',
        name: 'Kids Denim Shorts',
        price: 350,
        category: 'children',
        collection: ['kids', 'summer'],
        stock: 22,
        discount: 0,
        soldThisMonth: 42,
        rating: 4.1,
        reviewCount: 11,
        images: [
            'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=500',
            'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=500'
        ],
        colors: [
            { name: 'Denim Blue', hex: '#5c7ea3' }
        ],
        sizes: ['XS', 'S', 'M'],
        description: 'Comfortable denim shorts designed for active kids and warm-weather play.',
        reviews: [
            { name: 'Sujan', rating: 4, comment: 'Sturdy and comfortable for the kids. Nice details too.' }
        ]
    },
    {
        id: 'p13',
        name: 'Kids Party Dress',
        price: 850,
        category: 'children',
        collection: ['kids', 'formal'],
        stock: 8,
        discount: 10,
        soldThisMonth: 15,
        rating: 4.6,
        reviewCount: 9,
        images: [
            'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=500',
            'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=500'
        ],
        colors: [
            { name: 'Pink', hex: '#f0aec0' }
        ],
        sizes: ['XS', 'S'],
        description: 'Adorable party dress with soft layers and a twirl-ready silhouette.',
        reviews: [
            { name: 'Mira', rating: 5, comment: 'My daughter looked so pretty in this dress at her birthday party.' }
        ]
    }
];

function generateId() {
    return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getProducts() {
    try {
        const stored = safeStorage.getItem(PRODUCTS_KEY);
        if (!stored) {
            safeStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
            return [...DEFAULT_PRODUCTS];
        }
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [...DEFAULT_PRODUCTS];
    } catch {
        return [...DEFAULT_PRODUCTS];
    }
}

function saveProducts(products) {
    safeStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function getProductById(id) {
    return getProducts().find(p => p.id === id) || null;
}

function addProduct(product) {
    const products = getProducts();
    const newProduct = {
        id: generateId(),
        name: product.name,
        price: Number(product.price) || 0,
        category: product.category || 'men',
        collection: product.collection || [],
        stock: Number(product.stock) || 0,
        // support single image or array of images
        images: product.images && product.images.length ? product.images.slice() : (product.image ? [product.image] : []),
        sizes: product.sizes || [],
        colors: product.colors || [],
        discount: Number(product.discount) || 0,
        soldThisMonth: Number(product.soldThisMonth) || 0,
        rating: typeof product.rating === 'number' ? product.rating : 0,
        reviewCount: Number(product.reviewCount) || 0,
        reviews: product.reviews || [],
        description: product.description || '',
        createdAt: new Date().toISOString()
    };
    products.push(newProduct);
    saveProducts(products);
    return newProduct;
}

function updateProduct(id, updates) {
    const products = getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...updates };
    saveProducts(products);
    return products[index];
}

function deleteProduct(id) {
    const products = getProducts().filter(p => p.id !== id);
    saveProducts(products);
}

function reduceStock(cartItems) {
    const products = getProducts();
    cartItems.forEach(item => {
        const p = products.find(prod => prod.id === item.id);
        if (p) p.stock = Math.max(0, p.stock - item.qty);
    });
    saveProducts(products);
}

function getOrders() {
    try {
        return JSON.parse(safeStorage.getItem(ORDERS_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveOrders(orders) {
    safeStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function saveOrder(order) {
    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);
}

function updateOrderStatus(orderId, status) {
    const orders = getOrders();
    const index = orders.findIndex(order => order.orderId === orderId);
    if (index === -1) return null;
    orders[index].status = normalizeOrderStatus(status);
    orders[index].updatedAt = new Date().toISOString();
    saveOrders(orders);
    return orders[index];
}

function normalizeOrderStatus(status) {
    const value = (status || 'pending').toString().trim().toLowerCase();
    const map = {
        pending: 'pending',
        packed: 'packed',
        shipped: 'shipped',
        'out-for-delivery': 'out-for-delivery',
        out_for_delivery: 'out-for-delivery',
        delivered: 'delivered',
        cancelled: 'cancelled',
        paid: 'pending'
    };
    return map[value] || 'pending';
}

function getOrderStatusLabel(status) {
    const normalized = normalizeOrderStatus(status);
    const labels = {
        pending: 'Pending Confirmation',
        packed: 'Packed & Ready',
        shipped: 'Shipped',
        'out-for-delivery': 'Out for Delivery',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
    };
    return labels[normalized] || 'Pending Confirmation';
}

function formatPrice(amount) {
    return 'Rs. ' + Number(amount).toLocaleString('en-NP');
}
