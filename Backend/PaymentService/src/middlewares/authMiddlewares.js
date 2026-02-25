import { verifyToken } from "../service/serviceClient.js";

const protect = async(req,res,next) => {
    const authHeader = req.headers.authorization

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        req.user = await verifyToken(authHeader);
        next();
    } catch (err) {
        if (err.response) {
            return res.status(err.response.status).json(err.response.data);
        }
        console.error('[Auth] Auth service unreachable:', err.message);
        return res.status(503).json({ message: 'Authentication service unavailable' });
    }
    
}

const restrictTo = (...roles) => (req, res, next) => {
    if(!req.user || !roles.includes(req.user.role)){
        return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next()
}

/**
 * Internal service-to-service calls (no user token required)
 * Validates a shared internal secret header instead
 */

const internalOnly = (req,res,next) => {
    // In Phase 3 this will be replaced by RabbitMQ events
    // For now, accept calls from within the Docker network
    const forwarded = req.headers['x-forwarded-for'];
    const source = req.headers['x-internal-service'];

    // Simple check — in production use a shared secret or mTLS
    if (!source) {
        return res.status(403).json({ message: 'Internal endpoint' });
    }
    next();
}


export {
    protect,
    restrictTo,
    internalOnly
}