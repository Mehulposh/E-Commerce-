import express from 'express'
import {
    initiatePayment,
    getPayment,
    getAllPayments,
    getPaymentByOrder,
    refundPayment
} from '../controllers/PaymentControllers.js'
import { protect, restrictTo } from '../middlewares/authMiddlewares.js'

const router = express.Router()

// Internal route — called by Order Service (no user token)
router.post('/initiate', initiatePayment);

// All routes below require user authentication
router.use(protect);

router.get('/', getAllPayments);
router.get('/order/:orderId', getPaymentByOrder);
router.get('/:id', getPayment);

// Admin only
router.post('/:id/refund', restrictTo('admin'), refundPayment);


export default router