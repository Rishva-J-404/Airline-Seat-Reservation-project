// ============================================================
// reservations.test.js - Reservation Management, Concurrency & Waiting List Tests
// Regression suite verifying single-client transactions, double-booking prevention,
// safe cancellation, re-booking after cancellation, joined relations, and FIFO waiting list persistence.
// ============================================================

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/config/db.js';

describe('Backend Reservations Endpoints', () => {
  let userToken = '';
  let otherUserToken = '';
  let bookedSeatId = null;
  let bookedSeatNumber = '';
  let confirmedResId = null;
  let confirmedBookingRef = '';

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

  it('should successfully create reservation for an available seat with CO4 receipt', async () => {
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
    assert.ok(res.body.dsaReceipt.co4_bst, 'CO4 BST receipt must exist');
    assert.ok(res.body.dsaReceipt.co3_bst, 'CO3 BST alias receipt must exist for backward compatibility');

    confirmedResId = res.body.reservation.id;
    confirmedBookingRef = res.body.reservation.bookingReference;
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
    assert.strictEqual(res.body.error.code, 'SEAT_UNAVAILABLE');
    assert.ok(res.body.error.message.includes('is no longer available'));
  });

  it('should resolve concurrent booking attempts so exactly one succeeds and one receives 409', async () => {
    // Find another available seat on flight 1
    const seatsRes = await request(app).get('/api/flights/1/seats');
    const targetSeat = seatsRes.body.seats.find(s => s.status === 'available' && s.id !== bookedSeatId);
    assert.ok(targetSeat, 'Need an available seat for concurrent booking test');

    // Launch two simultaneous booking requests for the exact same seat
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          flightId: 1,
          seatId: targetSeat.id,
          passengerName: 'Concurrent Passenger A',
        }),
      request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          flightId: 1,
          seatId: targetSeat.id,
          passengerName: 'Concurrent Passenger B',
        }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    assert.deepStrictEqual(statuses, [201, 409], 'Exactly one request must succeed (201) and one must receive 409');

    const conflictRes = res1.status === 409 ? res1 : res2;
    assert.strictEqual(conflictRes.body.error.code, 'SEAT_UNAVAILABLE');
  });

  it('should retrieve list of reservations with complete joined flight & seat fields (BUG-001)', async () => {
    const res = await request(app)
      .get('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.reservations.length >= 1);
    const found = res.body.reservations.find(r => r.id === confirmedResId);
    assert.ok(found, 'Created reservation must be present in reservations list');
    assert.ok(found.flightNumber || found.flight_number, 'flightNumber must be returned');
    assert.ok(found.airline, 'airline must be returned');
    assert.ok(found.origin || found.from, 'origin must be returned');
    assert.ok(found.destination || found.to, 'destination must be returned');
    assert.ok(found.seatNumber || found.seat_number, 'seatNumber must be returned');
    assert.ok(found.passengerName || found.passenger_name, 'passengerName must be returned');
  });

  it('should retrieve specific reservation by ID with full joined fields for owner', async () => {
    const res = await request(app)
      .get(`/api/reservations/${confirmedResId}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.reservation.id, confirmedResId);
    assert.strictEqual(res.body.reservation.bookingReference, confirmedBookingRef);
    assert.strictEqual(res.body.reservation.seatNumber, bookedSeatNumber);
    assert.ok(res.body.reservation.airline);
  });

  it('should retrieve specific reservation by booking reference string (e.g. B1001)', async () => {
    const res = await request(app)
      .get(`/api/reservations/${confirmedBookingRef}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.reservation.id, confirmedResId);
    assert.strictEqual(res.body.reservation.bookingReference, confirmedBookingRef);
  });

  it('should return 400 INVALID_ID for malformed reservation identifier', async () => {
    const res = await request(app)
      .get('/api/reservations/not-a-valid-id-or-ref')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'INVALID_ID');
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

  it('should allow cancellation using booking reference string (BUG-002)', async () => {
    // 1. Create a fresh reservation to cancel via string reference
    const seatsRes = await request(app).get('/api/flights/1/seats');
    const freeSeat = seatsRes.body.seats.find(s => s.status === 'available');
    assert.ok(freeSeat);

    const makeRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        flightId: 1,
        seatId: freeSeat.id,
        passengerName: 'Cancel By Ref Test',
      });
    assert.strictEqual(makeRes.status, 201);
    const refString = makeRes.body.reservation.bookingReference;
    assert.ok(refString);

    // 2. Cancel using bookingReference string
    const cancelRes = await request(app)
      .delete(`/api/reservations/${refString}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.body.status, 'cancelled');
    assert.strictEqual(cancelRes.body.seatReleased, true);
    assert.strictEqual(cancelRes.body.bookingReference, refString);
  });

  it('should allow a different passenger to book the released seat after cancellation (Seat Re-Booking)', async () => {
    // Other user books the newly released seat
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        flightId: 1,
        seatId: bookedSeatId,
        passengerName: 'Different Passenger',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.reservation.seatNumber, bookedSeatNumber);
    assert.strictEqual(res.body.reservation.status, 'confirmed');

    // Seat should now be occupied again
    const seatCheck = await request(app).get('/api/flights/1/seats');
    const rebookedSeat = seatCheck.body.seats.find(s => s.id === bookedSeatId);
    assert.strictEqual(rebookedSeat.status, 'occupied');
  });

  it('should reject cancelling an already cancelled reservation', async () => {
    const res = await request(app)
      .delete(`/api/reservations/${confirmedResId}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'ALREADY_CANCELLED');
  });

  it('should reject joining waiting list when flight still has available seats (BUG-003)', async () => {
    // Flight 1 has available seats
    const res = await request(app)
      .post('/api/reservations/waiting-list')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        flightId: 1,
        passengerName: 'Early Waiter',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'FLIGHT_NOT_FULL');
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

  it('should reject duplicate active waiting entry for same user and flight (BUG-003)', async () => {
    const res = await request(app)
      .post('/api/reservations/waiting-list')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        flightId: 6,
        passengerName: 'Anand Kumar Duplicate',
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.error.code, 'ALREADY_WAITING');
  });

  it('should reject waiting list status for invalid non-numeric flightId (BUG-011)', async () => {
    const res = await request(app)
      .get('/api/reservations/waiting-list/not-numeric')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'INVALID_ID');
  });

  it('should promote the oldest waiting passenger in strict FIFO order on cancellation', async () => {
    // Enqueue second waiting passenger for flight 6 using otherUserToken
    const res2 = await request(app)
      .post('/api/reservations/waiting-list')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        flightId: 6,
        passengerName: 'Divya Nair',
        seatPreference: 'aisle',
      });

    assert.strictEqual(res2.status, 201);
    assert.strictEqual(res2.body.waitingRecord.queuePosition, 2);

    // Create a confirmed reservation on flight 6 to cancel (simulate an existing passenger)
    const seatRes = await request(app).get('/api/flights/6/seats');
    const seatToBook = seatRes.body.seats[0];

    // Force seat available for initial booking setup
    await db.query('UPDATE seats SET status = $1 WHERE id = $2', ['available', seatToBook.id]);

    const bookRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        flightId: 6,
        seatId: seatToBook.id,
        passengerName: 'Initial Occupant',
      });
    assert.strictEqual(bookRes.status, 201);
    const initialResId = bookRes.body.reservation.id;

    // Now cancel this reservation on flight 6
    // The cancellation should automatically promote the FIRST waiting passenger (Anand Kumar), NOT the second
    const cancelRes = await request(app)
      .delete(`/api/reservations/${initialResId}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.body.status, 'cancelled');
    assert.ok(cancelRes.body.promotedPassenger, 'Must promote waiting passenger');
    assert.strictEqual(
      cancelRes.body.promotedPassenger.passengerName,
      'Anand Kumar',
      'The oldest waiting passenger must be promoted first (FIFO)'
    );

    // Verify waiting list status now only has Divya Nair as position 1
    const wlCheck = await request(app)
      .get('/api/reservations/waiting-list/6')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(wlCheck.status, 200);
    assert.strictEqual(wlCheck.body.queueDepth, 1);
    assert.strictEqual(wlCheck.body.waitingPassengers[0].passengerName, 'Divya Nair');
    assert.strictEqual(wlCheck.body.waitingPassengers[0].queuePosition, 1);
  });

  it('should retrieve persistent waiting list records across multiple queries', async () => {
    const res = await request(app)
      .get('/api/reservations/waiting-list/6')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.queueDepth >= 1);
    assert.strictEqual(res.body.waitingPassengers[0].passengerName, 'Divya Nair');
  });
});
