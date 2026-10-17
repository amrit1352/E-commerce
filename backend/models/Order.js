const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: String,
    name: String,
    price: Number,
    qty: Number,
    size: String,
    color: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true, required: true },
    customerName: String,
    customerPhone: String,
    userEmail: String,
    txnId: String,
    paymentMethod: { type: String, enum: ['cod', 'esewa', 'khalti', 'card'], default: 'esewa' },
    address: String,
    city: String,
    state: String,
    zipCode: String,
    landmark: String,
    items: [orderItemSchema],
    subtotal: Number,
    shipping: Number,
    tax: Number,
    discount: Number,
    couponCode: String,
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'packed', 'shipped', 'out-for-delivery', 'delivered', 'cancelled'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
