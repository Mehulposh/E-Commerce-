import { consumeEvents, EXCHANGES, ROUTING_KEYS } from './Rabbitmq.js';
import Notification from '../models/Notification.js';
import { sendEmail } from '../services/emailService.js';
import { sendInAppMessage, getInAppMessage } from '../services/inapp_message.js';
import  getTemplate  from '../template/emailTemplate.js';

/**
 * Core notification handler
 * Sends both email and in-app message for a given event
 */
const handleNotification = async (event, payload) => {
  const { userId, userEmail, orderNumber, orderId, paymentId } = payload;

  if (!userId) {
    console.warn(`[Notification] No userId in payload for event ${event}`);
    return;
  }

  const template = getTemplate(event, payload);
  const inAppBody = getInAppMessage(event, payload);

  // ── 1. Send Email ─────────────────────────────────────────
  if (userEmail) {
    const emailNotification = await Notification.create({
      userId,
      type: 'email',
      event,
      recipient: userEmail,
      subject: template.subject,
      body: template.text,
      status: 'pending',
      orderId: orderId || null,
      orderNumber: orderNumber || null,
      paymentId: paymentId || null,
      metadata: payload,
    });

    try {
      await sendEmail({
        to: userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      emailNotification.status = 'sent';
      emailNotification.sentAt = new Date();
      await emailNotification.save();

      console.log(`[Notification] ✅ Email sent to ${userEmail} for ${event}`);
    } catch (err) {
      emailNotification.status = 'failed';
      emailNotification.error = err.message;
      await emailNotification.save();
      console.error(`[Notification] ❌ Email failed for ${event}:`, err.message);
    }
  } else {
    console.warn(`[Notification] No email address for user ${userId} — skipping email`);
  }

  // ── 2. Send In-App Message ────────────────────────────────
  await sendInAppMessage({
    userId,
    event,
    body: inAppBody,
    metadata: { orderId, orderNumber, paymentId, ...payload },
  });
};

// ── Event Handlers ────────────────────────────────────────────

const handlePaymentSucceeded = async (payload) => {
  console.log(`[Notification] Payment succeeded — order ${payload.orderNumber}`);
  console.log('[Notification] payload:', JSON.stringify(payload)) 
  await handleNotification('payment.succeeded', payload);
};

const handlePaymentFailed = async (payload) => {
  console.log(`[Notification] Payment failed — order ${payload.orderNumber}`);
  await handleNotification('payment.failed', payload);
};

const handlePaymentRefunded = async (payload) => {
  console.log(`[Notification] Payment refunded — order ${payload.orderNumber}`);
  await handleNotification('payment.refunded', payload);
};

const handleOrderCancelled = async (payload) => {
  console.log(`[Notification] Order cancelled — ${payload.orderNumber}`);
  await handleNotification('order.cancelled', payload);
};

/**
 * Register all notification consumers
 */
const registerNotificationConsumers = async () => {
  await consumeEvents(
    EXCHANGES.PAYMENTS,
    ROUTING_KEYS.PAYMENT_SUCCEEDED,
    'notification-service.payment.succeeded',
    handlePaymentSucceeded
  );

  await consumeEvents(
    EXCHANGES.PAYMENTS,
    ROUTING_KEYS.PAYMENT_FAILED,
    'notification-service.payment.failed',
    handlePaymentFailed
  );

  await consumeEvents(
    EXCHANGES.PAYMENTS,
    ROUTING_KEYS.PAYMENT_REFUNDED,
    'notification-service.payment.refunded',
    handlePaymentRefunded
  );

  await consumeEvents(
    EXCHANGES.ORDERS,
    ROUTING_KEYS.ORDER_CANCELLED,
    'notification-service.order.cancelled',
    handleOrderCancelled
  );

  console.log('✅ Notification consumers registered');
};

export default  registerNotificationConsumers ;