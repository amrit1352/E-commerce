const express = require('express');
const Customer = require('../models/Customer');
const { authAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authAdmin, async (req, res) => {
    try {
        const customers = await Customer.find()
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', authAdmin, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id).select('-passwordHash');
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    } catch {
        res.status(404).json({ error: 'Customer not found' });
    }
});

module.exports = router;
