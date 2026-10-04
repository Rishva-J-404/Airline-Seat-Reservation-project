// ============================================================
// env.js - Environment Configuration & Validation
// ============================================================

import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'airline_dsa_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_fallback_secret_key_change_in_production_32chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};
