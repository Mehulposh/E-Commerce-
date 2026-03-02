import Notification from '../models/Notification.js';

/**
 * Save an in-app notification to the database
 * Users can fetch these via GET /api/notifications
 */
const sendInAppMessage = async ({ userId, event, body, metadata = {} }) => {
  const notification = await Notification.create({
    userId,
    type: 'in_app',
    event,
    recipient: userId,
    body,
    status: 'sent',
    sentAt: new Date(),
    metadata,
    orderId: metadata.orderId || null,
    orderNumber: metadata.orderNumber || null,
    paymentId: metadata.paymentId || null,
  });

  console.log(`[Notification] In-app message saved for user ${userId}: ${event}`);
  return notification;
};

/**
 * In-app message templates
 */
const getInAppMessage = (event, data) => {
  const messages = {
    'payment.succeeded': `✅ Your order ${data.orderNumber} has been confirmed! Payment of ${data.currency} ${data.amount} was successful.`,
    'payment.failed': `❌ Payment failed for order ${data.orderNumber}. Please try again.`,
    'payment.refunded': `💰 Refund of ${data.currency} ${data.refundAmount} processed for order ${data.orderNumber}.`,
    'order.cancelled': `🚫 Your order ${data.orderNumber} has been cancelled.`,
    'order.shipped': `🚚 Your order ${data.orderNumber} has been shipped!`,
    'order.delivered': `📦 Your order ${data.orderNumber} has been delivered!`,
  };

  return messages[event] || `Notification: ${event}`;
};

export { sendInAppMessage, getInAppMessage };