// ============================================================
// flightController.js - Flight Query & Cabin Layout Handlers
// Integrates server-side SelectionSort for price ordering
// ============================================================

import { db } from '../config/db.js';
import { selectionSort } from '../dsa/SelectionSort.js';

export async function getFlights(req, res, next) {
  try {
    const { from, to, sortBy } = req.query;

    let queryText = 'SELECT * FROM flights';
    let params = [];

    if (from && to) {
      queryText += ' WHERE LOWER(origin) = LOWER($1) AND LOWER(destination) = LOWER($2)';
      params = [from, to];
    }

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
      flights: flights.map(f => ({
        id: f.id,
        flightNumber: f.flight_number,
        airline: f.airline,
        from: f.origin,
        to: f.destination,
        departure: f.departure_time,
        arrival: f.arrival_time,
        duration: f.duration,
        price: Number(f.base_price),
        availableSeats: f.availableSeats ?? 80,
        totalSeats: f.totalSeats ?? 80,
        aircraft: f.aircraft_id === 1 ? 'Airbus A320neo' : 'Boeing 737-800',
        status: f.status,
      })),
      ...(sortMetadata ? { sortMetadata } : {}),
    });
  } catch (err) {
    next(err);
  }
}

export async function getFlightById(req, res, next) {
  try {
    const flightId = Number(req.params.id);
    const result = await db.query('SELECT * FROM flights WHERE id = $1', [flightId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'FLIGHT_NOT_FOUND',
          message: `Flight schedule with ID ${flightId} not found.`,
        },
      });
    }

    const f = result.rows[0];
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
        availableSeats: f.availableSeats ?? 80,
        totalSeats: f.totalSeats ?? 80,
        status: f.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getFlightSeats(req, res, next) {
  try {
    const flightId = Number(req.params.id);

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

    const result = await db.query('SELECT * FROM seats WHERE flight_id = $1', [flightId]);

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
