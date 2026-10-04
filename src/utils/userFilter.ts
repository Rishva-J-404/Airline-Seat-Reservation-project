import type { Booking, User } from '../types';

/**
 * Determines whether a flight booking belongs to the specified user.
 *
 * Enforces passenger tenant isolation:
 * 1. Administrator override: role === 'admin' can view all fleet bookings.
 * 2. Exact userId match.
 * 3. Exact userEmail match (case-insensitive).
 * 4. Passenger legal name match (case-insensitive & trimmed).
 */
export function isUserBooking(booking: Booking, user: User | null): boolean {
  if (!user) return false;

  // Administrators can inspect all fleet bookings
  if (user.role === 'admin') return true;

  // 1. Direct userId match
  if (booking.userId && String(booking.userId) === String(user.id)) {
    return true;
  }

  // 2. Direct userEmail match
  if (
    booking.userEmail &&
    user.email &&
    booking.userEmail.trim().toLowerCase() === user.email.trim().toLowerCase()
  ) {
    return true;
  }

  // 3. Passenger name match
  const bookingPassengerName = (
    booking.passenger?.passengerName ||
    booking.passenger?.name ||
    ''
  ).trim().toLowerCase();

  const currentUserName = (user.name || '').trim().toLowerCase();

  if (bookingPassengerName && currentUserName && bookingPassengerName === currentUserName) {
    return true;
  }

  return false;
}
