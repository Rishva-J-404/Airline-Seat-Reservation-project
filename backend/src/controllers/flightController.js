// ============================================================
// flightController.js - Flight Query & Cabin Layout Handlers
// Integrates server-side SelectionSort for price ordering and
// dynamic seat availability calculations from database state.
// ============================================================

import { db } from '../config/db.js';
import { selectionSort } from '../dsa/SelectionSort.js';

export async function getFlights(req, res, next) {
  try {
    const { from, to, sortBy } = req.query;

    let queryText = `
      SELECT 
        f.*,
        COALESCE(COUNT(s.id) FILTER (WHERE s.status = 'available'), 0)::int AS available_seats,
        COALESCE(COUNT(s.id), 0)::int AS total_seats
      FROM flights f
      LEFT JOIN seats s ON s.flight_id = f.id
    `;
    let params = [];

    if (from && to) {
      queryText += ' WHERE LOWER(f.origin) = LOWER($1) AND LOWER(f.destination) = LOWER($2)';
      params = [from, to];
    }

    queryText += ' GROUP BY f.id ORDER BY f.id ASC';

    const result = await db.query(queryText, params);
    let flights = result.rows;

    // Apply Academic Selection Sort if requested
    let sortMetadata = null;
    if (sortBy === 'price') {
      const sortResult = selectionSort(flights, (f) => Number(f.base_price || f.price));
      flights = sortResult.sorted;
      sortMetadata = {
        algorithm: 'Selection Sort',
        comparisons: sortResult.comparisons,
        swaps: sortResult.swaps,
        timeComplexity: 'O(n^2)',
        spaceComplexity: 'O(1)',
      };
    }

    res.status(200).json({
      count: flights.length,
      flights: flights.map(f => {
        const availableSeats = Number(f.available_seats !== undefined ? f.available_seats : (f.availableSeats ?? 80));
        const totalSeats = Number(f.total_seats !== undefined ? f.total_seats : (f.totalSeats ?? 80));
        return {
          id: f.id,
          flightNumber: f.flight_number,
          airline: f.airline,
          from: f.origin,
          to: f.destination,
          departure: f.departure_time,
          arrival: f.arrival_time,
          duration: f.duration,
          price: Number(f.base_price),
          availableSeats,
          totalSeats,
          aircraft: f.aircraft_id === 1 ? 'Airbus A320neo' : 'Boeing 737-800',
          status: f.status,
        };
      }),
      ...(sortMetadata ? { sortMetadata } : {}),
    });
  } catch (err) {
    next(err);
  }
}

export async function getFlightById(req, res, next) {
  try {
    const rawId = req.params.id;
    const flightId = parseInt(rawId, 10);
    if (isNaN(flightId) || flightId <= 0 || String(flightId) !== String(rawId).trim()) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: `Invalid flight ID "${rawId}". Flight ID must be a positive integer.`,
        },
      });
    }

    const result = await db.query(`
      SELECT 
        f.*,
        COALESCE(COUNT(s.id) FILTER (WHERE s.status = 'available'), 0)::int AS available_seats,
        COALESCE(COUNT(s.id), 0)::int AS total_seats
      FROM flights f
      LEFT JOIN seats s ON s.flight_id = f.id
      WHERE f.id = $1
      GROUP BY f.id
    `, [flightId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'FLIGHT_NOT_FOUND',
          message: `Flight schedule with ID ${flightId} not found.`,
        },
      });
    }

    const f = result.rows[0];
    const availableSeats = Number(f.available_seats !== undefined ? f.available_seats : (f.availableSeats ?? 80));
    const totalSeats = Number(f.total_seats !== undefined ? f.total_seats : (f.totalSeats ?? 80));

    res.status(200).json({
      flight: {
        id: f.id,
        flightNumber: f.flight_number,
        airline: f.airline,
        from: f.origin,
        to: f.destination,
        departure: f.departure_time,
        arrival: f.arrival_time,
        duration: f.duration,
        price: Number(f.base_price),
        availableSeats,
        totalSeats,
        status: f.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getFlightSeats(req, res, next) {
  try {
    const rawId = req.params.id;
    const flightId = parseInt(rawId, 10);
    if (isNaN(flightId) || flightId <= 0 || String(flightId) !== String(rawId).trim()) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: `Invalid flight ID "${rawId}". Flight ID must be a positive integer.`,
        },
      });
    }

    // Verify flight exists
    const flightCheck = await db.query('SELECT id FROM flights WHERE id = $1', [flightId]);
    if (flightCheck.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'FLIGHT_NOT_FOUND',
          message: `Flight with ID ${flightId} does not exist.`,
        },
      });
    }

    const result = await db.query('SELECT * FROM seats WHERE flight_id = $1 ORDER BY row_number ASC, col_letter ASC', [flightId]);

    res.status(200).json({
      flightId,
      totalSeats: result.rows.length,
      seats: result.rows.map(s => ({
        id: s.id,
        seatNumber: s.seat_number,
        row: s.row_number,
        col: s.col_letter,
        type: s.seat_type,
        hasExtraLegroom: s.has_extra_legroom,
        isQuietZone: s.is_quiet_zone,
        isFrontRow: s.is_front_row,
        status: s.status,
      })),
    });
  } catch (err) {
    next(err);
  }
}
