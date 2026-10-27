// ============================================================
// reservationRoutes.js - Flight Reservation, Cancellation & Waiting List
// ============================================================

import { Router } from 'express';
import {
  createReservation,
  getReservations,
  getReservationById,
  cancelReservation,
  joinWaitingList,
  getWaitingListStatus,
} from '../controllers/reservationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateReservation } from '../middleware/validate.js';

const router = Router();

// All reservation endpoints require JWT authentication
router.use(authenticate);

router.post('/', validateReservation, createReservation);
router.get('/', getReservations);
router.get('/:id(\\d+)', getReservationById);
router.delete('/:id(\\d+)', cancelReservation);

// CO1 Waiting List Queue endpoints
router.post('/waiting-list', joinWaitingList);
router.get('/waiting-list/:flightId', getWaitingListStatus);

export default router;
