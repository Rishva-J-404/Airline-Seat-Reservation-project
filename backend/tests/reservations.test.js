// ============================================================
// reservations.test.js - Reservation & Concurrency Safety Tests
// ============================================================

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Backend Reservations Endpoints', () => {
  let userToken = '';
  let otherUserToken = '';
  let confirmedResId = null;
  let bookedSeatId = null;

  before(async () => {
    // 1. Create primary test user
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'Rohan Varma',
      email: `rohan.${Date.now()}@flysmart.demo`,
      password: 'password123',
    });
    userToken = res1.body.token;

    // 2. Create second user to test authorization barriers
    const res2 = await request(app).post('/api/auth/register').send({
      name: 'Sneha Patel',
      email: `sneha.${Date.now()}@flysmart.demo`,
      password: 'password123',
    });
    otherUserToken = res2.body.token;
  });

  it('should reject reservation creation without authentication token', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .send({ flightId: 1, seatId: 1, passengerName: 'Test Passenger' });

    assert.strictEqual(res.status, 401);
  });

  it('should successfully create reservation for an available seat', async () => {
    // Look up an available seat on flight 1
    const seatsRes = await request(app).get('/api/flights/1/seats');
    const availableSeat = seatsRes.body.seats.find(s => s.status === 'available');
    assert.ok(availableSeat, 'Must find an available seat for testing');
    bookedSeatId = availableSeat.id;

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        flightId: 1,
        seatId: bookedSeatId,
        passengerName: 'Rohan Varma',
      });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.reservation.id);
    assert.ok(res.body.reservation.bookingReference);
    assert.strictEqual(res.body.reservation.status, 'confirmed');
    assert.ok(res.body.dsaReceipt); // Verifies server-side DSA receipt returned
    confirmedResId = res.body.reservation.id;
  });

  it('should prevent double-booking the same seat (Concurrency / Integrity Constraint)', async () => {
    // Attempting to book the SAME seat by another user must be rejected
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        flightId: 1,
        seatId: bookedSeatId,
        passengerName: 'Sneha Patel',
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.error.code, 'SEAT_ALREADY_RESERVED');
  });

  it('should retrieve list of reservations for authenticated user', async () => {
    const res = await request(app)
      .get('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.reservations.length >= 1);
    const found = res.body.reservations.find(r => r.id === confirmedResId);
    assert.ok(found);
  });

  it('should retrieve specific reservation by ID for owner', async () => {
    const res = await request(app)
      .get(`/api/reservations/${confirmedResId}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.reservation.id, confirmedResId);
  });

  it('should forbid other user from accessing private reservation (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/reservations/${confirmedResId}`)
      .set('Authorization', `Bearer ${otherUserToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error.code, 'FORBIDDEN');
  });

  it('should successfully cancel reservation and release seat', async () => {
    const res = await request(app)
      .delete(`/api/reservations/${confirmedResId}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'cancelled');

    // Verify seat is now available again
    const seatCheck = await request(app).get('/api/flights/1/seats');
    const releasedSeat = seatCheck.body.seats.find(s => s.id === bookedSeatId);
    assert.strictEqual(releasedSeat.status, 'available');
  });

  it('should reject cancelling an already cancelled reservation', async () => {
    const res = await request(app)
      .delete(`/api/reservations/${confirmedResId}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'ALREADY_CANCELLED');
  });
});
