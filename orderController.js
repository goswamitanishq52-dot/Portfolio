import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { generateOrderNumber, calculateTax } from '../utils/helpers.js';

export const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, billingAddress, couponCode, notes } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
        }

        if (!shippingAddress) {
            return res.status(400).json({ success: false, message: 'Shipping address is required' });
        }

        // Calculate totals
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
            }

            const itemSubtotal = product.price * item.quantity;
            subtotal += itemSubtotal;

            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                subtotal: itemSubtotal
            });
        }

        const tax = calculateTax(subtotal);
        const shipping = subtotal > 50 ? 0 : 10;
        let discount = 0;

        // Apply discount (simple logic)
        if (couponCode === 'SAVE10') discount = subtotal * 0.1;
        if (couponCode === 'SAVE20') discount = subtotal * 0.2;

        const total = subtotal + tax + shipping - discount;

        // Create order
        const order = await Order.create({
            orderNumber: generateOrderNumber(),
            user: req.user.id,
            items: orderItems,
            subtotal,
            tax,
            shipping,
            discount,
            couponCode,
            total,
            shippingAddress: {
                ...shippingAddress,
                name: req.user.name,
                email: req.user.email
            },
            billingAddress: billingAddress || shippingAddress,
            notes,
            timeline: [{
                status: 'pending',
                message: 'Order created'
            }]
        });

        // Update product stock
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        }

        res.status(201).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('items.product')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: orders.length, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product')
            .populate('user', 'name email phone');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check authorization
        if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateOrder = async (req, res) => {
    try {
        const { status, trackingNumber, estimatedDelivery, notes } = req.body;

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status,
                trackingNumber,
                estimatedDelivery,
                notes,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'pending' && order.status !== 'confirmed') {
            return res.status(400).json({ success: false, message: 'Cannot cancel order with status: ' + order.status });
        }

        // Refund products to stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }

        order.status = 'cancelled';
        order.paymentStatus = 'refunded';
        await order.save();

        res.json({ success: true, message: 'Order cancelled successfully', order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOrderStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments({ user: req.user.id });
        const totalSpent = await Order.aggregate([
            { $match: { user: req.user.id } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const pendingOrders = await Order.countDocuments({ user: req.user.id, status: 'pending' });

        res.json({
            success: true,
            stats: {
                totalOrders,
                totalSpent: totalSpent[0]?.total || 0,
                pendingOrders
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
