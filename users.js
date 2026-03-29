import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id', userController.getUserProfile);
router.put('/profile', protect, userController.updateUserProfile);
router.post('/favorites', protect, userController.addFavorite);
router.delete('/favorites', protect, userController.removeFavorite);
router.get('/favorites', protect, userController.getFavorites);

export default router;
