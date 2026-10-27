# FlySmart Aviation System - Verification & Testing Guide

This document describes the testing strategy, test coverage, and commands to run automated tests for the FlySmart Airline Seat Reservation System & DSA Laboratory.

---

## 1. Test Suite Architecture

The system features test coverage across both frontend Data Structures & Algorithms algorithms and the backend REST API:

```text
├── Frontend DSA Tests (Vitest)
│   ├── Queue ADT (CO1) - Enqueue, Dequeue, Peek, Invariants
│   ├── Linked List (CO2) - Insert at Head/Tail, Search, Delete, Tail Pointer
│   ├── Binary Search Tree (CO4/CO3) - Insert, Search Path, Comparison Counting, Traversal
│   ├── Selection Sort (CO3) - In-place Sorting, Iterations, Comparison & Swap Tracking
│   └── Multi-Factor Recommendation - Heuristic Weights, Score Breakdown, Top-3 Ranking
│
└── Backend API & Relational Tests (Node.js Native Runner + Supertest)
    ├── auth.test.js - Registration, Password Hashing, Login, JWT Issuance, Duplicates
    ├── flights.test.js - List Flights, Filter Routes, Seat Map Query, Occupancy States
    ├── reservations.test.js - Concurrency (409 Conflict), Seat Release, Waiting List FIFO
    └── dsa.test.js - Server-side Queue, Linked List, BST, Selection Sort Verification
```

---

## 2. Test Execution Commands

### 2.1 Running Frontend DSA Tests
From the root project directory (`airline-dsa-app/`):
```bash
# Run client DSA test suite once
npm test -- --run

# Run client DSA test suite in watch mode
npm test
```

### 2.2 Running Backend API & Integration Tests
From the backend directory (`airline-dsa-app/backend/`):
```bash
# Run all backend tests
npm test

# Run specific test file (e.g., reservations)
node --test tests/reservations.test.js
```

### 2.3 Running Full-Stack Type Checks
```bash
# Ensure strict TypeScript compliance (0 errors)
npx tsc --noEmit
```

---

## 3. Key Test Cases & Verification Scenarios

### 3.1 Double-Booking Concurrency Test (`reservations.test.js`)
- **Scenario**: Two concurrent booking requests target the same seat (`1A`) on flight `AI-201`.
- **Expected Result**: First request commits successfully (HTTP 201 Created); second request receives HTTP 409 Conflict with code `SEAT_UNAVAILABLE` and message: `"Seat 1A is no longer available. Please select another seat."`

### 3.2 Cancellation & Seat Release Test (`reservations.test.js`)
- **Scenario**: Passenger books seat `2B`, confirms reservation, then submits `DELETE /api/reservations/:id`.
- **Expected Result**: Reservation status changes to `cancelled`, and database seat status transitions from `occupied` to `available`.

### 3.3 FIFO Waiting List Promotion Test (`reservations.test.js`)
- **Scenario**: Flight `AI-999` has 80/80 seats occupied. Passenger joins waiting list via `POST /api/reservations/waiting-list`. An existing passenger cancels their seat.
- **Expected Result**: The cancelled seat is immediately assigned to the first waiting passenger in FIFO order (`queue_position = 1`), updating their status to `promoted`.

### 3.4 In-Place Selection Sort Invariant (`dsa.test.ts`)
- **Scenario**: Sort array `[5500, 3200, 4800, 2500, 6200]`.
- **Expected Result**: Sorted array equals `[2500, 3200, 4800, 5500, 6200]`. Total comparisons equal $\frac{5 \times 4}{2} = 10$. Intermediate steps capture exact indices and swap states.

### 3.5 BST Search Path & Comparison Counting (`dsa.test.ts`)
- **Scenario**: Insert keys `[1005, 1002, 1008, 1001, 1004]`. Search for key `1004`.
- **Expected Result**: Found = `true`. Comparison count = 3. Search path = `[1005, 1002, 1004]`.
