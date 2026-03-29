import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: String,
    rating: {
        type: Number,
        required: [true, 'Please provide a rating'],
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: [true, 'Please provide a review title'],
        minlength: 3,
        maxlength: 100
    },
    comment: {
        type: String,
        required: [true, 'Please provide a review comment'],
        minlength: 10,
        maxlength: 1000
    },
    verified: {
        type: Boolean,
        default: false
    },
    helpful: {
        type: Number,
        default: 0
    },
    images: [String],
    isApproved: {
        type: Boolean,
        default: true
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

export default mongoose.model('Review', reviewSchema);
