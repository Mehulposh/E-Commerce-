import { publishEvent, EXCHANGES, ROUTING_KEYS } from './Rabbitmq.js';

/**
 * Published after payment is successfully processeds
 * Order Service listens → confirms the order
 */
const publishPaymentSucceeded = async (payment, user = null) => {
  await publishEvent(EXCHANGES.PAYMENTS, ROUTING_KEYS.PAYMENT_SUCCEEDED, {
    paymentId: payment.paymentId,
    orderId: payment.orderId,
    orderNumber: payment.orderNumber,
    userId: payment.userId,
    amount: payment.amount,
    currency: payment.currency,
    transactionId: payment.gatewayTransactionId,
    userEmail: user?.email || null,
  });
};

/**
 * Published after payment fails
 * Order Service listens → cancels the order
 */
const publishPaymentFailed = async (payment) => {
  await publishEvent(EXCHANGES.PAYMENTS, ROUTING_KEYS.PAYMENT_FAILED, {
    paymentId: payment.paymentId,
    orderId: payment.orderId,
    orderNumber: payment.orderNumber,
    userId: payment.userId,
    amount: payment.amount,
    reason: payment.failureReason,
  });
};

/**
 * Published after a refund is processed
 * Order Service listens → marks order as refunded
 */
const publishPaymentRefunded = async (payment) => {
  await publishEvent(EXCHANGES.PAYMENTS, ROUTING_KEYS.PAYMENT_REFUNDED, {
    paymentId: payment.paymentId,
    orderId: payment.orderId,
    orderNumber: payment.orderNumber,
    userId: payment.userId,
    refundAmount: payment.refundAmount,
  });
};

export {
  publishPaymentSucceeded,
  publishPaymentFailed,
  publishPaymentRefunded,
};