import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, orderController.createOrder);
router.get('/', protect, orderController.getOrders);
router.get('/stats', protect, orderController.getOrderStats);
router.get('/:id', protect, orderController.getOrder);
router.put('/:id', protect, orderController.updateOrder);
router.delete('/:id', protect, orderController.cancelOrder);

export default router;
