require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const { sanitizeBody } = require('./middleware/validate');

const app = express();
const PORT = process.env.PORT || 5000;

const corsOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);

app.use(helmet({
    contentSecurityPolicy: false // Disable CSP to allow fonts/CDN assets to load on the frontend
}));
app.use(cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(mongoSanitize());
app.use(sanitizeBody);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/analytics', require('./routes/analytics'));

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', store: 'R.N Readymade' });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../')));

async function ensureAdmin() {
    const email = process.env.ADMIN_EMAIL || 'admin@rnreadymade.com';
    const password = process.env.ADMIN_PASSWORD || 'Rn@2026';
    const existing = await Admin.findOne({ email });
    if (!existing) {
        const passwordHash = await bcrypt.hash(password, 12);
        await Admin.create({ email, passwordHash, name: 'R.N Admin', role: 'superadmin' });
        console.log('Default admin created:', email);
    }
}

async function start() {
    await connectDB();
    await ensureAdmin();
    app.listen(PORT, () => console.log(`R.N API running on port ${PORT}`));
}

start().catch(err => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
});
