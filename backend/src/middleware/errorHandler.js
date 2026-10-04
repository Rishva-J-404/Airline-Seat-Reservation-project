// ============================================================
// errorHandler.js - Centralized Production Error Handler
// ============================================================

import { ENV } from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  // Log full error details securely on the server
  console.error('[API Error]', {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    code: err.code,
    stack: ENV.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle known constraint errors
  if (err.code === '23505') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'A duplicate record already exists (e.g. seat already reserved or email already registered).',
      },
    });
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && ENV.NODE_ENV === 'production'
    ? 'Internal server error occurred. Please try again later.'
    : err.message || 'Internal server error';

  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message,
      ...(ENV.NODE_ENV === 'development' && err.details ? { details: err.details } : {}),
    },
  });
}
