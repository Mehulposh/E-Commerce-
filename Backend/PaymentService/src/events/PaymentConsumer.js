import { consumeEvents, EXCHANGES, ROUTING_KEYS } from './Rabbitmq.js';
import Payment from '../models/payment.js';
import { processPayment, processRefund } from '../utills/PaymentSimulationEngine.js';
import { publishPaymentSucceeded, publishPaymentFailed, publishPaymentRefunded } from './PaymentPublisher.js'

/**
 * Handle order.created event from Order Service
 * Automatically initiates payment for the new order
 */
const handleOrderCreated = async (payload) => {
  const { orderId, orderNumber, userId, totalAmount, currency , userEmail, items, shippingAddress  } = payload;
  console.log(`[Payment] Processing payment for order ${orderNumber}`);

  // Prevent duplicate payments
  const existing = await Payment.findOne({
    orderId,
    status: { $in: ['pending', 'processing', 'succeeded'] },
  });

  if (existing) {
    console.warn(`[Payment] Payment already exists for order ${orderId}`);
    return;
  }

  // Create payment in processing state
  const payment = await Payment.create({
    orderId,
    orderNumber,
    userId,
    amount: totalAmount,
    currency: currency || 'USD',
    method: 'simulated',
    status: 'processing',
  });

  // Run simulation
  const result = await processPayment({ amount: totalAmount, currency });

  payment.status = result.success ? 'succeeded' : 'failed';
  payment.gatewayTransactionId = result.transactionId;
  payment.cardLast4 = result.cardLast4;
  payment.cardBrand = result.cardBrand;
  payment.failureReason = result.failureReason;
  payment.processedAt = new Date();
  payment.gatewayResponse = result;
  await payment.save();

  // Publish result event back — Order Service will pick it up
  if (result.success) {
    await publishPaymentSucceeded(payment,  { email: userEmail });
    console.log(`[Payment] ✅ Payment succeeded for order ${orderNumber}`);
  } else {
    await publishPaymentFailed(payment,  { email: userEmail });
    console.log(`[Payment] ❌ Payment failed for order ${orderNumber}: ${result.failureReason}`);
  }
};

/**
 * Handle order.cancelled event from Order Service
 * Auto-refunds if payment was already succeeded
 */
const handleOrderCancelled = async (payload) => {
  const { orderId, orderNumber } = payload;
  console.log(`[Payment] Order cancelled: ${orderNumber}`);

  const payment = await Payment.findOne({ orderId, status: 'succeeded' });
  if (!payment) {
    console.log(`[Payment] No successful payment found for order ${orderId} — no refund needed`);
    return;
  }

  const refundResult = await processRefund({
    transactionId: payment.gatewayTransactionId,
    amount: payment.amount,
  });

  if (refundResult.success) {
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.refundAmount = payment.amount;
    await payment.save();

    await publishPaymentRefunded(payment);
    console.log(`[Payment] ✅ Refund processed for order ${orderNumber}`);
  } else {
    console.error(`[Payment] ❌ Refund failed for order ${orderNumber}: ${refundResult.failureReason}`);
  }
};

/**
 * Register all payment service consumers
 */
const registerPaymentConsumers = async () => {
  await consumeEvents(
    EXCHANGES.ORDERS,
    ROUTING_KEYS.ORDER_CREATED,
    'payment-service.order.created',
    handleOrderCreated
  );

  await consumeEvents(
    EXCHANGES.ORDERS,
    ROUTING_KEYS.ORDER_CANCELLED,
    'payment-service.order.cancelled',
    handleOrderCancelled
  );

  console.log('✅ Payment consumers registered');
};

export { registerPaymentConsumers };