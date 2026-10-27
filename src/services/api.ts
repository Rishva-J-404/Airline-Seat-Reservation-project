// ============================================================
// api.ts - Full-Stack Backend API Service Client
// Connects the frontend to Express/PostgreSQL backend endpoints
// with JWT bearer auth, error normalization, and health checks
// ============================================================

import type {
  Flight,
  User,
  JoinWaitingListPayload,
  WaitingListResponse,
  WaitingListStatusResponse,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';
const TOKEN_KEY = 'airline_jwt_token';

// ---------------------------------------------------------------
// Custom Error Class
// ---------------------------------------------------------------
export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor(message: string, code = 'API_ERROR', statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ---------------------------------------------------------------
// Token Helpers
// ---------------------------------------------------------------
export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore quota error
    }
  },
  clear: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

// ---------------------------------------------------------------
// Core Fetch Wrapper
// ---------------------------------------------------------------
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = tokenStorage.get();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new ApiError(
      'Network request failed. Is the backend server running?',
      'NETWORK_ERROR',
      0,
      netErr
    );
  }

  // Parse JSON response
  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorPayload = data?.error;
    const message = errorPayload?.message || `Request failed with status ${response.status}`;
    const code = errorPayload?.code || 'HTTP_ERROR';
    throw new ApiError(message, code, response.status, errorPayload?.details);
  }

  return data as T;
}

// ---------------------------------------------------------------
// Auth API Endpoints
// ---------------------------------------------------------------
export interface AuthResponse {
  message: string;
  user: {
    id: number | string;
    name: string;
    email: string;
    role: string;
  };
  token: string;
}

export const authAPI = {
  register: async (payload: {
    name: string;
    email: string;
    password: string;
    role?: 'passenger' | 'admin';
  }): Promise<AuthResponse> => {
    const res = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) {
      tokenStorage.set(res.token);
    }
    return res;
  },

  login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) {
      tokenStorage.set(res.token);
    }
    return res;
  },

  getMe: async (): Promise<{ user: User }> => {
    return request<{ user: User }>('/auth/me', {
      method: 'GET',
    });
  },

  logout: (): void => {
    tokenStorage.clear();
  },
};

// ---------------------------------------------------------------
// Flights API Endpoints
// ---------------------------------------------------------------
export interface FlightsResponse {
  count: number;
  flights: Flight[];
  sortMetadata?: {
    algorithm: string;
    comparisons: number;
    swaps: number;
    timeComplexity: string;
    spaceComplexity: string;
  };
}

export interface FlightSeatsResponse {
  flightId: number;
  totalSeats: number;
  seats: Array<{
    id: number | string;
    seatNumber: string;
    row: number;
    col: string;
    type: 'window' | 'aisle' | 'middle';
    hasExtraLegroom: boolean;
    isQuietZone: boolean;
    isFrontRow: boolean;
    status: 'available' | 'occupied';
  }>;
}

export const flightsAPI = {
  getAll: async (params?: { from?: string; to?: string; sortBy?: string }): Promise<FlightsResponse> => {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.sortBy) query.set('sortBy', params.sortBy);

    const qs = query.toString();
    const endpoint = `/flights${qs ? `?${qs}` : ''}`;
    return request<FlightsResponse>(endpoint, { method: 'GET' });
  },

  getById: async (id: number | string): Promise<{ flight: Flight }> => {
    return request<{ flight: Flight }>(`/flights/${id}`, { method: 'GET' });
  },

  getSeats: async (flightId: number | string): Promise<FlightSeatsResponse> => {
    return request<FlightSeatsResponse>(`/flights/${flightId}/seats`, { method: 'GET' });
  },
};

// ---------------------------------------------------------------
// Reservations API Endpoints
// ---------------------------------------------------------------
export interface CreateReservationPayload {
  flightId: number | string;
  seatId: number | string;
  passengerName: string;
}

export interface ReservationResponse {
  message: string;
  reservation: {
    id: number;
    bookingReference: string;
    flightNumber: string;
    airline: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    seatNumber: string;
    passengerName: string;
    passengerIdCode: string;
    totalFare: number;
    status: 'confirmed' | 'cancelled';
    createdAt: string;
  };
  dsaReceipt?: {
    co1_queue: string;
    co2_manifest: string;
    co3_bst?: string;
    co4_bst?: string;
  };
}

export interface ReservationsListResponse {
  count: number;
  reservations: Array<{
    id: number;
    bookingReference: string;
    flightNumber: string;
    airline: string;
    origin: string;
    destination: string;
    departure: string;
    arrival: string;
    seatNumber: string;
    passengerName: string;
    totalFare: number;
    status: 'confirmed' | 'cancelled';
    createdAt: string;
  }>;
}

export const reservationsAPI = {
  create: async (payload: CreateReservationPayload): Promise<ReservationResponse> => {
    return request<ReservationResponse>('/reservations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getAll: async (): Promise<ReservationsListResponse> => {
    return request<ReservationsListResponse>('/reservations', { method: 'GET' });
  },

  getById: async (id: number | string): Promise<{ reservation: any }> => {
    return request<{ reservation: any }>(`/reservations/${id}`, { method: 'GET' });
  },

  cancel: async (id: number | string): Promise<{ message: string; reservationId: number; bookingReference?: string; status: string }> => {
    return request<{ message: string; reservationId: number; bookingReference?: string; status: string }>(`/reservations/${id}`, {
      method: 'DELETE',
    });
  },

  joinWaitingList: async (payload: JoinWaitingListPayload): Promise<WaitingListResponse> => {
    return request<WaitingListResponse>('/reservations/waiting-list', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getWaitingListStatus: async (flightId: number | string): Promise<WaitingListStatusResponse> => {
    return request<WaitingListStatusResponse>(`/reservations/waiting-list/${flightId}`, {
      method: 'GET',
    });
  },
};

// ---------------------------------------------------------------
// Health Check API
// ---------------------------------------------------------------
export const healthAPI = {
  check: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },
};
