import Product from '../models/Product.js';

export const getProducts = async (req, res) => {
    try {
        const { category, search, sort, page = 1, limit = 10, minPrice, maxPrice } = req.query;

        let query = { isActive: true };

        // Filter by category
        if (category) query.category = category;

        // Search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Price filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Sorting
        let sortOption = {};
        if (sort === 'price-low') sortOption = { price: 1 };
        else if (sort === 'price-high') sortOption = { price: -1 };
        else if (sort === 'rating') sortOption = { rating: -1 };
        else if (sort === 'newest') sortOption = { createdAt: -1 };
        else sortOption = { featured: -1, createdAt: -1 };

        const skip = (page - 1) * limit;

        const products = await Product.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            count: products.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('createdBy', 'name email');
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFeaturedProducts = async (req, res) => {
    try {
        const products = await Product.find({ featured: true, isActive: true }).limit(6);
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const products = await Product.find({ category, isActive: true }).sort({ rating: -1 });
        
        res.json({
            success: true,
            category,
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProductStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments({ isActive: true });
        const categories = await Product.distinct('category');
        const avgRating = await Product.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);

        res.json({
            success: true,
            stats: {
                totalProducts,
                categories,
                avgRating: avgRating[0]?.avgRating || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
