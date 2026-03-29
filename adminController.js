import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Review from '../models/Review.js';

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock, specifications, image } = req.body;

        if (!name || !description || !price || !category) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            stock: stock || 100,
            specifications,
            image: image || 'https://via.placeholder.com/300',
            createdBy: req.user.id
        });

        res.status(201).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, message: 'Product deleted successfully', product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAdminDashboard = async (req, res) => {
    try {
        const totalSales = await Order.aggregate([
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const totalOrders = await Order.countDocuments();
        const totalProducts = await Product.countDocuments({ isActive: true });
        const totalUsers = await User.countDocuments();

        const recentOrders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(10);

        const topProducts = await Product.find({ isActive: true })
            .sort({ reviewCount: -1 })
            .limit(5);

        res.json({
            success: true,
            dashboard: {
                totalSales: totalSales[0]?.total || 0,
                totalOrders,
                totalProducts,
                totalUsers,
                recentOrders,
                topProducts
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        let query = {};
        if (status) query.status = status;

        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            count: orders.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            orders
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: new Date() },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const approveReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { isApproved: true },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.json({ success: true, review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const report = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    totalSales: { $sum: '$total' },
                    orders: { $sum: 1 },
                    avgOrder: { $avg: '$total' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ success: true, report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
