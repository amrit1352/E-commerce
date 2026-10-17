const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const Product = require('../models/Product');
const { authAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const {
            category, search, minPrice, maxPrice,
            sort = 'newest', collection, featured, limit = 100
        } = req.query;

        const filter = {};
        if (category) filter.category = category;
        if (collection) filter.collection = collection;
        if (featured === 'true') filter.featured = true;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        if (search) filter.$text = { $search: search };

        const sortMap = {
            priceAsc: { price: 1 },
            priceDesc: { price: -1 },
            newest: { createdAt: -1 },
            popular: { soldThisMonth: -1 },
            nameAsc: { name: 1 }
        };

        const products = await Product.find(filter)
            .sort(sortMap[sort] || sortMap.newest)
            .limit(Math.min(Number(limit) || 100, 200));

        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch {
        res.status(404).json({ error: 'Product not found' });
    }
});

router.post('/', authAdmin, async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', authAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', authAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
