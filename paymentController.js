import Order from '../models/Order.js';

/**
 * Process payment and update order status
 * In production, this would integrate with Stripe
 */
export const processPayment = async (req, res) => {
    try {
        const { orderId, paymentMethod, stripeTokenId } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Simulate payment processing
        // In production: integrate with Stripe API
        
        order.paymentStatus = 'completed';
        order.paymentMethod = paymentMethod;
        order.paymentId = stripeTokenId || `MOCK-${Date.now()}`;
        order.status = 'confirmed';
        
        // Add timeline entry
        order.timeline.push({
            status: 'confirmed',
            message: 'Payment received and order confirmed'
        });

        await order.save();

        res.json({
            success: true,
            message: 'Payment processed successfully',
            order
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({
            success: true,
            orderId,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            total: order.total
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const refundPayment = async (req, res) => {
    try {
        const { orderId, reason } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentStatus !== 'completed') {
            return res.status(400).json({ success: false, message: 'Order has not been paid' });
        }

        order.paymentStatus = 'refunded';
        order.timeline.push({
            status: 'refunded',
            message: `Refund issued. Reason: ${reason || 'No reason provided'}`
        });

        await order.save();

        res.json({
            success: true,
            message: 'Payment refunded successfully',
            order
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPaymentHistory = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.id,
            paymentStatus: { $in: ['completed', 'refunded'] }
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
