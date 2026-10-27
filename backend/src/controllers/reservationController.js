// ============================================================
// reservationController.js - Reservation Management & DSA Pipeline
// Enforces single-client PostgreSQL transactions, pessimistic row locking,
// double-booking concurrency prevention, safe cancellation, and persistent FIFO waiting list.
// ============================================================

import { db } from '../config/db.js';
import { Queue } from '../dsa/Queue.js';
import { LinkedList } from '../dsa/LinkedList.js';
import { BinarySearchTree } from '../dsa/BST.js';

// Server-side active DSA structures
export const ticketQueue = new Queue();
export const passengerManifest = new LinkedList();
export const bookingBST = new BinarySearchTree();

// Flight-specific FIFO Waiting Queues (CO1: Linear Data Structure)
// Map<number, Queue> mapping flightId -> FIFO Queue of waiting ticket requests
export const flightWaitingQueues = new Map();

export function getWaitingQueue(flightId) {
  const fId = Number(flightId);
  if (!flightWaitingQueues.has(fId)) {
    flightWaitingQueues.set(fId, new Queue());
  }
  return flightWaitingQueues.get(fId);
}

export function resetReservationDSA() {
  ticketQueue.clear();
  passengerManifest.clear();
  bookingBST.clear();
  flightWaitingQueues.clear();
  refCounter = 1005;
  waitingCounter = 101;
}

let refCounter = 1005;
let waitingCounter = 101;

/**
 * Create a new flight reservation with concurrency checks & atomic single-client transaction
 */
export async function createReservation(req, res, next) {
  try {
    const userId = req.user.id;
    const { flightId, seatId, passengerName } = req.body;

    if (!flightId || !seatId || !passengerName) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'flightId, seatId, and passengerName are required.',
        },
      });
    }

    // Wrap the authoritative availability check, row lock, and seat assignment in a managed transaction
    const bookingResult = await db.withTransaction(async (client) => {
      // 1. Verify Flight Existence
      const flightResult = await client.query('SELECT * FROM flights WHERE id = $1', [flightId]);
      if (flightResult.rows.length === 0) {
        const err = new Error(`Flight schedule with ID ${flightId} does not exist.`);
        err.statusCode = 404;
        err.code = 'FLIGHT_NOT_FOUND';
        throw err;
      }
      const flight = flightResult.rows[0];

      // 2. Lock requested seat row using SELECT ... FOR UPDATE (Pessimistic concurrency lock)
      const seatResult = await client.query(
        'SELECT * FROM seats WHERE id = $1 AND flight_id = $2 FOR UPDATE',
        [seatId, flightId]
      );
      if (seatResult.rows.length === 0) {
        const err = new Error(`Seat with ID ${seatId} was not found on flight ${flight.flight_number}.`);
        err.statusCode = 404;
        err.code = 'SEAT_NOT_FOUND';
        throw err;
      }

      const seat = seatResult.rows[0];

      // 3. Verify seat is available while holding the row lock
      if (seat.status !== 'available') {
        const err = new Error(`Seat ${seat.seat_number} is no longer available. Please select another seat.`);
        err.statusCode = 409;
        err.code = 'SEAT_UNAVAILABLE';
        throw err;
      }

      // 4. Update seat from available to occupied and verify update succeeded
      const seatUpdate = await client.query(
        'UPDATE seats SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
        ['occupied', seatId, 'available']
      );
      if (seatUpdate.rows.length === 0) {
        const err = new Error(`Seat ${seat.seat_number} is no longer available. Please select another seat.`);
        err.statusCode = 409;
        err.code = 'SEAT_UNAVAILABLE';
        throw err;
      }

      // 5. Insert confirmed reservation
      const bookingRef = `B${refCounter++}`;
      const passengerIdCode = `P${Math.floor(100 + Math.random() * 900)}`;

      const resResult = await client.query(
        'INSERT INTO reservations (booking_reference, user_id, flight_id, total_fare, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [bookingRef, userId, flightId, flight.base_price, 'confirmed']
      );
      const reservation = resResult.rows[0];

      // 6. Map Seat to Reservation in reservation_seats
      await client.query(
        'INSERT INTO reservation_seats (reservation_id, seat_id, passenger_name, passenger_id_code) VALUES ($1, $2, $3, $4) RETURNING *',
        [reservation.id, seatId, passengerName, passengerIdCode]
      );

      return {
        reservation,
        flight,
        seat: seatUpdate.rows[0] || seat,
        passengerIdCode,
        bookingRef,
      };
    });

    // 7. Transaction committed successfully - ONLY NOW update in-memory DSA structures
    const { reservation, flight, seat, passengerIdCode, bookingRef } = bookingResult;

    // Buffer in FIFO request queue
    ticketQueue.enqueue({
      requestId: `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      flightId: Number(flightId),
      seatId: Number(seatId),
      passengerName,
      timestamp: new Date(),
    });

    // Append to dynamic passenger manifest (CO2 Singly Linked List)
    passengerManifest.insertAtTail({
      passengerId: passengerIdCode,
      passengerName,
      bookingId: bookingRef,
      flightNumber: flight.flight_number,
      seatNumber: seat.seat_number,
      fare: Number(flight.base_price),
    });

    // Index booking in Binary Search Tree (CO4 BST)
    const numericKey = parseInt(bookingRef.replace(/\D/g, ''), 10);
    bookingBST.insert(numericKey, {
      reservationId: reservation.id,
      bookingReference: bookingRef,
      passengerName,
      flightNumber: flight.flight_number,
      seatNumber: seat.seat_number,
      totalFare: Number(flight.base_price),
    });

    return res.status(201).json({
      message: 'Flight seat reservation successfully confirmed.',
      reservation: {
        id: reservation.id,
        bookingReference: reservation.booking_reference,
        flightNumber: flight.flight_number,
        airline: flight.airline,
        origin: flight.origin,
        destination: flight.destination,
        departureTime: flight.departure_time,
        arrivalTime: flight.arrival_time,
        seatNumber: seat.seat_number,
        passengerName,
        passengerIdCode,
        totalFare: Number(reservation.total_fare),
        status: reservation.status,
        createdAt: reservation.created_at,
      },
      dsaReceipt: {
        co1_queue: 'Processed via FIFO Request Intake Queue (O(1))',
        co2_manifest: `Appended ${passengerName} to manifest linked list tail (O(1))`,
        co4_bst: `Indexed booking key ${numericKey} in Binary Search Tree (O(log n))`,
      },
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: {
          code: err.code || 'ERROR',
          message: err.message,
        },
      });
    }
    next(err);
  }
}

/**
 * Get all flight reservations for the authenticated user
 */
export async function getReservations(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await db.query('SELECT * FROM reservations WHERE user_id = $1 ORDER BY created_at DESC', [userId]);

    const formatted = result.rows.map(r => ({
      id: r.id,
      bookingReference: r.booking_reference,
      flightNumber: r.flight?.flight_number,
      airline: r.flight?.airline,
      origin: r.flight?.origin,
      destination: r.flight?.destination,
      departure: r.flight?.departure_time,
      arrival: r.flight?.arrival_time,
      seatNumber: r.seat_number,
      passengerName: r.passenger_name,
      totalFare: Number(r.total_fare),
      status: r.status,
      createdAt: r.created_at,
    }));

    res.status(200).json({
      count: formatted.length,
      reservations: formatted,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get specific flight reservation by ID with authorization check
 */
export async function getReservationById(req, res, next) {
  try {
    const reservationId = Number(req.params.id);
    const result = await db.query('SELECT * FROM reservations WHERE id = $1', [reservationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: `Reservation with ID ${reservationId} not found.`,
        },
      });
    }

    const r = result.rows[0];
    if (r.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. You do not own this flight reservation.',
        },
      });
    }

    res.status(200).json({
      reservation: {
        id: r.id,
        bookingReference: r.booking_reference,
        flightNumber: r.flight?.flight_number,
        airline: r.flight?.airline,
        origin: r.flight?.origin,
        destination: r.flight?.destination,
        departure: r.flight?.departure_time,
        arrival: r.flight?.arrival_time,
        seatNumber: r.seat_number,
        passengerName: r.passenger_name,
        totalFare: Number(r.total_fare),
        status: r.status,
        createdAt: r.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel a flight reservation, release seat, and atomically promote the oldest eligible waiting passenger (CO1 FIFO Queue)
 */
export async function cancelReservation(req, res, next) {
  try {
    const reservationId = Number(req.params.id);

    const cancelResult = await db.withTransaction(async (client) => {
      // 1. Lock reservation row using SELECT ... FOR UPDATE
      const check = await client.query('SELECT * FROM reservations WHERE id = $1 FOR UPDATE', [reservationId]);

      if (check.rows.length === 0) {
        const err = new Error(`Reservation with ID ${reservationId} not found.`);
        err.statusCode = 404;
        err.code = 'RESERVATION_NOT_FOUND';
        throw err;
      }

      const reservation = check.rows[0];
      if (reservation.user_id !== req.user.id && req.user.role !== 'admin') {
        const err = new Error('Access denied. You do not have permission to cancel this reservation.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }

      // Check status: only process when still confirmed
      if (reservation.status !== 'confirmed') {
        const err = new Error('This flight reservation has already been cancelled.');
        err.statusCode = 400;
        err.code = 'ALREADY_CANCELLED';
        throw err;
      }

      // 2. Identify and lock associated seat from reservation_seats
      const resSeatResult = await client.query('SELECT * FROM reservation_seats WHERE reservation_id = $1', [reservationId]);
      const seatId = resSeatResult.rows.length > 0 ? resSeatResult.rows[0].seat_id : null;

      // 3. Mark reservation cancelled only when it is still confirmed (Prevents simultaneous cancellation race)
      const updateRes = await client.query(
        'UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND status = $3 RETURNING *',
        ['cancelled', reservationId, 'confirmed']
      );
      if (updateRes.rows.length === 0) {
        const err = new Error('This flight reservation has already been cancelled.');
        err.statusCode = 400;
        err.code = 'ALREADY_CANCELLED';
        throw err;
      }

      // 4. Release seat in database
      let seatObj = null;
      if (seatId) {
        const seatUpdate = await client.query('UPDATE seats SET status = $1 WHERE id = $2 RETURNING *', ['available', seatId]);
        seatObj = seatUpdate.rows[0];
      }

      // 5. Query persistent waiting-list records (source of truth) for the oldest waiting passenger in FIFO order
      let promotedPassenger = null;
      if (seatId) {
        const waitingRes = await client.query(
          'SELECT * FROM waiting_list WHERE flight_id = $1 AND status = $2 ORDER BY created_at ASC, id ASC LIMIT 1 FOR UPDATE',
          [reservation.flight_id, 'waiting']
        );

        if (waitingRes.rows.length > 0) {
          const nextWaiting = waitingRes.rows[0];

          // Atomically reallocate released seat to the waiting passenger
          await client.query('UPDATE seats SET status = $1 WHERE id = $2', ['occupied', seatId]);

          // Update waiting list record status to 'promoted'
          await client.query('UPDATE waiting_list SET status = $1 WHERE id = $2', ['promoted', nextWaiting.id]);

          // Fetch flight info for base price
          const flightRes = await client.query('SELECT * FROM flights WHERE id = $1', [reservation.flight_id]);
          const flight = flightRes.rows[0] || {};

          const newBookingRef = `B${refCounter++}`;
          const newPassengerCode = `P${Math.floor(100 + Math.random() * 900)}`;

          // Create new confirmed reservation for the promoted passenger
          const newResResult = await client.query(
            'INSERT INTO reservations (booking_reference, user_id, flight_id, total_fare, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [newBookingRef, nextWaiting.user_id, reservation.flight_id, flight.base_price || 3000, 'confirmed']
          );
          const newReservation = newResResult.rows[0];

          // Map seat to the new reservation
          await client.query(
            'INSERT INTO reservation_seats (reservation_id, seat_id, passenger_name, passenger_id_code) VALUES ($1, $2, $3, $4) RETURNING *',
            [newReservation.id, seatId, nextWaiting.passenger_name, newPassengerCode]
          );

          promotedPassenger = {
            dbId: nextWaiting.id,
            requestId: nextWaiting.request_id,
            passengerName: nextWaiting.passenger_name,
            promotedBookingReference: newBookingRef,
            promotedReservationId: newReservation.id,
            newPassengerCode,
            allocatedSeat: seatObj?.seat_number || 'Seat Allocated',
            flightNumber: flight.flight_number,
            fare: Number(flight.base_price || 3000),
          };
        }
      }

      return {
        reservation,
        seatId,
        seatObj,
        promotedPassenger,
      };
    });

    // 6. Transaction committed successfully - ONLY NOW update in-memory DSA structures
    const { reservation, seatId, promotedPassenger } = cancelResult;

    // Unlink cancelled passenger from active manifest (CO2 Linked List)
    passengerManifest.deleteByKey(p => p.bookingId === reservation.booking_reference);

    if (promotedPassenger) {
      // Add promoted passenger to active manifest
      passengerManifest.insertAtTail({
        passengerId: promotedPassenger.newPassengerCode,
        passengerName: promotedPassenger.passengerName,
        bookingId: promotedPassenger.promotedBookingReference,
        flightNumber: promotedPassenger.flightNumber,
        seatNumber: promotedPassenger.allocatedSeat,
        fare: promotedPassenger.fare,
      });

      // Index in BST
      const numKey = parseInt(promotedPassenger.promotedBookingReference.replace(/\D/g, ''), 10);
      bookingBST.insert(numKey, {
        reservationId: promotedPassenger.promotedReservationId,
        bookingReference: promotedPassenger.promotedBookingReference,
        passengerName: promotedPassenger.passengerName,
        flightNumber: promotedPassenger.flightNumber,
      });

      // Sync in-memory FIFO waiting queue
      const waitingQueue = getWaitingQueue(reservation.flight_id);
      if (!waitingQueue.isEmpty()) {
        waitingQueue.dequeue();
      }
    }

    return res.status(200).json({
      message: `Reservation ${reservation.booking_reference} successfully cancelled. Seat has been released.`,
      reservationId,
      status: 'cancelled',
      seatReleased: true,
      seatId,
      promotedPassenger,
      dsaOperation: promotedPassenger
        ? `Waiting Queue Dequeue(${promotedPassenger.requestId}): Automatically promoted ${promotedPassenger.passengerName} to confirmed seat ${promotedPassenger.allocatedSeat}`
        : 'Seat returned to available inventory (no waiting passengers in queue)',
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: {
          code: err.code || 'ERROR',
          message: err.message,
        },
      });
    }
    next(err);
  }
}

/**
 * Join the flight FIFO Waiting Queue when a flight is fully booked (CO1)
 * Persists in database as source of truth and enqueues in memory for live visualizer
 */
export async function joinWaitingList(req, res, next) {
  try {
    const userId = req.user.id;
    const { flightId, passengerName, seatPreference } = req.body;

    if (!flightId || !passengerName) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Both flightId and passengerName are required to join the waiting list.',
        },
      });
    }

    const flightRes = await db.query('SELECT * FROM flights WHERE id = $1', [flightId]);
    if (flightRes.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'FLIGHT_NOT_FOUND',
          message: `Flight schedule with ID ${flightId} does not exist.`,
        },
      });
    }

    const requestId = `WL-${waitingCounter++}`;

    // 1. Persist in database (Source of truth)
    const dbResult = await db.query(
      'INSERT INTO waiting_list (flight_id, user_id, passenger_name, request_id, seat_preference, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [flightId, userId, passengerName, requestId, seatPreference || 'any', 'waiting']
    );
    const dbRow = dbResult.rows[0];

    // 2. Determine FIFO queue position based on persistent records
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM waiting_list WHERE flight_id = $1 AND status = $2',
      [flightId, 'waiting']
    );
    const position = Number(countResult.rows[0]?.count || 1);

    // 3. Mirror into server-side in-memory FIFO waiting queue for live visualizer
    const waitingQueue = getWaitingQueue(flightId);
    waitingQueue.enqueue({
      dbId: dbRow?.id,
      requestId,
      userId,
      flightId: Number(flightId),
      passengerName,
      seatPreference: seatPreference || 'any',
      joinedAt: new Date(),
    });

    res.status(201).json({
      message: `Successfully joined waiting list for Flight ${flightRes.rows[0].flight_number}.`,
      waitingRecord: {
        id: dbRow?.id,
        requestId,
        flightNumber: flightRes.rows[0].flight_number,
        passengerName,
        queuePosition: position,
        status: 'waiting',
        timestamp: new Date().toISOString(),
      },
      dsaReceipt: {
        co1_queue: `Enqueued ${requestId} into FIFO Waiting Queue (O(1)). Current Queue Depth: ${position}`,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current waiting list queue status for a flight directly from persistent database
 */
export async function getWaitingListStatus(req, res, next) {
  try {
    const flightId = Number(req.params.flightId);

    // Query database as the authoritative source of truth for pending passengers
    const result = await db.query(
      'SELECT * FROM waiting_list WHERE flight_id = $1 AND status = $2 ORDER BY created_at ASC, id ASC',
      [flightId, 'waiting']
    );

    // Sync in-memory queue if it was empty after restart
    const waitingQueue = getWaitingQueue(flightId);
    if (waitingQueue.isEmpty() && result.rows.length > 0) {
      for (const row of result.rows) {
        waitingQueue.enqueue({
          dbId: row.id,
          requestId: row.request_id,
          userId: row.user_id,
          flightId: Number(row.flight_id),
          passengerName: row.passenger_name,
          seatPreference: row.seat_preference,
          joinedAt: row.created_at,
        });
      }
    }

    res.status(200).json({
      flightId,
      queueDepth: result.rows.length,
      waitingPassengers: result.rows.map((row, idx) => ({
        queuePosition: idx + 1,
        id: row.id,
        requestId: row.request_id,
        passengerName: row.passenger_name,
        seatPreference: row.seat_preference,
        joinedAt: row.created_at,
        status: row.status,
      })),
    });
  } catch (err) {
    next(err);
  }
}
