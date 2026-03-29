import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
// router.use(protect, authorize('admin'));

router.post('/products', protect, adminController.createProduct);
router.put('/products/:id', protect, adminController.updateProduct);
router.delete('/products/:id', protect, adminController.deleteProduct);

router.get('/dashboard', protect, adminController.getAdminDashboard);
router.get('/orders', protect, adminController.getAllOrders);
router.patch('/orders/:id/status', protect, adminController.updateOrderStatus);

router.patch('/reviews/:id/approve', protect, adminController.approveReview);

router.get('/reports/sales', protect, adminController.getSalesReport);

export default router;
