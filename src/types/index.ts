// ============================================================
// types/index.ts - All shared TypeScript interfaces and types
// ============================================================

export interface Passenger {
  passengerId: string;   // e.g. P101
  passengerName: string;
  name?: string;
  bookingId: string;     // e.g. B1001
  flightNumber: string;
  seatNumber: string;
  fare: number;
}

export interface Flight {
  flightNumber: string;
  airline: string;
  from: string;
  to: string;
  departure: string;   // "08:30"
  arrival: string;     // "10:00"
  duration: string;    // "1h 30m"
  price: number;       // in INR
  availableSeats: number;
  totalSeats: number;
  aircraft: string;
  origin?: string;
  destination?: string;
  departureTime?: any;
  arrivalTime?: any;
}

export type SeatStatus = 'available' | 'occupied' | 'selected' | 'recommended';
export type SeatType   = 'window' | 'aisle' | 'middle';

export interface Seat {
  id: string;              // "12A"
  row: number;
  col: string;             // "A" | "B" | "C" | "D"
  type: SeatType;
  hasExtraLegroom: boolean;
  isQuietZone: boolean;
  isFrontRow: boolean;
  status: SeatStatus;
  class?: string;
}

export interface TicketRequest {
  requestId: string;       // P01, P02 …
  passengerName: string;
  flightNumber: string;
  requestType: 'booking' | 'cancellation' | 'upgrade' | 'waiting';
  timestamp: Date;
}

export interface WaitingPassenger {
  id: string;              // WL-101
  requestId: string;
  userId?: string | number;
  passengerName: string;
  flightNumber: string;
  seatPreference?: string;
  queuePosition: number;
  status: 'waiting' | 'promoted' | 'cancelled';
  joinedAt: Date;
}

export interface Booking {
  bookingId: string;        // B1001
  id?: string;
  userId?: string | number;
  userEmail?: string;
  passenger: Passenger;
  flight: Flight;
  seat: Seat;
  bookingDate: Date;
  status: 'confirmed' | 'cancelled' | 'waiting';
}

export interface SeatPreferences {
  window: boolean;
  aisle: boolean;
  extraLegroom: boolean;
  frontRow: boolean;
  quietArea: boolean;
}

export interface SeatScoreBreakdown {
  windowPoints: number;
  aislePoints: number;
  legroomPoints: number;
  frontRowPoints: number;
  quietZonePoints: number;
  accessibilityBonus: number;
  totalScore: number;
}

export interface RecommendationResult {
  seat: Seat;
  score: number;
  reasons: string[];
  matchedPreferences: string[];
  breakdown?: SeatScoreBreakdown;
}

export type AlgorithmType = 'queue' | 'linkedlist' | 'bst' | 'sort' | 'ai';

export interface AlgorithmLogEntry {
  id: string;
  timestamp: Date;
  operation: string;
  detail: string;
  type: AlgorithmType;
}

export interface DsaStats {
  queueRequests: number;
  passengerRecords: number;
  bstNodes: number;
  flightsSorted: number;
  aiRecommendations: number;
  searchComparisons: number;
  waitingListCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'passenger' | 'admin';
}

export interface SearchParams {
  from: string;
  to: string;
  date: string;
  passengers: number;
}
