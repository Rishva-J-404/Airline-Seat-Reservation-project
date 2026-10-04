// ============================================================
// storageService.ts - localStorage persistence helpers
// ============================================================

import type { Booking, AlgorithmLogEntry, User } from '../types';

const KEYS = {
  BOOKINGS: 'airline_bookings',
  LOG: 'airline_algo_log',
  USER: 'airline_user',
  QUEUE: 'airline_queue_snapshot',
  SEARCH: 'airline_search_params',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded - silently fail
  }
}

// Bookings
export const bookingStorage = {
  get: (): Booking[] => safeGet<Booking[]>(KEYS.BOOKINGS, []),
  set: (bookings: Booking[]) => safeSet(KEYS.BOOKINGS, bookings),
  add: (booking: Booking) => {
    const existing = bookingStorage.get();
    bookingStorage.set([...existing, booking]);
  },
  remove: (bookingId: string) => {
    const existing = bookingStorage.get();
    bookingStorage.set(existing.filter(b => b.bookingId !== bookingId));
  },
  clear: () => localStorage.removeItem(KEYS.BOOKINGS),
};

// Algorithm log
export const logStorage = {
  get: (): AlgorithmLogEntry[] => safeGet<AlgorithmLogEntry[]>(KEYS.LOG, []),
  add: (entry: AlgorithmLogEntry) => {
    const existing = logStorage.get();
    const updated = [entry, ...existing].slice(0, 100); // keep last 100
    safeSet(KEYS.LOG, updated);
  },
  clear: () => localStorage.removeItem(KEYS.LOG),
};

// User session
export const userStorage = {
  get: (): User | null => safeGet<User | null>(KEYS.USER, null),
  set: (user: User) => safeSet(KEYS.USER, user),
  clear: () => localStorage.removeItem(KEYS.USER),
};

// Queue snapshot (array of requestIds for display persistence)
export const queueStorage = {
  get: (): string[] => safeGet<string[]>(KEYS.QUEUE, []),
  set: (ids: string[]) => safeSet(KEYS.QUEUE, ids),
  clear: () => localStorage.removeItem(KEYS.QUEUE),
};

// Search params
export const searchStorage = {
  get: () => safeGet<{ from: string; to: string; date: string; passengers: number } | null>(KEYS.SEARCH, null),
  set: (params: { from: string; to: string; date: string; passengers: number }) => safeSet(KEYS.SEARCH, params),
};

export function clearAllStorage(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}
