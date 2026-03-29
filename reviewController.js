import Review from '../models/Review.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

export const createReview = async (req, res) => {
    try {
        const { productId, rating, title, comment } = req.body;

        if (!productId || !rating || !title || !comment) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            product: productId,
            user: req.user.id
        });

        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
        }

        const review = await Review.create({
            product: productId,
            user: req.user.id,
            userName: req.user.name,
            rating,
            title,
            comment
        });

        // Update product rating
        const allReviews = await Review.find({ product: productId, isApproved: true });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await Product.findByIdAndUpdate(productId, {
            rating: parseFloat(avgRating.toFixed(1)),
            reviewCount: allReviews.length
        });

        res.status(201).json({ success: true, review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId, isApproved: true })
            .populate('user', 'name avatar')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: reviews.length, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user.id })
            .populate('product', 'name image')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: reviews.length, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
        }

        const { rating, title, comment } = req.body;

        review.rating = rating || review.rating;
        review.title = title || review.title;
        review.comment = comment || review.comment;

        await review.save();

        // Update product rating
        const allReviews = await Review.find({ product: review.product, isApproved: true });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await Product.findByIdAndUpdate(review.product, {
            rating: parseFloat(avgRating.toFixed(1))
        });

        res.json({ success: true, review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
        }

        const productId = review.product;
        await Review.findByIdAndDelete(req.params.id);

        // Update product rating
        const allReviews = await Review.find({ product: productId, isApproved: true });
        const avgRating = allReviews.length > 0 
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
            : 0;

        await Product.findByIdAndUpdate(productId, {
            rating: parseFloat(avgRating.toFixed(1)),
            reviewCount: allReviews.length
        });

        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
