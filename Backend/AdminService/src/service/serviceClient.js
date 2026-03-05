import axios from "axios";

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const ORDER_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004';
const PRODUCT_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';


// Forward the admin's auth token to internal services
const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// ── Auth Service ──────────────────────────────────────────────
const getUsers = (token, query = '') =>
  axios.get(`${AUTH_URL}/api/auth/admin/users${query}`, { headers: authHeader(token) });

const getUserById = (token, id) =>
  axios.get(`${AUTH_URL}/api/auth/admin/users/${id}`, { headers: authHeader(token) });

const updateUser = (token, id, data) =>
  axios.patch(`${AUTH_URL}/api/auth/admin/users/${id}`, data, { headers: authHeader(token) });

const deleteUser = (token, id) =>
  axios.delete(`${AUTH_URL}/api/auth/admin/users/${id}`, { headers: authHeader(token) });

// ── Order Service ─────────────────────────────────────────────
const getOrders = (token, query = '') =>
  axios.get(`${ORDER_URL}/api/orders${query}`, { headers: authHeader(token) });

const getOrderById = (token, id) =>
  axios.get(`${ORDER_URL}/api/orders/${id}`, { headers: authHeader(token) });

const updateOrderStatus = (token, id, data) =>
  axios.patch(`${ORDER_URL}/api/orders/${id}/status`, data, { headers: authHeader(token) });

// ── Payment Service ───────────────────────────────────────────
const getPayments = (token, query = '') =>
  axios.get(`${PAYMENT_URL}/api/payments${query}`, { headers: authHeader(token) });

const refundPayment = (token, id, data) =>
  axios.post(`${PAYMENT_URL}/api/payments/${id}/refund`, data, { headers: authHeader(token) });

// ── Product Service ───────────────────────────────────────────
const getProducts = (token, query = '') =>
  axios.get(`${PRODUCT_URL}/api/products${query}`, { headers: authHeader(token) });

export {
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  getOrders, 
  getOrderById, 
  updateOrderStatus,
  getPayments, 
  refundPayment,
  getProducts,
};