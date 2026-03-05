import axios from 'axios';

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const response = await axios.post(
      `${AUTH_URL}/api/auth/verify`,
      {},
      { headers: { Authorization: authHeader } }
    );
    req.user = response.data.user;
    next();
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    return res.status(503).json({ message: 'Authentication service unavailable' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export { protect, adminOnly };