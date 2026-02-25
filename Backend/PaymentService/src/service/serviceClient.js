import axios from 'axios'

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const ORDER_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';

/**
 * Verify a JWT token via Auth Service
 */
const verifyToken = async (authHeader) => {
  const response = await axios.post(
    `${AUTH_URL}/api/auth/verify`,
    {},
    { headers: { Authorization: authHeader } }
  );
  return response.data.user;
};


/**
 * Notify Order Service that payment succeeded or failed
 */
const notifyOrderPaymentUpdate = async (orderId, paymentStatus, paymentId) => {
  try {
    // Order service exposes an internal callback for payment updates
    await axios.patch(`${ORDER_URL}/api/orders/internal/payment-update`, {
      orderId,
      paymentStatus,
      paymentId,
    });
  } catch (err) {
    // Non-blocking — log and continue
    console.error('[Payment] Failed to notify order service:', err.message);
  }
};


export {
    verifyToken,
    notifyOrderPaymentUpdate
}