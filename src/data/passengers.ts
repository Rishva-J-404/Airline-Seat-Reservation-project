import type { Passenger, Booking } from '../types';
import { MOCK_FLIGHTS } from './flights';
import { DEFAULT_SEATS } from './seats';

export const MOCK_PASSENGERS: Passenger[] = [
  {
    passengerId: 'P101',
    passengerName: 'Neavis Rishva',
    bookingId: 'B1001',
    flightNumber: 'AI-201',
    seatNumber: '3A',
    fare: 2500,
  },
  {
    passengerId: 'P102',
    passengerName: 'Smeara Priya',
    bookingId: 'B1002',
    flightNumber: '6E-402',
    seatNumber: '7B',
    fare: 3200,
  },
  {
    passengerId: 'P103',
    passengerName: 'Starbin Kumar',
    bookingId: 'B1003',
    flightNumber: 'SG-112',
    seatNumber: '12A',
    fare: 4800,
  },
  {
    passengerId: 'P104',
    passengerName: 'Arvind Mehta',
    bookingId: 'B1004',
    flightNumber: 'UK-305',
    seatNumber: '5C',
    fare: 5500,
  },
];

export const SAMPLE_BOOKINGS: Booking[] = MOCK_PASSENGERS.map((p, idx) => ({
  bookingId: p.bookingId,
  passenger: p,
  flight: MOCK_FLIGHTS[idx] ?? MOCK_FLIGHTS[0],
  seat: DEFAULT_SEATS.find(s => s.id === p.seatNumber) ?? DEFAULT_SEATS[0],
  bookingDate: new Date(Date.now() - idx * 86400000),
  status: 'confirmed',
}));

// Booking IDs mapped to BST keys (numeric)
// B1001→1001, B1002→1002, etc.
export function bookingIdToKey(bookingId: string): number {
  return parseInt(bookingId.replace(/\D/g, ''), 10);
}
