// utils/idGenerator.ts - Generates typed IDs for the app

let requestCounter = 1;
let passengerCounter = 105;
let bookingCounter   = 1005;

export function generateRequestId(): string {
  return `P${String(requestCounter++).padStart(2, '0')}`;
}

export function generatePassengerId(): string {
  return `P${passengerCounter++}`;
}

export function generateBookingId(): string {
  return `B${bookingCounter++}`;
}

export function generateLogId(): string {
  return `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function resetCounters() {
  requestCounter = 1;
  passengerCounter = 105;
  bookingCounter = 1005;
}
