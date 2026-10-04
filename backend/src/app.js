// ============================================================
// app.js - Express Application Setup & Global Middleware
// ============================================================

import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/authRoutes.js';
import flightRoutes from './routes/flightRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';

export const app = express();

// Security Headers Middleware (OWASP recommended defense-in-depth)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none';");
  next();
});

// Apply API-wide rate limiting
app.use('/api', apiRateLimiter);

// CORS Configuration
app.use(cors({
  origin: [ENV.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body Parser with Input Cap
app.use(express.json({ limit: '50kb' }));

// Service Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Airline Seat Reservation System API',
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Mount Resource Routes
app.use('/api/auth', authRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/reservations', reservationRoutes);

// 404 Not Found Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} was not found on this server.`,
    },
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);
