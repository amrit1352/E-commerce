const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const { authAdmin } = require('../middleware/auth');

const router = express.Router();

function signToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
}

router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
        if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = signToken({ id: admin._id, role: 'admin', email: admin.email });
        res.json({ token, admin: { name: admin.name, email: admin.email, role: admin.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password required' });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Invalid email' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const exists = await Customer.findOne({ email: email.toLowerCase() });
        if (exists) return res.status(409).json({ error: 'Email already registered' });

        const passwordHash = await bcrypt.hash(password, 12);
        const customer = await Customer.create({
            name: validator.escape(name.trim()),
            email: email.toLowerCase().trim(),
            phone: phone || '',
            passwordHash
        });

        const token = signToken({ id: customer._id, role: 'customer', email: customer.email });
        res.status(201).json({
            token,
            user: { name: customer.name, email: customer.email, phone: customer.phone }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const customer = await Customer.findOne({ email: (email || '').toLowerCase().trim() });
        if (!customer) return res.status(401).json({ error: 'Invalid email or password' });

        const valid = await bcrypt.compare(password, customer.passwordHash);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

        const token = signToken({ id: customer._id, role: 'customer', email: customer.email });
        res.json({
            token,
            user: { name: customer.name, email: customer.email, phone: customer.phone }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/admin/me', authAdmin, async (req, res) => {
    const admin = await Admin.findById(req.admin.id).select('-passwordHash');
    res.json(admin);
});

module.exports = router;
