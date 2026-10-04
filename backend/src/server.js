// ============================================================
// server.js - HTTP Server Entry Point
// ============================================================

import { app } from './app.js';
import { ENV } from './config/env.js';

const server = app.listen(ENV.PORT, () => {
  console.log(`[FlySmart Backend] Server operational on port ${ENV.PORT} (${ENV.NODE_ENV})`);
  console.log(`[FlySmart Backend] Health endpoint: http://localhost:${ENV.PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[FlySmart Backend] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[FlySmart Backend] Server closed.');
    process.exit(0);
  });
});
