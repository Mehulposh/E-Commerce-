import express from 'express';
const  router = express.Router();
import {
    deleteProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    createProduct,
} from '../controllers/productsController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected admin-only routes
router.use(protect);
router.post('/', restrictTo('admin'), createProduct);
router.put('/:id', restrictTo('admin'), updateProduct);
router.delete('/:id', restrictTo('admin'), deleteProduct);

export default router;