// Role-Based Access Control (RBAC) Middleware
// Usage:
//   router.post('/', authenticateToken, requireRole('admin', 'dispatcher'), handler)
//   router.patch('/', authenticateToken, requireRole('driver'), handler)
//
// Role hierarchy strings matching user records:
//   'superadmin' | 'admin' | 'dispatcher' | 'driver'
//
// NOTE: Always run authenticateToken / protect BEFORE requireRole so req.user is set.

/**
 * Creates a middleware function enforcing that req.user.role matches one of allowedRoles.
 * @param {...string} allowedRoles - List of permitted role strings
 */
export const requireRole = (...allowedRoles) => (req, res, next) => {
  // Defensive check: ensure user context exists on request object
  if (!req.user) {
    // Return 401 Unauthorized if auth middleware was omitted upstream
    return res.status(401).json({ message: 'Unauthorized — no user context' });
  }

  // Check if authenticated user's role is included in allowedRoles array
  if (!allowedRoles.includes(req.user.role)) {
    // Reject request with 403 Forbidden if user lacks necessary permissions
    return res.status(403).json({
      message: `Forbidden — requires role: ${allowedRoles.join(' or ')}`,
      yourRole: req.user.role,
    });
  }

  // Permission granted: proceed to next route handler
  next();
};

// Convenience shorthand guard definitions for reuse in route declarations
export const dispatcherOrAbove = requireRole('superadmin', 'admin', 'dispatcher'); // Allows superadmin, admin, dispatcher
export const adminOrAbove      = requireRole('superadmin', 'admin');               // Allows superadmin, admin
export const driverOnly        = requireRole('driver');                            // Restricts access to drivers
export const superadminOnly    = requireRole('superadmin');                        // Restricts access to superadmin

