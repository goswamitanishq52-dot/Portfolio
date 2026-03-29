import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a product name'],
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a description']
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
        min: 0
    },
    category: {
        type: String,
        enum: ['coffee', 'pastries', 'specials', 'beverages', 'food'],
        required: true
    },
    image: {
        type: String,
        default: 'https://via.placeholder.com/300'
    },
    images: [String],
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 100
    },
    inStock: {
        type: Boolean,
        default: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    specifications: {
        size: String,
        ingredients: [String],
        allergens: [String]
    },
    tags: [String],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create slug from name
productSchema.pre('save', function(next) {
    if (!this.isModified('name')) return next();
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
    this.inStock = this.stock > 0;
    next();
});

export default mongoose.model('Product', productSchema);
