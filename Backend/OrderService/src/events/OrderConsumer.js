import { consumeEvents, EXCHANGES , ROUTING_KEYS } from "./Rabbitmq.js";
import Order from '../models/order.js'


/**
 * Handle payment.succeeded event from Payment Service
 * Updates order status to confirmed
 */
const handlePaymentSuccess = async(payload) => {
    const {orderId, paymentId, amount} = payload

    console.log(`[Order] Payment succeeded for order ${orderId}`);

    const order = await Order.findById(orderId)

    if(!order) return console.warn('[Order] Order not found: ${orderId}');

    order.paymentStatus = 'paid',
    order.paymentId = paymentId,
    order.status = 'confirmed',
    order.statusHistory.push({
        status: 'confirmed',
        note: `Payment of $${amount} confirmed`,
    })

    await order.save();
    
    console.log(`[Order] Order ${order.orderNumber} confirmed`);
    
}


/**
 * Handle payment.failed event from Payment Service
 * Updates order status to cancelled
 */
const handlePaymentFailed = async (payload) => {
    const { orderId, reason } = payload;

    console.log(`[Order] Payment failed for order ${orderId}: ${reason}`);

    const order = await Order.findById(orderId);
    if (!order) return console.warn(`[Order] Order not found: ${orderId}`);

    order.paymentStatus = 'failed',
    order.status = 'cancelled',
    order.statusHistory.push({
        status: 'cancelled',
        note: `Payment failed : ${reason || "Unknown Reason"}`,
    })

    await order.save();

    console.log(`[Order] Order ${order.orderNumber} cancelled due to payment failure`);
}


/**
 * Handle payment.refunded event from Payment Service
 */
const handlePaymentRefund = async(payload) => {
    const {orderId , refundAmount} = payload;

    console.log(`[Order] Payment refunded for order ${orderId}`);

    const order = await Order.findById(orderId);

    if (!order) return console.warn(`[Order] Order not found: ${orderId}`);


    order.paymentStatus = 'refunded';
    order.status = 'refunded';
    order.statusHistory.push({
        status: 'refunded',
        note: `Refund of $${refundAmount} processed`,
    });

    await order.save();
    console.log(`[Order] Order ${order.orderNumber} marked as refunded`);
}


/**
 * Register all order service consumers
 */
const registerOrderConsumer = async() => {
    await consumeEvents(
        EXCHANGES.PAYMENTS, 
        ROUTING_KEYS.PAYMENT_SUCCEEDED,
        'order-service.payment.succeeded',
        handlePaymentSuccess
    );

    await consumeEvents(
        EXCHANGES.PAYMENTS, 
        ROUTING_KEYS.PAYMENT_FAILED,
        'order-service.payment.failed',
        handlePaymentFailed
    );

    await consumeEvents(
        EXCHANGES.PAYMENTS, 
        ROUTING_KEYS.PAYMENT_REFUNDED,
        'order-service.payment.refunded',
        handlePaymentRefund
    );

    console.log('✅ Order consumers registered'); 
}
export {
    registerOrderConsumer
}