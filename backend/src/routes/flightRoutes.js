// ============================================================
// flightRoutes.js - Flight Schedules & Seat Matrix Routing
// ============================================================

import { Router } from 'express';
import { getFlights, getFlightById, getFlightSeats } from '../controllers/flightController.js';

const router = Router();

router.get('/', getFlights);
router.get('/:id', getFlightById);
router.get('/:id/seats', getFlightSeats);

export default router;
