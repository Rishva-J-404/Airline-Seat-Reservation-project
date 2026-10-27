// ============================================================
// flights.test.js - Flight Schedules & Seat Layout Tests
// ============================================================

import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Backend Flights Endpoints', () => {
  it('should return all scheduled flights with dynamic availableSeats', async () => {
    const res = await request(app).get('/api/flights');

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.flights.length >= 5);
    assert.strictEqual(res.body.flights[0].flightNumber, 'AI-201');
    assert.strictEqual(typeof res.body.flights[0].availableSeats, 'number');
    assert.strictEqual(typeof res.body.flights[0].totalSeats, 'number');
  });

  it('should filter flights by origin and destination', async () => {
    const res = await request(app).get('/api/flights?from=Coimbatore&to=Chennai');

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.flights.length >= 2);
    res.body.flights.forEach(f => {
      assert.strictEqual(f.from.toLowerCase(), 'coimbatore');
      assert.strictEqual(f.to.toLowerCase(), 'chennai');
    });
  });

  it('should sort flights by price using server-side selection sort', async () => {
    const res = await request(app).get('/api/flights?sortBy=price');

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.sortMetadata);
    assert.strictEqual(res.body.sortMetadata.algorithm, 'Selection Sort');

    // Verify prices are strictly in ascending order
    for (let i = 0; i < res.body.flights.length - 1; i++) {
      assert.ok(res.body.flights[i].price <= res.body.flights[i + 1].price);
    }
  });

  it('should return specific flight by ID with accurate availableSeats', async () => {
    const res = await request(app).get('/api/flights/1');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.flight.id, 1);
    assert.strictEqual(res.body.flight.flightNumber, 'AI-201');
    assert.strictEqual(typeof res.body.flight.availableSeats, 'number');
    assert.ok(res.body.flight.availableSeats > 0);
  });

  it('should return availableSeats = 0 for full demo flight 6 (AI-999)', async () => {
    const res = await request(app).get('/api/flights/6');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.flight.id, 6);
    assert.strictEqual(res.body.flight.flightNumber, 'AI-999');
    assert.strictEqual(res.body.flight.availableSeats, 0);
  });

  it('should return 400 INVALID_ID for non-numeric or non-positive flight ID', async () => {
    const res1 = await request(app).get('/api/flights/not-a-number');
    assert.strictEqual(res1.status, 400);
    assert.strictEqual(res1.body.error.code, 'INVALID_ID');

    const res2 = await request(app).get('/api/flights/-5/seats');
    assert.strictEqual(res2.status, 400);
    assert.strictEqual(res2.body.error.code, 'INVALID_ID');
  });

  it('should return 404 for non-existent flight ID', async () => {
    const res = await request(app).get('/api/flights/99999');

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error.code, 'FLIGHT_NOT_FOUND');
  });

  it('should return 80-seat aircraft layout for a flight', async () => {
    const res = await request(app).get('/api/flights/1/seats');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.flightId, 1);
    assert.strictEqual(res.body.totalSeats, 80);
    assert.ok(res.body.seats.length === 80);

    const seat1A = res.body.seats.find(s => s.seatNumber === '1A');
    assert.ok(seat1A);
    assert.strictEqual(seat1A.type, 'window');
    assert.strictEqual(seat1A.hasExtraLegroom, true);
  });
});
