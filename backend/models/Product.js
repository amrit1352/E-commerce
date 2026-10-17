const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    name: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    date: { type: Date, default: Date.now }
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 200 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: ['men', 'women', 'children'], default: 'men' },
    collection: [{ type: String }],
    stock: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 99 },
    soldThisMonth: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    images: [{ type: String }],
    sizes: [{ type: String }],
    colors: [{ name: String, hex: String }],
    description: { type: String, default: '' },
    reviews: [reviewSchema],
    featured: { type: Boolean, default: false },
    legacyId: String
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
