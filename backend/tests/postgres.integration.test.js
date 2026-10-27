// ============================================================
// postgres.integration.test.js - Real PostgreSQL Staging Integration Suite
//
// Strictly executes against a real PostgreSQL instance using the actual project
// schema and production database transaction code paths.
//
// AUDIT DIRECTIVE:
// Under NO circumstances does this suite fall back to the in-memory mock.
// If PostgreSQL is unreachable, all tests are explicitly skipped and recorded
// as NOT RUN with clear environment diagnosis.
// ============================================================

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from 'pg';
const { Pool } = pkg;
import request from 'supertest';
import { app } from '../src/app.js';
import { configurePgPool, assertSafeTestDatabase } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/airline_dsa_test';

describe('PostgreSQL Staging Integration Tests (Real DB Path)', () => {
  let isPgAvailable = false;
  let testPool = null;
  let authTokenUserA = '';
  let authTokenUserB = '';

  before(async () => {
    // 1. Safety Guard against accidental production wiping
    try {
      assertSafeTestDatabase(TEST_DB_URL);
    } catch (safetyErr) {
      console.error(`\n✖ ${safetyErr.message}\n`);
      return;
    }

    // 2. Probe connectivity to real PostgreSQL
    testPool = new Pool({
      connectionString: TEST_DB_URL,
      connectionTimeoutMillis: 2000,
      max: 10,
    });

    let client = null;
    try {
      client = await testPool.connect();
      isPgAvailable = true;
      console.log(`\n[POSTGRES STAGING] Connected to real PostgreSQL at: ${TEST_DB_URL}`);
    } catch (connErr) {
      isPgAvailable = false;
      console.log(`\n============================================================`);
      console.log(`[POSTGRES STAGING] Real PostgreSQL is NOT available on host.`);
      console.log(`Diagnostic error: ${connErr.message}`);
      console.log(`Per audit instructions: NO MOCK FALLBACK IS PERMITTED.`);
      console.log(`All 9 PostgreSQL integration test cases marked as: NOT RUN.`);
      console.log(`============================================================\n`);
      return;
    }

    // 3. Apply schema.sql and seed.sql to ensure clean test state
    try {
      const schemaSql = fs.readFileSync(path.resolve(__dirname, '../../database/schema.sql'), 'utf8');
      const seedSql = fs.readFileSync(path.resolve(__dirname, '../../database/seed.sql'), 'utf8');

      await client.query(schemaSql);
      await client.query(seedSql);
      console.log('[POSTGRES STAGING] Relational schema and initial seed data applied successfully.');

      // 4. Configure backend app's db.js to use this real PostgreSQL pool
      configurePgPool(TEST_DB_URL);
    } finally {
      client.release();
    }

    // 5. Register two clean users via the real PostgreSQL API
    const regA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Staging Traveler A',
        email: `staging.traveler.a.${Date.now()}@flysmart.demo`,
        password: 'password123',
      });
    authTokenUserA = regA.body.token;

    const regB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Staging Traveler B',
        email: `staging.traveler.b.${Date.now()}@flysmart.demo`,
        password: 'password123',
      });
    authTokenUserB = regB.body.token;
  });

  after(async () => {
    if (testPool) {
      await testPool.end();
    }
  });

  // ------------------------------------------------------------
  // 1. Reservation History & Relational Joins
  // ------------------------------------------------------------
  it('1. Reservation history and relational joins (real PostgreSQL query)', async (t) => {
    if (!isPgAvailable) {
      t.skip('NOT RUN: Real PostgreSQL is not reachable on host (host lacks PostgreSQL daemon/Docker).');
      return;
    }

    // Create a real reservation
    const createRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${authTokenUserA}`)
      .send({ flightId: 1, seatId: 1, passengerName: 'Relational Test Passenger' });
    assert.strictEqual(createRes.status, 201);
    const bookingRef = createRes.body.reservation.bookingReference;

    // Fetch through getReservations() and verify relational joins
    const listRes = await request(app)
      .get('/api/reservations')
      .set('Authorization', `Bearer ${authTokenUserA}`);

    assert.strictEqual(listRes.status, 200);
    const item = listRes.body.reservations.find(r => r.bookingReference === bookingRef);
    assert.ok(item, 'Reservation must exist in retrieved list');
    assert.strictEqual(item.flightNumber, 'AI-201');
    assert.strictEqual(item.airline, 'Air India');
    assert.strictEqual(item.origin, 'Coimbatore');
    assert.strictEqual(item.destination, 'Chennai');
    assert.strictEqual(item.seatNumber, '1A');
    assert.strictEqual(item.passengerName, 'Relational Test Passenger');
  });

  // ------------------------------------------------------------
  // 2. Booking and Cancellation through the API
  // ------------------------------------------------------------
  it('2. Booking and cancellation through the API with PostgreSQL persistence', async (t) => {
    if (!isPgAvailable) {
      t.skip('NOT RUN: Real PostgreSQL is not reachable on host (host lacks PostgreSQL daemon/Docker).');
      return;
    }

    // Book seat 3 (Row 1 Col C)
    const bookRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${authTokenUserA}`)
      .send({ flightId: 1, seatId: 3, passengerName: 'Lifecycle Traveler' });
    assert.strictEqual(bookRes.status, 201);
    const resId = bookRes.body.reservation.id;

    // Direct PostgreSQL inspection: seat must be occupied
    const seatCheck1 = await testPool.query('SELECT status FROM seats WHERE id = 3');
    assert.strictEqual(seatCheck1.rows[0].status, 'occupied');

    // Cancel via API
    const cancelRes = await request(app)
      .delete(`/api/reservations/${resId}`)
      .set('Authorization', `Bearer ${authTokenUserA}`);
    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.body.status, 'cancelled');

    // Direct PostgreSQL inspection: reservation marked cancelled and seat released to available
    const resCheck = await testPool.query('SELECT status FROM reservations WHERE id = $1', [resId]);
    assert.strictEqual(resCheck.rows[0].status, 'cancelled');

    const seatCheck2 = await testPool.query('SELECT status FROM seats WHERE id = 3');
    assert.strictEqual(seatCheck2.rows[0].status, 'available');
  });

  // ------------------------------------------------------------
  // 3. Two Concurrent Booking Attempts for One Seat
  // ------------------------------------------------------------
  it('3. Two concurrent booking attempts for one seat (SELECT FOR UPDATE row-level lock)', async (t) => {
    if (!isPgAvailable) {
      t.skip('NOT RUN: Real PostgreSQL is not reachable on host (host lacks PostgreSQL daemon/Docker).');
      return;
    }

    // Target seat 4 (Row 1 Col D on flight 1)
    // Execute two simultaneous HTTP requests concurrently via Promise.all
    const [reqA, reqB] = await Promise.all([
      request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authTokenUserA}`)
        .send({ flightId: 1, seatId: 4, passengerName: 'Racer 1' }),
      request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authTokenUserB}`)
        .send({ flightId: 1, seatId: 4, passengerName: 'Racer 2' }),
    ]);

    const statuses = [reqA.status, reqB.status].sort();
    assert.deepStrictEqual(statuses, [201, 409], 'PostgreSQL row lock must allow exactly one 201 and reject with 409');

    const conflict = reqA.status === 409 ? reqA : reqB;
    assert.strictEqual(conflict.body.error.code, 'SEAT_UNAVAILABLE');

    // In PostgreSQL, verify exactly 1 reservation mapping exists for this seat
    const mappingCount = await testPool.query(
      'SELECT COUNT(*) FROM reservation_seats rs JOIN reservations r ON rs.reservation_id = r.id WHERE rs.seat_id = 4 AND r.status = $1',
      ['confirmed']
    );
    assert.strictEqual(parseInt(mappingCount.rows[0].count, 10), 1);
  });

  // ------------------------------------------------------------
  // 4. Transaction Rollback on Simulated Failures
  // ------------------------------------------------------------
  it('4. Transaction rollback on simulated failures (PostgreSQL atomic rollback)', async (t) => {
    if (!isPgAvailable) {
      t.skip('NOT RUN: Real PostgreSQL is not reachable on host (host lacks PostgreSQL daemon/Docker).');
      return;
    }

    // Verify seat 5 is available
    const initCheck = await testPool.query('SELECT status FROM seats WHERE id = 5');
    assert.strictEqual(initCheck.rows[0].status, 'available');

    // Attempt booking with non-existent flightId to trigger error after row locking
    const failRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${authTokenUserA}`)
      .send({ flightId: 99999, seatId: 5, passengerName: 'Rollback Subject' });

    assert.strictEqual(failRes.status, 404);

    // Direct PostgreSQL inspection: seat 5 MUST still be available, no changes committed
    const afterCheck = await testPool.query('SELECT status FROM seats WHERE id = 5');
    assert.strictEqual(afterCheck.rows[0].status, 'available');
  });

  // ------------------------------------------------------------
  // 5. Rebooking a Cancelled Seat
  // ------------------------------------------------------------
  it('5. Rebooking a cancelled seat (historical audit retained & new booking confirmed)', async (t) => {
    if (!isPgAvailable) {
      t.skip('NOT RUN: Real PostgreSQL is not reachable on host (host lacks PostgreSQL daemon/Docker).');
      return;
    }

    // 1. Initial booking of seat 7
    const firstBook = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${authTokenUserA}`)
      .send({ flightId: 1, seatId: 7, passengerName: 'Initial Occupant' });
    assert.strictEqual(firstBook.status, 201);
    const firstResId = firstBook.body.reservation.id;

    // 2. Cancel initial booking
    const cancel = await request(app)
      .delete(`/api/reservations/${firstResId}`)
      .set('Authorization', `Bearer ${authTokenUserA}`);
    assert.strictEqual(cancel.status, 200);

    // 3. Second passenger rebooks the same seat
    const secondBook = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${authTokenUserB}`)
      .send({ flightId: 1, seatId: 7, passengerName: 'Second Occupant' });
    assert.strictEqual(secondBook.status, 201);
    const secondResId = secondBook.body.reservation.id;

    assert.notStrictEqual(firstResId, secondResId);

    // Direct PostgreSQL inspection: both records exist in reservations table
    const historyCheck = await testPool.query(
      'SELECT id, status FROM reservations WHERE id IN ($1, $2) ORDER BY id ASC',
      [firstResId, secondResId]
    );
    assert.strictEqual(historyCheck.rows.length, 2);
    assert.strictEqual(historyCheck.rows[0].status, 'cancelled');
    assert.strictEqual(historyCheck.rows[1].status, 'confirmed');
  });

  // ------------------------------------------------------------
  // 6. FIFO Waiting-List Promotion under Cancellation
  // ------------------------------------------------------------
  it('6. FIFO waiting-list promotion (oldest entry promoted first in PostgreSQL)', async (t) => {
    if (!isPgAvailable) {
      t.skip('NOT RUN: Real PostgreSQL is not reachable on host (host lacks PostgreSQL daemon/Docker).');
      return;
    }

    // Flight 6 (AI-999) is seeded with 100% occupied seats
    // User A joins waiting list (Queue Position #1)
    const wlA = await request(app)
      .post('/api/reservations/waiting-list')
      .set('Authorization', `Bearer ${authTokenUserA}`)
      .send({ flightId: 6, passengerName: 'FIFO Pioneer A', seatPreference: 'window' });
    assert.strictEqual(wlA.status, 201);

    // User B joins waiting list (Queue Position #2)
    const wlB = await request(app)
      .post('/api/reservations/waiting-list')
      .set('Authorization', `Bearer ${authTokenUserB}`)
      .send({ flightId: 6, passengerName: 'FIFO Successor B', seatPreference: 'aisle' });
    assert.strictEqual(wlB.status, 201);

    // Create a confirmed reservation on flight 6 to cancel
    // Set seat 401 available temporarily in PostgreSQL to create initial confirmed booking
    await testPool.query("UPDATE seats SET status = 'available' WHERE id = 401");
    const bookF6 = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${authTokenUserA}`)
      .send({ flightId: 6, seatId: 401, passengerName: 'Temp Passenger' });
    assert.strictEqual(bookF6.status, 201);

    // Cancel this reservation -> Triggers FIFO auto-promotion
    const cancelF6 = await request(app)
      .delete(`/api/reservations/${bookF6.body.reservation.id}`)
      .set('Authorization', `Bearer ${authTokenUserA}`);
    assert.strictEqual(cancelF6.status, 200);

    // Assert that User A (the OLDEST waiting passenger) was promoted
    assert.ok(cancelF6.body.promotedPassenger);
    assert.strictEqual(cancelF6.body.promotedPassenger.passengerName, 'FIFO Pioneer A');

    // Direct PostgreSQL inspection: User A is 'promoted', User B is 'waiting'
    const wlCheckA = await testPool.query('SELECT status FROM waiting_list WHERE id = $1', [wlA.body.waitingRecord.id]);
    assert.strictEqual(wlCheckA.rows[0].status, 'promoted');

    const wlCheckB = await testPool.query('SELECT status FROM waiting_list WHERE id = $1', [wlB.body.waitingRecord.id]);
    assert.strictEqual(wlCheckB.rows[0].status, 'waiting');
  });

  // ------------------------------------------------------------
  // 7. Dynamic Seat Availability
  // ------------------------------------------------------------
  it('7. Dynamic seat availability calculation in real PostgreSQL (COUNT FILTER)', async (t) => {
    if (!isPgAvailable) {
      t.skip('NOT RUN: Real PostgreSQL is not reachable on host (host lacks PostgreSQL daemon/Docker).');
      return;
    }

    // 1. Initial count for flight 2
    const initRes = await request(app).get('/api/flights/2');
    assert.strictEqual(initRes.status, 200);
    const initialAvailable = initRes.body.flight.availableSeats;
    assert.strictEqual(typeof initialAvailable, 'number');

    // Find an available seat on flight 2
    const seatsRes = await request(app).get('/api/flights/2/seats');
    const freeSeat = seatsRes.body.seats.find(s => s.status === 'available');
    assert.ok(freeSeat);

    // Book it
    const book = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${authTokenUserA}`)
      .send({ flightId: 2, seatId: freeSeat.id, passengerName: 'Count Tester' });
    assert.strictEqual(book.status, 201);

    // Count must decrement by 1
    const decrementedRes = await request(app).get('/api/flights/2');
    assert.strictEqual(decrementedRes.body.flight.availableSeats, initialAvailable - 1);

    // Cancel booking
    await request(app)
      .delete(`/api/reservations/${book.body.reservation.id}`)
      .set('Authorization', `Bearer ${authTokenUserA}`);

    // Count must increment back to initial
    const restoredRes = await request(app).get('/api/flights/2');
    assert.strictEqual(restoredRes.body.flight.availableSeats, initialAvailable);
  });

  // ------------------------------------------------------------
  // 8. Duplicate Waiting-List Prevention
  // ------------------------------------------------------------
  it('8. Duplicate waiting-list prevention (PostgreSQL active status check)', async (t) => {
    if (!isPgAvailable) {
      t.skip('NOT RUN: Real PostgreSQL is not reachable on host (host lacks PostgreSQL daemon/Docker).');
      return;
    }

    // Register User C
    const regC = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Unique Waiter',
        email: `unique.waiter.${Date.now()}@flysmart.demo`,
        password: 'password123',
      });
    const tokenC = regC.body.token;

    // First entry on full flight 6
    const entry1 = await request(app)
      .post('/api/reservations/waiting-list')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({ flightId: 6, passengerName: 'Unique Waiter' });
    assert.strictEqual(entry1.status, 201);

    // Second entry for the SAME user and flight must be rejected with 409
    const entry2 = await request(app)
      .post('/api/reservations/waiting-list')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({ flightId: 6, passengerName: 'Unique Waiter Again' });
    assert.strictEqual(entry2.status, 409);
    assert.strictEqual(entry2.body.error.code, 'ALREADY_WAITING');
  });

  // ------------------------------------------------------------
  // 9. Identifier Uniqueness across Backend Restarts
  // ------------------------------------------------------------
  it('9. Identifier uniqueness across backend restarts (PostgreSQL disk-persisted sequences)', async (t) => {
    if (!isPgAvailable) {
      t.skip('NOT RUN: Real PostgreSQL is not reachable on host (host lacks PostgreSQL daemon/Docker).');
      return;
    }

    // Fetch the current sequence value in PostgreSQL
    const seqCheck1 = await testPool.query("SELECT nextval('reservations_id_seq') AS next_val");
    const val1 = parseInt(seqCheck1.rows[0].next_val, 10);

    // Simulate backend server restart by resetting connection pool
    configurePgPool(TEST_DB_URL);

    // Fetch sequence value again after "restart"
    const seqCheck2 = await testPool.query("SELECT nextval('reservations_id_seq') AS next_val");
    const val2 = parseInt(seqCheck2.rows[0].next_val, 10);

    // Values must strictly increment on PostgreSQL disk, never reset to 1
    assert.strictEqual(val2, val1 + 1);
  });
});
