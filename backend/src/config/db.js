// ============================================================
// db.js - PostgreSQL Relational Database Client with Fallback
// Provides query(), getClient(), and transaction execution
// ============================================================

import pkg from 'pg';
const { Pool } = pkg;
import { ENV } from './env.js';

// Real PostgreSQL connection pool
let pgPool = null;
let useRealPg = false;

// In-memory relational tables for testing/development fallback when no DB is running
const memDb = {
  users: [
    {
      id: 1,
      name: 'Neavis Rishva',
      email: 'neavis.rishva@flysmart.demo',
      password_hash: '$2b$10$epRhdXJ2bBfP2tS9F0aB5egwHqf94w8w1tBqfV98yV3.1eR8E0Dje', // password123
      role: 'passenger',
      created_at: new Date(),
    },
    {
      id: 2,
      name: 'Priya Sharma',
      email: 'priya.sharma@flysmart.demo',
      password_hash: '$2b$10$epRhdXJ2bBfP2tS9F0aB5egwHqf94w8w1tBqfV98yV3.1eR8E0Dje',
      role: 'passenger',
      created_at: new Date(),
    },
  ],
  aircraft: [
    { id: 1, model: 'Airbus A320neo', total_rows: 20, seats_per_row: 4, capacity: 80 },
    { id: 2, model: 'Boeing 737-800', total_rows: 20, seats_per_row: 4, capacity: 80 },
    { id: 3, model: 'Airbus A321', total_rows: 20, seats_per_row: 4, capacity: 80 },
  ],
  flights: [
    { id: 1, flight_number: 'AI-201', airline: 'Air India', origin: 'Coimbatore', destination: 'Chennai', departure_time: '08:30', arrival_time: '10:00', duration: '1h 30m', base_price: 2500, aircraft_id: 1, status: 'scheduled' },
    { id: 2, flight_number: '6E-402', airline: 'IndiGo', origin: 'Coimbatore', destination: 'Chennai', departure_time: '10:15', arrival_time: '11:45', duration: '1h 30m', base_price: 3200, aircraft_id: 1, status: 'scheduled' },
    { id: 3, flight_number: 'SG-112', airline: 'SpiceJet', origin: 'Coimbatore', destination: 'Mumbai', departure_time: '13:00', arrival_time: '15:20', duration: '2h 20m', base_price: 4800, aircraft_id: 2, status: 'scheduled' },
    { id: 4, flight_number: 'UK-305', airline: 'Vistara', origin: 'Chennai', destination: 'Delhi', departure_time: '06:45', arrival_time: '09:15', duration: '2h 30m', base_price: 5500, aircraft_id: 3, status: 'scheduled' },
    { id: 5, flight_number: 'AI-410', airline: 'Air India', origin: 'Mumbai', destination: 'Bangalore', departure_time: '16:30', arrival_time: '18:00', duration: '1h 30m', base_price: 6200, aircraft_id: 1, status: 'scheduled' },
  ],
  seats: [],
  reservations: [],
  reservation_seats: [],
};

// Auto-populate 80 seats for each flight in memDb
const COLS = ['A', 'B', 'C', 'D'];
const LEGROOM_ROWS = new Set([1, 10, 20]);
const OCCUPIED = new Set([
  '1B','1C','2A','2D','3B','4A','4C','5B','5D',
  '6A','6B','7C','7D','8A','9B','9C','10D',
  '11A','11B','12C','13A','13D','14B','14C',
  '15A','16B','17C','17D','18A','19B','20C',
]);

let seatIdCounter = 1;
for (const flight of memDb.flights) {
  for (let r = 1; r <= 20; r++) {
    for (const c of COLS) {
      const sNum = `${r}${c}`;
      memDb.seats.push({
        id: seatIdCounter++,
        flight_id: flight.id,
        seat_number: sNum,
        row_number: r,
        col_letter: c,
        seat_type: c === 'A' || c === 'D' ? 'window' : 'aisle',
        has_extra_legroom: LEGROOM_ROWS.has(r),
        is_quiet_zone: r >= 15,
        is_front_row: r <= 5,
        status: OCCUPIED.has(sNum) ? 'occupied' : 'available',
      });
    }
  }
}

// Initialize pg Pool if configured
if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
  try {
    pgPool = new Pool({
      host: ENV.DB_HOST,
      port: ENV.DB_PORT,
      database: ENV.DB_NAME,
      user: ENV.DB_USER,
      password: ENV.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    useRealPg = true;
  } catch (err) {
    console.warn('[DB] Could not initialize PostgreSQL pool. Using memory store:', err.message);
  }
}

/**
 * Universal query function: executes against real PostgreSQL or in-memory DB
 * @param {string} text SQL statement with $1, $2 placeholders
 * @param {Array} params Parameter values
 */
export async function query(text, params = []) {
  if (useRealPg && pgPool) {
    try {
      return await pgPool.query(text, params);
    } catch (err) {
      // Fallback on connection error
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        console.warn('[DB] PostgreSQL unreachable, executing via local store');
      } else {
        throw err;
      }
    }
  }

  // Memory SQL Simulator for standard parameterized queries
  return executeMemQuery(text, params);
}

let resIdCounter = 1;
let resSeatIdCounter = 1;

function executeMemQuery(sql, params) {
  const normalized = sql.replace(/\s+/g, ' ').trim();

  // 1. SELECT user by email
  if (normalized.includes('FROM users WHERE email = $1')) {
    const user = memDb.users.find(u => u.email.toLowerCase() === (params[0] || '').toLowerCase());
    return { rows: user ? [{ ...user }] : [], rowCount: user ? 1 : 0 };
  }

  // 2. SELECT user by ID
  if (normalized.includes('FROM users WHERE id = $1')) {
    const user = memDb.users.find(u => u.id === Number(params[0]));
    return { rows: user ? [{ ...user }] : [], rowCount: user ? 1 : 0 };
  }

  // 3. INSERT user (Registration)
  if (normalized.startsWith('INSERT INTO users')) {
    const [name, email, password_hash, role] = params;
    // Check unique
    if (memDb.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      const err = new Error('Email already registered');
      err.code = '23505'; // Unique constraint violation code
      throw err;
    }
    const newUser = {
      id: memDb.users.length + 1,
      name,
      email,
      password_hash,
      role: role || 'passenger',
      created_at: new Date(),
    };
    memDb.users.push(newUser);
    return { rows: [{ ...newUser }], rowCount: 1 };
  }

  // 4. SELECT all flights
  if (normalized.includes('FROM flights') && !normalized.includes('WHERE id = $1')) {
    let rows = memDb.flights.map(f => {
      const availCount = memDb.seats.filter(s => s.flight_id === f.id && s.status === 'available').length;
      return { ...f, availableSeats: availCount, totalSeats: 80 };
    });

    if (params.length >= 2 && params[0] && params[1]) {
      const from = String(params[0]).toLowerCase();
      const to = String(params[1]).toLowerCase();
      rows = rows.filter(f => f.origin.toLowerCase() === from && f.destination.toLowerCase() === to);
    }
    return { rows, rowCount: rows.length };
  }

  // 5. SELECT flight by ID
  if (normalized.includes('FROM flights WHERE id = $1')) {
    const flight = memDb.flights.find(f => f.id === Number(params[0]));
    if (!flight) return { rows: [], rowCount: 0 };
    const availCount = memDb.seats.filter(s => s.flight_id === flight.id && s.status === 'available').length;
    return { rows: [{ ...flight, availableSeats: availCount, totalSeats: 80 }], rowCount: 1 };
  }

  // 6. SELECT seats for a flight
  if (normalized.includes('FROM seats WHERE flight_id = $1')) {
    const flightId = Number(params[0]);
    const seats = memDb.seats
      .filter(s => s.flight_id === flightId)
      .sort((a, b) => a.row_number - b.row_number || a.col_letter.localeCompare(b.col_letter));
    return { rows: seats.map(s => ({ ...s })), rowCount: seats.length };
  }

  // 7. SELECT seat by ID and check status
  if (normalized.includes('FROM seats WHERE id = $1')) {
    const seat = memDb.seats.find(s => s.id === Number(params[0]));
    return { rows: seat ? [{ ...seat }] : [], rowCount: seat ? 1 : 0 };
  }

  // 8. UPDATE seat status to occupied
  if (normalized.startsWith('UPDATE seats SET status = $1 WHERE id = $2')) {
    const [status, id] = params;
    const seat = memDb.seats.find(s => s.id === Number(id));
    if (seat) {
      seat.status = status;
      return { rows: [{ ...seat }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 9. INSERT reservation
  if (normalized.startsWith('INSERT INTO reservations')) {
    const [booking_reference, user_id, flight_id, total_fare, status] = params;
    const newRes = {
      id: resIdCounter++,
      booking_reference,
      user_id: Number(user_id),
      flight_id: Number(flight_id),
      total_fare: Number(total_fare),
      status: status || 'confirmed',
      created_at: new Date(),
      updated_at: new Date(),
    };
    memDb.reservations.push(newRes);
    return { rows: [{ ...newRes }], rowCount: 1 };
  }

  // 10. INSERT reservation_seats (Checks unique_seat_reservation)
  if (normalized.startsWith('INSERT INTO reservation_seats')) {
    const [reservation_id, seat_id, passenger_name, passenger_id_code] = params;
    const existing = memDb.reservation_seats.find(rs => rs.seat_id === Number(seat_id));
    if (existing) {
      const err = new Error('Duplicate seat booking conflict');
      err.code = '23505'; // Unique violation
      throw err;
    }
    const newResSeat = {
      id: resSeatIdCounter++,
      reservation_id: Number(reservation_id),
      seat_id: Number(seat_id),
      passenger_name,
      passenger_id_code,
    };
    memDb.reservation_seats.push(newResSeat);
    return { rows: [{ ...newResSeat }], rowCount: 1 };
  }

  // 11. SELECT reservations by user
  if (normalized.includes('FROM reservations') && normalized.includes('WHERE user_id = $1')) {
    const userId = Number(params[0]);
    const userRes = memDb.reservations
      .filter(r => r.user_id === userId)
      .map(r => {
        const flight = memDb.flights.find(f => f.id === r.flight_id);
        const resSeat = memDb.reservation_seats.find(rs => rs.reservation_id === r.id);
        const seat = resSeat ? memDb.seats.find(s => s.id === resSeat.seat_id) : null;
        return {
          ...r,
          flight,
          passenger_name: resSeat?.passenger_name,
          passenger_id_code: resSeat?.passenger_id_code,
          seat_number: seat?.seat_number,
        };
      });
    return { rows: userRes, rowCount: userRes.length };
  }

  // 12. SELECT reservation by ID
  if (normalized.includes('FROM reservations WHERE id = $1')) {
    const rId = Number(params[0]);
    const r = memDb.reservations.find(res => res.id === rId);
    if (!r) return { rows: [], rowCount: 0 };
    const flight = memDb.flights.find(f => f.id === r.flight_id);
    const resSeat = memDb.reservation_seats.find(rs => rs.reservation_id === r.id);
    const seat = resSeat ? memDb.seats.find(s => s.id === resSeat.seat_id) : null;
    return {
      rows: [{
        ...r,
        flight,
        passenger_name: resSeat?.passenger_name,
        passenger_id_code: resSeat?.passenger_id_code,
        seat_number: seat?.seat_number,
        seat_id: resSeat?.seat_id,
      }],
      rowCount: 1,
    };
  }

  // 13. CANCEL reservation (UPDATE status = 'cancelled')
  if (normalized.startsWith('UPDATE reservations SET status = $1 WHERE id = $2')) {
    const [status, id] = params;
    const r = memDb.reservations.find(res => res.id === Number(id));
    if (r) {
      r.status = status;
      // Free seat
      const resSeat = memDb.reservation_seats.find(rs => rs.reservation_id === r.id);
      if (resSeat) {
        const seat = memDb.seats.find(s => s.id === resSeat.seat_id);
        if (seat) seat.status = 'available';
      }
      return { rows: [{ ...r }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  return { rows: [], rowCount: 0 };
}

export const db = { query };
