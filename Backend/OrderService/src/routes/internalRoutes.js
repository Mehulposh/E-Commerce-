import express from 'express'
import Order from '../models/order.js'

const router = express.Router()

/**
 * PATCH /api/orders/internal/payment-update
 * Called by Payment Service after payment is processed.
 * Not exposed through Nginx — internal Docker network only.
 */

router.patch('/payment-update', async (req, res) => {
  try {
    const { orderId, paymentStatus, paymentId } = req.body;

    if (!orderId || !paymentStatus) {
      return res.status(400).json({ message: 'orderId and paymentStatus required' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentStatus = paymentStatus;
    if (paymentId) order.paymentId = paymentId;

    // Update order status based on payment result
    if (paymentStatus === 'paid') {
      order.status = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', note: 'Payment confirmed' });
    } else if (paymentStatus === 'failed') {
      order.status = 'cancelled';
      order.statusHistory.push({ status: 'cancelled', note: 'Payment failed' });
    } else if (paymentStatus === 'refunded') {
      order.status = 'refunded';
      order.statusHistory.push({ status: 'refunded', note: 'Payment refunded' });
    }

    await order.save();
    res.json({ message: 'Order payment status updated', order });
  } catch (err) {
    console.error('[Order Internal] Payment update error:', err.message);
    res.status(500).json({ message: 'Internal error' });
  }
});


export default router