import axios from "axios";

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const PRODUCT_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004';


/**
 * Verify a JWT token via Auth Service
*/
const verifyToken = async(token) => {
    const response = await axios.post(
        `${AUTH_URL}/api/auth/verify`,
        {},
        { headers: { Authorization: token } }
    );

    return response.data.user
}

/**
 * Fetch a single product from Product Service
*/
const getProduct = async(productId) => {
    const response = await axios.get(`${PRODUCT_URL}/api/products/${productId}`)
    return response.data.product
}


/**
 * Update product stock via Product Service (admin internal call)
 * In a real system this would be a dedicated internal endpoint
 */
const updateProductStock = async(productId, quantityDelta, authHeader) => {
    const product = await getProduct(productId)
    const newStock = product.stock + quantityDelta
    await axios.put(`${PRODUCT_URL}/api/products/${productId}`,
        {stock: newStock},
        {headers: {
            Authorization: authHeader
        }}
    )

    return newStock
}

/**
 * Initiate a payment via Payment Service
 */
const InitiatePayment = async(payload)=> {
    const response = await axios.post(`${PAYMENT_URL}/api/payments/initiate`, payload);
    return response.data;
}

/**
 * Get payment status from Payment Service
 */
const getPaymentStatus = async (paymentId) => {
  const response = await axios.get(`${PAYMENT_URL}/api/payments/${paymentId}`);
  return response.data.payment;
};


export {
    verifyToken,
    getProduct,
    updateProductStock,
    InitiatePayment,
    getPaymentStatus
}