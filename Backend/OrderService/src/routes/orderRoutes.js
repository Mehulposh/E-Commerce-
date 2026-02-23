import express from 'express'
import {
    payOrder,
    CancelOrder,
    updateOrderStatus,
    getOrderByID,
    getOrder,
    createOrders
} from '../cotrollers/orderController.js'

import {
    protect,
    restrictTo
} from '../middlewares/authMiddleware.js'

const router = express.Router()

// All order routes require authentication
router.use(protect);

router.post('/', createOrders);
router.get('/', getOrder);
router.get('/:id', getOrderByID);
router.post('/:id/cancel', CancelOrder);
router.post('/:id/pay', payOrder);

// Admin only
router.patch('/:id/status', restrictTo('admin'), updateOrderStatus);

export default router