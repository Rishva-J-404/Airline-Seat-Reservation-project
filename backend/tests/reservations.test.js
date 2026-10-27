// ============================================================
// reservations.test.js - Reservation Management, Concurrency & Waiting List Tests
// ============================================================

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Backend Reservations Endpoints', () => {
  let userToken = '';
  let otherUserToken = '';
  let bookedSeatId = null;
  let bookedSeatNumber = '';
  let confirmedResId = null;

  before(async () => {
    // 1. Register main test user
    const u1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Rohan Sharma',
        email: `rohan.${Date.now()}@flysmart.demo`,
        password: 'password123',
      });
    userToken = u1.body.token;

    // 2. Register second user for concurrency & authorization checks
    const u2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Kavita Menon',
        email: `kavita.${Date.now()}@flysmart.demo`,
        password: 'password123',
      });
    otherUserToken = u2.body.token;

    // 3. Find an available seat on flight 1
    const seatsRes = await request(app).get('/api/flights/1/seats');
    const availSeat = seatsRes.body.seats.find(s => s.status === 'available');
    bookedSeatId = availSeat.id;
    bookedSeatNumber = availSeat.seatNumber;
  });

  it('should reject reservation creation without authentication token', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .send({
        flightId: 1,
        seatId: bookedSeatId,
        passengerName: 'Rohan Sharma',
      });

    assert.strictEqual(res.status, 401);
  });

  it('should successfully create reservation for an available seat', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        flightId: 1,
        seatId: bookedSeatId,
        passengerName: 'Rohan Sharma',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.reservation.seatNumber, bookedSeatNumber);
    assert.strictEqual(res.body.reservation.status, 'confirmed');
    assert.ok(res.body.reservation.bookingReference);
    assert.ok(res.body.dsaReceipt.co1_queue);
    assert.ok(res.body.dsaReceipt.co2_manifest);
    assert.ok(res.body.dsaReceipt.co4_bst || res.body.dsaReceipt.co3_bst);

    confirmedResId = res.body.reservation.id;
  });

  it('should prevent double-booking the same seat (Concurrency / Integrity Constraint)', async () => {
    // Attempting to book the SAME seat by another user must be rejected with 409
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        flightId: 1,
        seatId: bookedSeatId,
        passengerName: 'Sneha Patel',
      });

    assert.strictEqual(res.status, 409);
    assert.ok(
      res.body.error.code === 'SEAT_UNAVAILABLE' || res.body.error.code === 'SEAT_ALREADY_RESERVED',
      'Should return 409 SEAT_UNAVAILABLE'
    );
    assert.ok(res.body.error.message.includes('is no longer available') || res.body.error.message.includes('already occupied'));
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
    assert.strictEqual(res.body.seatReleased, true);

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

  it('should allow joining waiting list for full flight (CO1 FIFO queue)', async () => {
    const res = await request(app)
      .post('/api/reservations/waiting-list')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        flightId: 6, // AI-999 is fully booked
        passengerName: 'Anand Kumar',
        seatPreference: 'window',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.waitingRecord.status, 'waiting');
    assert.strictEqual(res.body.waitingRecord.queuePosition, 1);
    assert.ok(res.body.waitingRecord.requestId.startsWith('WL-'));
  });

  it('should retrieve waiting list status for a flight', async () => {
    const res = await request(app)
      .get('/api/reservations/waiting-list/6')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.queueDepth >= 1);
    assert.strictEqual(res.body.waitingPassengers[0].passengerName, 'Anand Kumar');
  });
});
