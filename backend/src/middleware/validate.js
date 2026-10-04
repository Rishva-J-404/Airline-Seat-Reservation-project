// ============================================================
// validate.js - Input Validation & Sanitization Middleware
// ============================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req, res, next) {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    errors.push('Full name must be between 2 and 100 characters.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()) || email.trim().length > 150) {
    errors.push('Valid email address under 150 characters is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 128) {
    errors.push('Password must be between 6 and 128 characters long.');
  }

  if (errors.length > 0) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid registration parameters.',
        details: errors,
      },
    });
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('Valid email address is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required.',
        details: errors,
      },
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

export function validateReservation(req, res, next) {
  const { flightId, seatId, passengerName } = req.body || {};
  const errors = [];

  if (!flightId || isNaN(Number(flightId))) {
    errors.push('Valid flightId is required.');
  }

  if (!seatId || isNaN(Number(seatId))) {
    errors.push('Valid seatId is required.');
  }

  if (!passengerName || typeof passengerName !== 'string' || passengerName.trim().length < 2 || passengerName.trim().length > 100) {
    errors.push('Passenger name must be between 2 and 100 characters.');
  }

  if (errors.length > 0) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid reservation parameters.',
        details: errors,
      },
    });
  }

  req.body.passengerName = passengerName.trim();
  next();
}
