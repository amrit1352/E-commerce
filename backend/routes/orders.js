const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authAdmin, async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;
        const filter = status ? { status } : {};
        const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/track/:orderId', async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json({
            orderId: order.orderId,
            status: order.status,
            total: order.total,
            date: order.createdAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const orderId = 'RN' + Date.now().toString().slice(-8);
        const order = await Order.create({ ...req.body, orderId });

        for (const item of order.items || []) {
            if (item.productId) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: -item.qty, soldThisMonth: item.qty }
                });
            }
        }

        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.patch('/:orderId/status', authAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findOneAndUpdate(
            { orderId: req.params.orderId },
            { status },
            { new: true }
        );
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
