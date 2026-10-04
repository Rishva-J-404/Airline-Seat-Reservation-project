// ============================================================
// auth.js - Cryptographic & JWT Authentication Utilities
// ============================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcrypt
 * @param {string} password Plaintext password
 * @returns {Promise<string>} Salted hash
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare plaintext password with stored bcrypt hash
 * @param {string} password Plaintext password
 * @param {string} hash Stored bcrypt hash
 * @returns {Promise<boolean>} True if matching
 */
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a signed JWT token for an authenticated user
 * @param {object} user User payload { id, email, role }
 * @returns {string} Bearer token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'passenger',
      name: user.name,
    },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN }
  );
}

/**
 * Verify and decode a JWT token
 * @param {string} token Bearer token
 * @returns {object} Decoded token payload
 */
export function verifyToken(token) {
  return jwt.verify(token, ENV.JWT_SECRET);
}
