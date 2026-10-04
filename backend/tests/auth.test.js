// ============================================================
// auth.test.js - Authentication & Authorization Integration Tests
// ============================================================

import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Backend Auth Endpoints', () => {
  const testUser = {
    name: 'Ananya Iyer',
    email: `ananya.${Date.now()}@flysmart.demo`,
    password: 'password123',
  };

  let authToken = '';

  it('should register a new user successfully and return JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.email, testUser.email.toLowerCase());
    assert.strictEqual(res.body.user.name, testUser.name);
    assert.strictEqual(res.body.user.password_hash, undefined); // Password never exposed
  });

  it('should reject registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.error.code, 'EMAIL_ALREADY_EXISTS');
  });

  it('should reject registration with invalid email or short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: '123' });

    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.length >= 2);
  });

  it('should login valid user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.email, testUser.email.toLowerCase());
    authToken = res.body.token;
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error.code, 'INVALID_CREDENTIALS');
  });

  it('should reject login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@flysmart.demo', password: 'password123' });

    assert.strictEqual(res.status, 401);
  });

  it('should allow access to protected /me endpoint with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.email, testUser.email.toLowerCase());
    assert.strictEqual(res.body.user.name, testUser.name);
  });

  it('should reject access to protected endpoint without token', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
  });
});
