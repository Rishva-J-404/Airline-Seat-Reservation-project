import type { Flight } from '../types';

export const MOCK_FLIGHTS: Flight[] = [
  {
    flightNumber: 'AI-201',
    airline: 'Air India',
    from: 'Coimbatore',
    to: 'Chennai',
    departure: '08:30',
    arrival: '10:00',
    duration: '1h 30m',
    price: 2500,
    availableSeats: 12,
    totalSeats: 80,
    aircraft: 'Airbus A320',
  },
  {
    flightNumber: '6E-402',
    airline: 'IndiGo',
    from: 'Coimbatore',
    to: 'Chennai',
    departure: '10:15',
    arrival: '11:45',
    duration: '1h 30m',
    price: 3200,
    availableSeats: 18,
    totalSeats: 180,
    aircraft: 'Airbus A320neo',
  },
  {
    flightNumber: 'SG-112',
    airline: 'SpiceJet',
    from: 'Coimbatore',
    to: 'Mumbai',
    departure: '13:00',
    arrival: '15:20',
    duration: '2h 20m',
    price: 4800,
    availableSeats: 8,
    totalSeats: 189,
    aircraft: 'Boeing 737-800',
  },
  {
    flightNumber: 'UK-305',
    airline: 'Vistara',
    from: 'Chennai',
    to: 'Delhi',
    departure: '06:45',
    arrival: '09:15',
    duration: '2h 30m',
    price: 5500,
    availableSeats: 22,
    totalSeats: 160,
    aircraft: 'Airbus A321',
  },
  {
    flightNumber: 'AI-410',
    airline: 'Air India',
    from: 'Mumbai',
    to: 'Bangalore',
    departure: '16:30',
    arrival: '18:00',
    duration: '1h 30m',
    price: 6200,
    availableSeats: 5,
    totalSeats: 80,
    aircraft: 'Boeing 787',
  },
];

export const INDIAN_CITIES = [
  'Ahmedabad',
  'Bangalore',
  'Chennai',
  'Coimbatore',
  'Delhi',
  'Goa',
  'Hyderabad',
  'Jaipur',
  'Kochi',
  'Kolkata',
  'Mumbai',
  'Pune',
  'Varanasi',
  'Visakhapatnam',
];

export function searchFlights(from: string, to: string): Flight[] {
  const query = (s: string) => s.toLowerCase().trim();
  return MOCK_FLIGHTS.filter(
    f =>
      (query(f.from) === query(from) || query(from) === '') &&
      (query(f.to) === query(to) || query(to) === '')
  );
}
