import { verifyToken } from "../service/Service-client.js";

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


export {
    protect,
    restrictTo
}