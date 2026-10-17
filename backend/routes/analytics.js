const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { authAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authAdmin, async (_req, res) => {
    try {
        const [totalProducts, totalOrders, customers, revenueAgg, visitors] = await Promise.all([
            Product.countDocuments(),
            Order.countDocuments(),
            Customer.countDocuments(),
            Order.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            Promise.resolve(Number(process.env.VISITOR_COUNT || 1247))
        ]);

        res.json({
            totalProducts,
            totalOrders,
            totalCustomers: customers,
            revenue: revenueAgg[0]?.total || 0,
            visitors
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/revenue', authAdmin, async (_req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const daily = await Order.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(daily);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/top-products', authAdmin, async (_req, res) => {
    try {
        const top = await Product.find()
            .sort({ soldThisMonth: -1 })
            .limit(10)
            .select('name soldThisMonth price category images');
        res.json(top);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
