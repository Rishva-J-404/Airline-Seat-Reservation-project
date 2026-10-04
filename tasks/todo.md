# DSA Dashboard - Cleanup & Polish Todo

## Phase 1: Foundation Fixes
- [x] Task 1: Fix encoding corruption in idGenerator.ts
- [x] Task 2: Remove unused imports across pages (React, CheckCircle, AlertCircle etc.)
- [x] Task 3: Fix AppContext (remove unused useEffect, fix logStorage call)
- [x] Task 4: Fix QueueVisualizer to use real TicketRequest fields
- [x] Task 5: Remove the Record<string, unknown> hack from QueuePage.tsx
- [x] Checkpoint: Build passes - 0 errors

## Phase 2: Security Hardening
- [x] Task 6: Sanitize login input (trim, maxlength 100, strip HTML chars)
- [x] Task 7: Add ARIA labels and keyboard nav to login form
- [x] Task 8: Add Content-Security-Policy meta tag to index.html
- [x] Checkpoint: Login page secured for demo context

## Phase 3: UI Quality (frontend-ui-engineering)
- [x] Task 9: Split DSADashboard.tsx (1262 -> ~240 lines) into 5 tab sub-components
- [x] Task 9b: Add proper ARIA roles to tabs (role=tab, aria-selected, role=tabpanel)
- [x] Task 9c: Add keyboard accessibility to AI preference toggles (role=checkbox, onKeyDown)
- [x] Task 10: QueueVisualizer shows proper empty state with description
- [x] Task 11: Login has responsive layout, error state, loading state
- [x] Checkpoint: Build passes - 0 errors

## Phase 4: Code Review & Quality Hardening
- [x] Task 12: Fixed ReferenceError in BSTVisualizer (fromnode/tonode -> fromNode/toNode)
- [x] Task 13: Added strict null-check guard in BookingConfirmation.tsx
- [x] Task 14: Verified storageService methods (bookingStorage, logStorage.add, userStorage)
- [x] Task 15: Removed unused imports across 6 pages/components
- [x] Task 16: Fixed React compiler purity and setState-in-effect warnings across SelectionSortPage, DSADashboard, AppLayout, and FlightResults
- [x] Checkpoint: oxlint reports 0 errors; production build passes with 0 errors

## Phase 5: Skills Execution (TDD, Graphify, Performance)
- [x] Task 17: Build knowledge graph via graphify (356 nodes, 892 edges, 17 communities, graph.json, graph.html, GRAPH_REPORT.md)
- [x] Task 18: Implement TDD unit test suite for all DSA algorithms (`src/algorithms/__tests__/dsa.test.ts`)
- [x] Task 19: Wire `npm test` script into `package.json` (14/14 tests passing)
- [x] Task 20: Performance budget verified: JS 134kB gzipped (< 200kB target), CSS 9kB gzipped (< 50kB target), build 716ms

## DONE - App is verified, tested, and running at http://localhost:5173/
