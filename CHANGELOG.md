# Changelog

All notable changes to the **FlySmart Airline DSA Reservation System** (`airline-dsa-app`) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-04

### Added
- **CO1 Ticket Request Queue (`Queue.ts` / `Queue.js`)**: Singly-linked FIFO queue ADT for passenger reservation order processing ($O(1)$ enqueue, dequeue, peek, size).
- **CO2 Dynamic Passenger Linked List (`LinkedList.ts` / `LinkedList.js`)**: Linear singly-linked node chain managing flight manifests with head/tail insertion, node deletion, and search.
- **CO3 Binary Search Tree Index (`BST.ts` / `BST.js`)**: Key-indexed search tree for fast $O(\log n)$ booking verification with full node coordinate calculation for visual tree rendering.
- **CO3 Price Selection Sort (`SelectionSort.ts` / `SelectionSort.js`)**: Non-native sorting algorithm with step-by-step visual recording of comparisons, swaps, and current minimum pointers.
- **Innovation AI Heuristic (`seatRecommendation.ts`)**: Preference-weighted scoring engine evaluating window/aisle positioning, extra legroom (bulkhead/exit rows), and passenger seat preferences.
- **Production REST API Backend**: Express 4 server with rate limiting, error middleware, and SQLite/PostgreSQL relational data persistence.
- **JWT Authentication & Security**: Secure bcrypt password hashing, stateless JWT session tokens, and RBAC endpoint guards.
- **Interactive Visualizers**: Dedicated step-by-step interactive canvas/SVG visualizers for Queue, Linked List, BST, and Selection Sort.
- **Cinematic Flight Transition**: Smooth canvas-based flight animation between login authentication and user dashboard.
- **Automated Testing Suite**: 45 passing automated unit and integration tests (14 client DSA + 31 backend API tests).

### Fixed
- **Tenant Isolation**: Fixed cross-user reservation bleed where tickets from other sessions appeared in newly created passenger accounts. Implemented `isUserBooking()` session matching.
- **UI Cleanliness**: Streamlined the login interface by eliminating the hardcoded telemetry route chip.

### Security
- Added input sanitization against XSS in authentication and booking forms.
- Enforced client and server-side length limits for passenger names and credentials.
- Configured secure cookie headers, CORS controls, and brute-force rate limiters.
