// Authentication Middleware
// Flow:
// 1. User sends email + password -> server verifies -> creates JWT with { userId, orgId, role } -> returns token.
// 2. Subsequent requests: Browser sends header 'Authorization: Bearer <token>' -> middleware decodes token and attaches req.user.
// 3. If token missing/invalid: middleware returns 401/403 and blocks execution.

import jwt from 'jsonwebtoken'; // JWT handling library

/**
 * Middleware function to authenticate incoming HTTP requests via Bearer JWT token.
 */
export const authenticateToken = (req, res, next) => {
    // Read the Authorization header from the incoming request headers object
    const authHeader = req.headers['authorization'];
    
    // If the Authorization header is missing entirely, block request with 401 Unauthorized
    if (!authHeader)
        return res.status(401).json({ message: "authorization header missing" });

    // Split header string into space-separated parts ("Bearer <token>")
    const parts = authHeader.split(" ");

    // Verify header strictly follows "Bearer <token>" format (exactly 2 parts)
    if (parts.length !== 2 || parts[0] !== "Bearer")
        return res.status(401).json({ message: "authorization header malformed" });

    // Extract raw JWT token string
    const token = parts[1];
    
    // Verify token cryptographic signature using the server's JWT_SECRET
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attach decoded payload (user ID, organization ID, role) to express request object
        req.user = decoded;
        // Call next() to pass execution to the downstream route handler
        next();
    } catch {
        // Return 403 Forbidden if signature is invalid, tampered with, or expired
        return res.status(403).json({ message: "Invalid token" });
    }
};