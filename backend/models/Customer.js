const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: String,
    passwordHash: { type: String, required: true },
    addresses: [{
        label: String,
        address: String,
        city: String,
        state: String,
        zipCode: String,
        landmark: String,
        isDefault: Boolean
    }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    ordersCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
