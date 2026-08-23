// Authentication Middleware
// Flow:
// 1. User sends email + password -> server verifies -> creates JWT with { id, userId, orgId, role } -> returns token.
// 2. Subsequent requests: Browser sends header 'Authorization: Bearer <token>' or cookie -> middleware decodes token and attaches req.user.
// 3. If token missing/invalid: middleware returns 401/403 and blocks execution.

import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    let token = null;

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ message: "authorization token missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Normalize payload: id, userId, orgId, role
        req.user = {
            id: decoded.id || decoded.userId,
            userId: decoded.id || decoded.userId,
            orgId: decoded.orgId,
            role: decoded.role
        };
        next();
    } catch {
        return res.status(403).json({ message: "Invalid token" });
    }
};
