// ============================================================
// db.js - PostgreSQL Relational Database Client with Fallback
// Provides single-client transaction execution (withTransaction),
// parameterized query(), and an in-memory transactional mock fallback.
// ============================================================

import pkg from 'pg';
const { Pool } = pkg;
import { ENV } from './env.js';

// Real PostgreSQL connection pool
let pgPool = null;
let useRealPg = false;

// In-memory relational tables for testing/development fallback when no DB is running
export const memDb = {
  users: [
    {
      id: 1,
      name: 'Neavis Rishva',
      email: 'neavis.rishva@flysmart.demo',
      password_hash: '$2b$10$epRhdXJ2bBfP2tS9F0aB5egwHqf94w8w1tBqfV98yV3.1eR8E0Dje', // password123
      role: 'passenger',
      created_at: new Date('2026-01-01T00:00:00Z'),
    },
    {
      id: 2,
      name: 'Priya Sharma',
      email: 'priya.sharma@flysmart.demo',
      password_hash: '$2b$10$epRhdXJ2bBfP2tS9F0aB5egwHqf94w8w1tBqfV98yV3.1eR8E0Dje',
      role: 'passenger',
      created_at: new Date('2026-01-01T00:00:00Z'),
    },
    {
      id: 3,
      name: 'Flight Operations Admin',
      email: 'admin@flysmart.demo',
      password_hash: '$2b$10$epRhdXJ2bBfP2tS9F0aB5egwHqf94w8w1tBqfV98yV3.1eR8E0Dje',
      role: 'admin',
      created_at: new Date('2026-01-01T00:00:00Z'),
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
    // Flight 6: 100% full flight to showcase CO1 FIFO Waiting Queue & Auto-Promotion
    { id: 6, flight_number: 'AI-999', airline: 'Air India', origin: 'Coimbatore', destination: 'Chennai', departure_time: '18:30', arrival_time: '20:00', duration: '1h 30m', base_price: 3500, aircraft_id: 1, status: 'scheduled' },
  ],
  seats: [],
  reservations: [],
  reservation_seats: [],
  waiting_list: [],
};

const COLS = ['A', 'B', 'C', 'D'];
const LEGROOM_ROWS = new Set([1, 10, 20]);
const OCCUPIED = new Set([
  '1B','1C','2A','2D','3B','4A','4C','5B','5D',
  '6A','6B','7C','7D','8A','9B','9C','10D',
  '11A','11B','12C','13A','13D','14B','14C',
  '15A','16B','17C','17D','18A','19B','20C',
]);

export function populateInitialSeats() {
  memDb.seats = [];
  let seatIdCounter = 1;
  for (const flight of memDb.flights) {
    for (let r = 1; r <= 20; r++) {
      for (const c of COLS) {
        const sNum = `${r}${c}`;
        const isOccupied = flight.id === 6 ? true : OCCUPIED.has(sNum);
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
          status: isOccupied ? 'occupied' : 'available',
        });
      }
    }
  }
}

populateInitialSeats();

let resIdCounter = 1;
let resSeatIdCounter = 1;
let waitingIdCounter = 1;

/**
 * Resets in-memory database to initial seeded state (useful for regression test isolation)
 */
export function resetMemDb() {
  populateInitialSeats();
  memDb.reservations = [];
  memDb.reservation_seats = [];
  memDb.waiting_list = [];
  resIdCounter = 1;
  resSeatIdCounter = 1;
  waitingIdCounter = 1;
}

// Initialize pg Pool if configured
if (process.env.DATABASE_URL || (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '')) {
  try {
    const config = process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host: ENV.DB_HOST,
          port: ENV.DB_PORT,
          database: ENV.DB_NAME,
          user: ENV.DB_USER,
          password: ENV.DB_PASSWORD,
        };

    pgPool = new Pool({
      ...config,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    useRealPg = true;
  } catch (err) {
    console.warn('[DB] Could not initialize PostgreSQL pool. Using memory store:', err.message);
  }
}

export function getPool() {
  return pgPool;
}

export function isUsingRealPg() {
  return useRealPg && Boolean(pgPool);
}

export function assertSafeTestDatabase(urlOrConfig) {
  const urlStr = typeof urlOrConfig === 'string' ? urlOrConfig : (urlOrConfig?.connectionString || '');
  if (urlStr) {
    try {
      const parsed = new URL(urlStr);
      const dbName = parsed.pathname.replace(/^\//, '');
      if (!dbName.includes('test') && process.env.ALLOW_TEST_DB_WIPE !== 'true') {
        throw new Error(`[SAFETY GUARD] Targeted database '${dbName}' is not a designated test database. Test database name must contain 'test'.`);
      }
    } catch (err) {
      if (err.message.includes('SAFETY GUARD')) throw err;
    }
  }
}

export function configurePgPool(connectionStringOrConfig) {
  assertSafeTestDatabase(connectionStringOrConfig);
  if (pgPool) {
    try {
      pgPool.end();
    } catch {}
  }
  const config = typeof connectionStringOrConfig === 'string'
    ? { connectionString: connectionStringOrConfig }
    : connectionStringOrConfig;

  pgPool = new Pool({
    ...config,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
  });
  useRealPg = true;
  return pgPool;
}

/**
 * Executes a callback within a managed transaction.
 *
 * For real PostgreSQL:
 * - Obtains a SINGLE dedicated client from pgPool via pool.connect()
 * - Executes BEGIN
 * - Executes callback(client)
 * - Executes COMMIT if callback succeeds
 * - Executes ROLLBACK if callback fails (handling rollback error without hiding original error)
 * - Releases client back to pool in finally
 *
 * For in-memory store:
 * - Simulates atomic rollback via table snapshots
 * - Note: In-memory simulation does not provide hardware/OS level multithreaded ACID guarantees of PostgreSQL
 */
export async function withTransaction(callback) {
  if (useRealPg && pgPool) {
    let client;
    try {
      client = await pgPool.connect();
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        console.warn('[DB] PostgreSQL unreachable, executing via local store transaction');
        return await executeMemTransaction(callback);
      }
      throw err;
    }

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (txnError) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('[DB] PostgreSQL ROLLBACK error:', rollbackError);
      }
      throw txnError;
    } finally {
      client.release();
    }
  }

  return await executeMemTransaction(callback);
}

/**
 * In-memory transaction simulator: creates a deep snapshot and reverts on error.
 */
async function executeMemTransaction(callback) {
  const snapshot = {
    seats: memDb.seats.map(s => ({ ...s })),
    reservations: memDb.reservations.map(r => ({ ...r })),
    reservation_seats: memDb.reservation_seats.map(rs => ({ ...rs })),
    waiting_list: memDb.waiting_list.map(w => ({ ...w })),
    users: memDb.users.map(u => ({ ...u })),
    resIdCounter,
    resSeatIdCounter,
    waitingIdCounter,
  };

  const mockClient = {
    query: async (text, params = []) => executeMemQuery(text, params),
  };

  try {
    const result = await callback(mockClient);
    return result;
  } catch (err) {
    // Revert state on transaction failure
    memDb.seats = snapshot.seats;
    memDb.reservations = snapshot.reservations;
    memDb.reservation_seats = snapshot.reservation_seats;
    memDb.waiting_list = snapshot.waiting_list;
    memDb.users = snapshot.users;
    resIdCounter = snapshot.resIdCounter;
    resSeatIdCounter = snapshot.resSeatIdCounter;
    waitingIdCounter = snapshot.waitingIdCounter;
    throw err;
  }
}

/**
 * Universal query function: executes standalone queries against real PostgreSQL or in-memory DB
 * @param {string} text SQL statement with $1, $2 placeholders
 * @param {Array} params Parameter values
 */
export async function query(text, params = []) {
  if (useRealPg && pgPool) {
    try {
      return await pgPool.query(text, params);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        console.warn('[DB] PostgreSQL unreachable, executing via local store');
      } else {
        throw err;
      }
    }
  }

  return executeMemQuery(text, params);
}

/**
 * In-memory SQL execution engine for standalone and transactional operations.
 */
function executeMemQuery(sql, params) {
  let normalized = sql.replace(/\s+/g, ' ').trim();

  // Strip locking clauses for simulator matching
  normalized = normalized
    .replace(/\s+FOR\s+UPDATE\s+SKIP\s+LOCKED/i, '')
    .replace(/\s+FOR\s+UPDATE/i, '');

  // Transaction control statements
  if (normalized === 'BEGIN' || normalized === 'COMMIT' || normalized === 'ROLLBACK') {
    return { rows: [], rowCount: 0 };
  }

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
    if (memDb.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      const err = new Error('Email already registered');
      err.code = '23505';
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
  if (normalized.includes('FROM flights') && !normalized.includes('WHERE id = $1') && !normalized.includes('WHERE f.id = $1')) {
    let rows = memDb.flights.map(f => {
      const availCount = memDb.seats.filter(s => s.flight_id === f.id && s.status === 'available').length;
      const totalCount = memDb.seats.filter(s => s.flight_id === f.id).length || 80;
      return {
        ...f,
        availableSeats: availCount,
        available_seats: availCount,
        totalSeats: totalCount,
        total_seats: totalCount,
      };
    });

    if (params.length >= 2 && params[0] && params[1]) {
      const from = String(params[0]).toLowerCase();
      const to = String(params[1]).toLowerCase();
      rows = rows.filter(f => f.origin.toLowerCase() === from && f.destination.toLowerCase() === to);
    }
    return { rows, rowCount: rows.length };
  }

  // 5. SELECT flight by ID
  if (normalized.includes('FROM flights WHERE id = $1') || (normalized.includes('FROM flights') && normalized.includes('WHERE f.id = $1'))) {
    const flight = memDb.flights.find(f => f.id === Number(params[0]));
    if (!flight) return { rows: [], rowCount: 0 };
    const availCount = memDb.seats.filter(s => s.flight_id === flight.id && s.status === 'available').length;
    const totalCount = memDb.seats.filter(s => s.flight_id === flight.id).length || 80;
    return {
      rows: [{
        ...flight,
        availableSeats: availCount,
        available_seats: availCount,
        totalSeats: totalCount,
        total_seats: totalCount,
      }],
      rowCount: 1,
    };
  }

  // 5b. SELECT COUNT of seats for flight
  if (normalized.includes('COUNT(*)') && normalized.includes('FROM seats WHERE flight_id = $1 AND status = $2')) {
    const flightId = Number(params[0]);
    const statusVal = String(params[1]);
    const count = memDb.seats.filter(s => s.flight_id === flightId && s.status === statusVal).length;
    return { rows: [{ count: String(count), available_count: String(count) }], rowCount: 1 };
  }

  // 6. SELECT seats for a flight
  if (normalized.includes('FROM seats WHERE flight_id = $1')) {
    const flightId = Number(params[0]);
    const seats = memDb.seats
      .filter(s => s.flight_id === flightId)
      .sort((a, b) => a.row_number - b.row_number || a.col_letter.localeCompare(b.col_letter));
    return { rows: seats.map(s => ({ ...s })), rowCount: seats.length };
  }

  // 7. SELECT seat by ID and check status / flight_id
  if (normalized.includes('FROM seats WHERE id = $1 AND flight_id = $2')) {
    const seatId = Number(params[0]);
    const flightId = Number(params[1]);
    const seat = memDb.seats.find(s => s.id === seatId && s.flight_id === flightId);
    return { rows: seat ? [{ ...seat }] : [], rowCount: seat ? 1 : 0 };
  }

  if (normalized.includes('FROM seats WHERE id = $1')) {
    const seat = memDb.seats.find(s => s.id === Number(params[0]));
    return { rows: seat ? [{ ...seat }] : [], rowCount: seat ? 1 : 0 };
  }

  // 8. UPDATE seat status with conditional check (Concurrency safe)
  if (normalized.startsWith('UPDATE seats SET status = $1 WHERE id = $2 AND status = $3')) {
    const [status, id, expectedStatus] = params;
    const seat = memDb.seats.find(s => s.id === Number(id));
    if (seat && seat.status === expectedStatus) {
      seat.status = status;
      return { rows: [{ ...seat }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // UPDATE seat status unconditional
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

  // 10. INSERT reservation_seats
  if (normalized.startsWith('INSERT INTO reservation_seats')) {
    const [reservation_id, seat_id, passenger_name, passenger_id_code] = params;
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

  // 11. SELECT reservation_seats by reservation_id
  if (normalized.includes('FROM reservation_seats WHERE reservation_id = $1')) {
    const resId = Number(params[0]);
    const matches = memDb.reservation_seats.filter(rs => rs.reservation_id === resId);
    return { rows: matches.map(m => ({ ...m })), rowCount: matches.length };
  }

  // 12. SELECT reservations by user (Joined across flights, reservation_seats, and seats)
  if (normalized.includes('FROM reservations') && (normalized.includes('WHERE user_id = $1') || normalized.includes('WHERE r.user_id = $1'))) {
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
          flight_number: flight?.flight_number,
          airline: flight?.airline,
          origin: flight?.origin,
          destination: flight?.destination,
          departure_time: flight?.departure_time,
          arrival_time: flight?.arrival_time,
          duration: flight?.duration,
          seat_id: seat?.id,
          seat_number: seat?.seat_number,
          passenger_name: resSeat?.passenger_name,
          passenger_id_code: resSeat?.passenger_id_code,
        };
      });
    return { rows: userRes, rowCount: userRes.length };
  }

  // 13. SELECT reservation by ID or booking reference
  if (normalized.includes('FROM reservations') && !normalized.includes('WHERE user_id = $1') && !normalized.includes('WHERE r.user_id = $1')) {
    const p1 = params[0];
    const p2 = params[1] !== undefined ? params[1] : p1;
    const r = memDb.reservations.find(res =>
      res.id === Number(p1) ||
      res.booking_reference.toLowerCase() === String(p1).toLowerCase() ||
      res.booking_reference.toLowerCase() === String(p2).toLowerCase()
    );
    if (!r) return { rows: [], rowCount: 0 };
    const flight = memDb.flights.find(f => f.id === r.flight_id);
    const resSeat = memDb.reservation_seats.find(rs => rs.reservation_id === r.id);
    const seat = resSeat ? memDb.seats.find(s => s.id === resSeat.seat_id) : null;
    return {
      rows: [{
        ...r,
        flight,
        flight_number: flight?.flight_number,
        airline: flight?.airline,
        origin: flight?.origin,
        destination: flight?.destination,
        departure_time: flight?.departure_time,
        arrival_time: flight?.arrival_time,
        duration: flight?.duration,
        seat_id: resSeat?.seat_id,
        seat_number: seat?.seat_number,
        passenger_name: resSeat?.passenger_name,
        passenger_id_code: resSeat?.passenger_id_code,
      }],
      rowCount: 1,
    };
  }

  // 14. CANCEL reservation with conditional check (supports ID or booking_reference)
  if (normalized.startsWith('UPDATE reservations SET status = $1') && normalized.includes('status = $')) {
    const status = params[0];
    const idOrRef = params[1];
    const expectedStatus = params[params.length - 1];

    const r = memDb.reservations.find(res =>
      (res.id === Number(idOrRef) ||
       res.booking_reference.toLowerCase() === String(idOrRef).toLowerCase() ||
       (params[2] !== undefined && res.booking_reference.toLowerCase() === String(params[2]).toLowerCase())) &&
      res.status === expectedStatus
    );
    if (r) {
      r.status = status;
      r.updated_at = new Date();
      return { rows: [{ ...r }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (normalized.startsWith('UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2') ||
      normalized.startsWith('UPDATE reservations SET status = $1 WHERE id = $2')) {
    const [status, id] = params;
    const r = memDb.reservations.find(res => res.id === Number(id) || res.booking_reference === String(id));
    if (r) {
      r.status = status;
      r.updated_at = new Date();
      return { rows: [{ ...r }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 14b. WAITING LIST: Check duplicate active entry
  if (normalized.includes('FROM waiting_list WHERE flight_id = $1 AND user_id = $2 AND status = $3')) {
    const flightId = Number(params[0]);
    const userId = Number(params[1]);
    const statusVal = params[2] || 'waiting';
    const found = memDb.waiting_list.filter(w => w.flight_id === flightId && w.user_id === userId && w.status === statusVal);
    return { rows: found.map(w => ({ ...w })), rowCount: found.length };
  }

  // 15. WAITING LIST: INSERT
  if (normalized.startsWith('INSERT INTO waiting_list')) {
    const [flight_id, user_id, passenger_name, request_id, seat_preference, status] = params;
    const newWL = {
      id: waitingIdCounter++,
      flight_id: Number(flight_id),
      user_id: Number(user_id),
      passenger_name,
      request_id,
      seat_preference: seat_preference || 'any',
      status: status || 'waiting',
      created_at: new Date(),
    };
    memDb.waiting_list.push(newWL);
    return { rows: [{ ...newWL }], rowCount: 1 };
  }

  // 16. WAITING LIST: COUNT
  if (normalized.includes('SELECT COUNT(*)') && normalized.includes('FROM waiting_list WHERE flight_id = $1 AND status = $2')) {
    const flightId = Number(params[0]);
    const statusVal = params[1] || 'waiting';
    const count = memDb.waiting_list.filter(w => w.flight_id === flightId && w.status === statusVal).length;
    return { rows: [{ count: String(count) }], rowCount: 1 };
  }

  // 17. WAITING LIST: SELECT active waiting for flight (FIFO order by created_at ASC, id ASC)
  if (normalized.includes('FROM waiting_list WHERE flight_id = $1 AND status = $2') || normalized.includes('FROM waiting_list WHERE flight_id = $1')) {
    const flightId = Number(params[0]);
    const statusVal = params[1] || 'waiting';
    let list = memDb.waiting_list
      .filter(w => w.flight_id === flightId && (!statusVal || w.status === statusVal))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at) || a.id - b.id);

    if (normalized.includes('LIMIT 1')) {
      list = list.slice(0, 1);
    }
    return { rows: list.map(w => ({ ...w })), rowCount: list.length };
  }

  // 18. WAITING LIST: UPDATE status
  if (normalized.startsWith('UPDATE waiting_list SET status = $1 WHERE id = $2')) {
    const [status, id] = params;
    const wl = memDb.waiting_list.find(w => w.id === Number(id));
    if (wl) {
      wl.status = status;
      return { rows: [{ ...wl }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  return { rows: [], rowCount: 0 };
}

export const db = {
  query,
  withTransaction,
  getPool,
  isUsingRealPg,
  resetMemDb,
};
