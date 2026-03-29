import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/process', protect, paymentController.processPayment);
router.get('/status/:orderId', protect, paymentController.getPaymentStatus);
router.post('/refund', protect, paymentController.refundPayment);
router.get('/history', protect, paymentController.getPaymentHistory);

export default router;
