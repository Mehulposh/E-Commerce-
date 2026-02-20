import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

/**
 * Verify token by calling the Auth Service
 * This ensures token validity is always checked against the auth source of truth
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/verify`,
      {},
      { headers: { Authorization: authHeader } }
    );

    req.user = response.data.user;
    next();
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    console.error('[Auth] Auth service unreachable:', err.message);
    return res.status(503).json({ message: 'Authentication service unavailable' });
  }
};

/**
 * Restrict to specific roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

export {
    protect,
    restrictTo
}