// ============================================================
// authController.js - Authentication & Registration Handlers
// ============================================================

import { db } from '../config/db.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email address already exists.',
        },
      });
    }

    // Hash password securely with bcrypt
    const passwordHash = await hashPassword(password);

    // Insert user record
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, passwordHash, 'passenger']
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      message: 'Account successfully registered.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password provided.',
        },
      });
    }

    const user = result.rows[0];
    const isMatch = await comparePassword(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password provided.',
        },
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: 'Sign in successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const result = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Authenticated user profile not found.',
        },
      });
    }

    res.status(200).json({
      user: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}
