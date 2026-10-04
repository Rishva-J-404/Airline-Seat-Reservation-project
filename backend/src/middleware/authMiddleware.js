// ============================================================
// authMiddleware.js - JWT Authentication & Authorization Guard
// ============================================================

import { verifyToken } from '../utils/auth.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required. Provide valid Bearer token.',
      },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authentication token is invalid or expired.',
      },
    });
  }
}

/**
 * Role-based authorization middleware
 * @param  {...string} roles Allowed roles ('admin', 'passenger', etc.)
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. Insufficient permissions for this resource.',
        },
      });
    }
    next();
  };
}
