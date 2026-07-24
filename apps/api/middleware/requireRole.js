// requireRole.js — role-based access control middleware.
//
// Usage:
//   router.post('/', authenticateToken, requireRole('admin', 'dispatcher'), handler)
//   router.patch('/', authenticateToken, requireRole('driver'), handler)
//
// The role string must exactly match what's stored in users.role and signed into the JWT:
//   'superadmin' | 'admin' | 'dispatcher' | 'driver'
//
// IMPORTANT: always place authenticateToken BEFORE requireRole in the chain —
// requireRole reads req.user which authenticateToken sets.

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    // Should never happen if authenticateToken ran first, but guard anyway
    return res.status(401).json({ message: 'Unauthorized — no user context' });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Forbidden — requires role: ${allowedRoles.join(' or ')}`,
      yourRole: req.user.role,
    });
  }

  next();
};

// Convenience shorthand guards (compose into route definitions cleanly)
export const dispatcherOrAbove = requireRole('superadmin', 'admin', 'dispatcher');
export const adminOrAbove      = requireRole('superadmin', 'admin');
export const driverOnly        = requireRole('driver');
export const superadminOnly    = requireRole('superadmin');
