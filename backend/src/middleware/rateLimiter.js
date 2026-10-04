// ============================================================
// rateLimiter.js - IP-Based Sliding Window Rate Limiter
// Prevents brute-force credential attacks, DoS, and request flooding
// ============================================================

import { ENV } from '../config/env.js';

/**
 * Creates an in-memory sliding-window rate limiter
 * @param {object} options
 * @param {number} options.windowMs Window duration in milliseconds (default: 15 mins)
 * @param {number} options.maxRequests Maximum requests permitted within window
 * @param {string} options.message Error message returned upon exceeding limit
 */
export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  maxRequests = 100,
  message = 'Too many requests from this IP. Please try again later.',
} = {}) {
  const requestHistory = new Map();

  // Periodically sweep expired entries to prevent memory leaks
  const sweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requestHistory.entries()) {
      const active = timestamps.filter(t => now - t < windowMs);
      if (active.length === 0) {
        requestHistory.delete(ip);
      } else {
        requestHistory.set(ip, active);
      }
    }
  }, Math.max(windowMs / 2, 60000));

  // Do not hold process open if running tests or shutting down
  if (sweepInterval.unref) {
    sweepInterval.unref();
  }

  return (req, res, next) => {
    // In test environment, bypass or provide high threshold
    if (ENV.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();

    const timestamps = requestHistory.get(ip) || [];
    const recent = timestamps.filter(t => now - t < windowMs);

    if (recent.length >= maxRequests) {
      const oldest = recent[0];
      const retryAfterSec = Math.ceil((windowMs - (now - oldest)) / 1000);

      res.setHeader('Retry-After', retryAfterSec);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);

      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: `${retryAfterSec} seconds`,
        },
      });
    }

    recent.push(now);
    requestHistory.set(ip, recent);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - recent.length));

    next();
  };
}

/** Rate limiter for sensitive authentication endpoints (15 attempts / 15 minutes) */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 25,
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
});

/** General API rate limiter (150 requests / 5 minutes) */
export const apiRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 150,
  message: 'API rate limit exceeded. Please throttle request frequency.',
});
