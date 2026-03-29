import express from 'express';
import * as productController from '../controllers/productController.js';

const router = express.Router();

router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/stats', productController.getProductStats);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/:id', productController.getProduct);

export default router;
