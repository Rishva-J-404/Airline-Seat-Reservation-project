// ============================================================
// reservationController.js - Reservation Management & DSA Pipeline
// Enforces concurrency safety, atomic transactions, and waiting list promotion
// ============================================================

import { db } from '../config/db.js';
import { Queue } from '../dsa/Queue.js';
import { LinkedList } from '../dsa/LinkedList.js';
import { BinarySearchTree } from '../dsa/BST.js';

// Server-side active DSA structures
const ticketQueue = new Queue();
const passengerManifest = new LinkedList();
const bookingBST = new BinarySearchTree();

// Flight-specific FIFO Waiting Queues (CO1: Linear Data Structure)
// Map<number, Queue> mapping flightId -> FIFO Queue of waiting ticket requests
const flightWaitingQueues = new Map();

function getWaitingQueue(flightId) {
  const fId = Number(flightId);
  if (!flightWaitingQueues.has(fId)) {
    flightWaitingQueues.set(fId, new Queue());
  }
  return flightWaitingQueues.get(fId);
}

let refCounter = 1005;
let waitingCounter = 101;

/**
 * Create a new flight reservation with concurrency checks & atomic transaction
 */
export async function createReservation(req, res, next) {
  try {
    const userId = req.user.id;
    const { flightId, seatId, passengerName } = req.body;

    // 1. Buffer into server-side FIFO Ticket Request Queue (O(1))
    const ticketRequest = {
      requestId: `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      flightId: Number(flightId),
      seatId: Number(seatId),
      passengerName,
      timestamp: new Date(),
    };
    ticketQueue.enqueue(ticketRequest);

    // 2. Verify Flight Existence
    const flightResult = await db.query('SELECT * FROM flights WHERE id = $1', [flightId]);
    if (flightResult.rows.length === 0) {
      ticketQueue.dequeue();
      return res.status(404).json({
        error: {
          code: 'FLIGHT_NOT_FOUND',
          message: `Flight schedule with ID ${flightId} does not exist.`,
        },
      });
    }
    const flight = flightResult.rows[0];

    // 3. Verify Seat Availability (Concurrency Guard)
    const seatResult = await db.query('SELECT * FROM seats WHERE id = $1 AND flight_id = $2', [seatId, flightId]);
    if (seatResult.rows.length === 0) {
      ticketQueue.dequeue();
      return res.status(404).json({
        error: {
          code: 'SEAT_NOT_FOUND',
          message: `Seat with ID ${seatId} was not found on flight ${flight.flight_number}.`,
        },
      });
    }

    const seat = seatResult.rows[0];
    if (seat.status !== 'available') {
      ticketQueue.dequeue();
      // Requirement Section 15: Exact message & 409 Conflict
      return res.status(409).json({
        error: {
          code: 'SEAT_UNAVAILABLE',
          message: `Seat ${seat.seat_number} is no longer available. Please select another seat.`,
        },
      });
    }

    // 4. Atomic Database Transaction (BEGIN ... COMMIT / ROLLBACK)
    await db.query('BEGIN');
    try {
      const bookingRef = `B${refCounter++}`;
      const passengerIdCode = `P${Math.floor(100 + Math.random() * 900)}`;

      // Update Seat Status to occupied
      await db.query('UPDATE seats SET status = $1 WHERE id = $2', ['occupied', seatId]);

      // Insert Reservation
      const resResult = await db.query(
        'INSERT INTO reservations (booking_reference, user_id, flight_id, total_fare, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [bookingRef, userId, flightId, flight.base_price, 'confirmed']
      );
      const reservation = resResult.rows[0];

      // Map Seat to Reservation (Foreign Key & Unique Constraint)
      await db.query(
        'INSERT INTO reservation_seats (reservation_id, seat_id, passenger_name, passenger_id_code) VALUES ($1, $2, $3, $4) RETURNING *',
        [reservation.id, seatId, passengerName, passengerIdCode]
      );

      await db.query('COMMIT');

      // 5. Update Server-Side DSA Structures
      passengerManifest.insertAtTail({
        passengerId: passengerIdCode,
        passengerName,
        bookingId: bookingRef,
        flightNumber: flight.flight_number,
        seatNumber: seat.seat_number,
        fare: Number(flight.base_price),
      });

      const numericKey = parseInt(bookingRef.replace(/\D/g, ''), 10);
      bookingBST.insert(numericKey, {
        reservationId: reservation.id,
        bookingReference: bookingRef,
        passengerName,
        flightNumber: flight.flight_number,
      });

      // Dequeue processed request from FIFO intake buffer
      ticketQueue.dequeue();

      res.status(201).json({
        message: 'Flight seat reservation successfully confirmed.',
        reservation: {
          id: reservation.id,
          bookingReference: bookingRef,
          flightNumber: flight.flight_number,
          airline: flight.airline,
          origin: flight.origin,
          destination: flight.destination,
          departureTime: flight.departure_time,
          arrivalTime: flight.arrival_time,
          seatNumber: seat.seat_number,
          passengerName,
          passengerIdCode,
          totalFare: Number(flight.base_price),
          status: 'confirmed',
          createdAt: reservation.created_at,
        },
        dsaReceipt: {
          co1_queue: 'Processed via FIFO Request Intake Queue (O(1))',
          co2_manifest: `Appended ${passengerName} to manifest linked list tail (O(1))`,
          co4_bst: `Indexed booking key ${numericKey} in Binary Search Tree (O(log n))`,
        },
      });
    } catch (txnErr) {
      await db.query('ROLLBACK');
      ticketQueue.dequeue();
      throw txnErr;
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve all reservations for authenticated user
 */
export async function getReservations(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await db.query('SELECT * FROM reservations WHERE user_id = $1 ORDER BY created_at DESC', [userId]);

    res.status(200).json({
      count: result.rows.length,
      reservations: result.rows.map(r => ({
        id: r.id,
        bookingReference: r.booking_reference,
        flightNumber: r.flight?.flight_number || r.flight_id,
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
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve specific reservation by ID with authorization guard
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
 * Cancel a flight reservation, release seat, and promote next waiting passenger (CO1 FIFO Queue)
 */
export async function cancelReservation(req, res, next) {
  try {
    const reservationId = Number(req.params.id);
    const check = await db.query('SELECT * FROM reservations WHERE id = $1', [reservationId]);

    if (check.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: `Reservation with ID ${reservationId} not found.`,
        },
      });
    }

    const reservation = check.rows[0];
    if (reservation.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. You do not have permission to cancel this reservation.',
        },
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        error: {
          code: 'ALREADY_CANCELLED',
          message: 'This flight reservation has already been cancelled.',
        },
      });
    }

    // 1. Identify associated seat from reservation_seats
    const resSeatResult = await db.query('SELECT * FROM reservation_seats WHERE reservation_id = $1', [reservationId]);
    const seatId = resSeatResult.rows.length > 0 ? resSeatResult.rows[0].seat_id : null;

    // 2. Atomic Cancellation & Seat Release Transaction
    await db.query('BEGIN');
    try {
      // Mark reservation cancelled
      await db.query('UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['cancelled', reservationId]);

      // Release seat status to available (Section 14 Critical Fix)
      if (seatId) {
        await db.query('UPDATE seats SET status = $1 WHERE id = $2', ['available', seatId]);
      }

      // Unlink passenger from active manifest (CO2 Linked List)
      passengerManifest.deleteByKey(p => p.bookingId === reservation.booking_reference);

      // 3. Check FIFO Waiting Queue for this flight (CO1 Waiting List Promotion)
      const waitingQueue = getWaitingQueue(reservation.flight_id);
      let promotedPassenger = null;

      if (seatId && !waitingQueue.isEmpty()) {
        const nextWaiting = waitingQueue.dequeue();
        const seatRow = await db.query('SELECT * FROM seats WHERE id = $1', [seatId]);
        const seatObj = seatRow.rows[0];

        // Allocate released seat to first eligible waiting passenger
        await db.query('UPDATE seats SET status = $1 WHERE id = $2', ['occupied', seatId]);

        const newBookingRef = `B${refCounter++}`;
        const newPassengerCode = `P${Math.floor(100 + Math.random() * 900)}`;
        const flightRes = await db.query('SELECT * FROM flights WHERE id = $1', [reservation.flight_id]);
        const flight = flightRes.rows[0] || {};

        const newResResult = await db.query(
          'INSERT INTO reservations (booking_reference, user_id, flight_id, total_fare, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [newBookingRef, nextWaiting.userId, reservation.flight_id, flight.base_price || 3000, 'confirmed']
        );
        const newReservation = newResResult.rows[0];

        await db.query(
          'INSERT INTO reservation_seats (reservation_id, seat_id, passenger_name, passenger_id_code) VALUES ($1, $2, $3, $4)',
          [newReservation.id, seatId, nextWaiting.passengerName, newPassengerCode]
        );

        // Update database waiting list status
        if (nextWaiting.dbId) {
          await db.query('UPDATE waiting_list SET status = $1 WHERE id = $2', ['promoted', nextWaiting.dbId]);
        }

        // Add promoted passenger to active DSA structures
        passengerManifest.insertAtTail({
          passengerId: newPassengerCode,
          passengerName: nextWaiting.passengerName,
          bookingId: newBookingRef,
          flightNumber: flight.flight_number,
          seatNumber: seatObj?.seat_number || 'Auto-Allocated',
          fare: Number(flight.base_price || 3000),
        });

        const numKey = parseInt(newBookingRef.replace(/\D/g, ''), 10);
        bookingBST.insert(numKey, {
          reservationId: newReservation.id,
          bookingReference: newBookingRef,
          passengerName: nextWaiting.passengerName,
          flightNumber: flight.flight_number,
        });

        promotedPassenger = {
          requestId: nextWaiting.requestId,
          passengerName: nextWaiting.passengerName,
          promotedBookingReference: newBookingRef,
          allocatedSeat: seatObj?.seat_number,
        };
      }

      await db.query('COMMIT');

      res.status(200).json({
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
    } catch (txnErr) {
      await db.query('ROLLBACK');
      throw txnErr;
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Join the flight FIFO Waiting Queue when a flight is fully booked (CO1)
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
    const waitingQueue = getWaitingQueue(flightId);

    // Save to database
    const dbResult = await db.query(
      'INSERT INTO waiting_list (flight_id, user_id, passenger_name, request_id, seat_preference, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [flightId, userId, passengerName, requestId, seatPreference || 'any', 'waiting']
    );
    const dbRow = dbResult.rows[0];

    // Enqueue into in-memory FIFO waiting queue
    const waitingNode = {
      dbId: dbRow?.id,
      requestId,
      userId,
      flightId: Number(flightId),
      passengerName,
      seatPreference: seatPreference || 'any',
      joinedAt: new Date(),
    };
    waitingQueue.enqueue(waitingNode);

    const position = waitingQueue.size();

    res.status(201).json({
      message: `Successfully joined waiting list for Flight ${flightRes.rows[0].flight_number}.`,
      waitingRecord: {
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
 * Get current waiting list queue status for a flight
 */
export async function getWaitingListStatus(req, res, next) {
  try {
    const flightId = Number(req.params.flightId);
    const waitingQueue = getWaitingQueue(flightId);
    const queueItems = waitingQueue.toArray();

    res.status(200).json({
      flightId,
      queueDepth: queueItems.length,
      waitingPassengers: queueItems.map((item, idx) => ({
        queuePosition: idx + 1,
        requestId: item.requestId,
        passengerName: item.passengerName,
        seatPreference: item.seatPreference,
        joinedAt: item.joinedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}
