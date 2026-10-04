// ============================================================
// reservationRoutes.js - Flight Reservation & Cancellation Routing
// ============================================================

import { Router } from 'express';
import {
  createReservation,
  getReservations,
  getReservationById,
  cancelReservation,
} from '../controllers/reservationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateReservation } from '../middleware/validate.js';

const router = Router();

// All reservation endpoints require JWT authentication
router.use(authenticate);

router.post('/', validateReservation, createReservation);
router.get('/', getReservations);
router.get('/:id', getReservationById);
router.delete('/:id', cancelReservation);

export default router;
