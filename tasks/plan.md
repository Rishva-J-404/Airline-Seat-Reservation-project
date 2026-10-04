# Implementation Plan: Airline DSA App - Cleanup and Polish

## Overview
The app was built by multiple models over several sessions which introduced:
1. Encoding corruption in a few files (BOM / garbled comment in idGenerator.ts)
2. Low-quality code artifacts from the flash model (unused imports, type casts, hack properties bolted on TicketRequest)
3. The flash-written DSADashboard.tsx is 53KB / 1262 lines — way too large, must be split
4. QueuePage.tsx casts TicketRequest to `Record<string, unknown>` and bolts on `.passengerId`/`.flightId` — a sign the visualizer was written against wrong field names
5. Login is demo-only (no real auth needed) but has no input sanitization or XSS guards
6. AppContext has `useEffect` imported but unused
7. Several pages use `import React` (not needed in React 17+/JSX transform)
8. `storageService.ts` `logStorage` has `.add()` method but AppContext calls `.set()` on it (patched earlier but fragile)

## Architecture Decisions
- Keep all DSA algorithms pure (no library helpers) — already correct
- Split DSADashboard into: DSADashboard.tsx (tabs/stats only) + per-tab sub-components
- Fix QueueVisualizer to use the actual TicketRequest fields (requestId, passengerName, flightNumber)
- Sanitize login input (trim, max length, strip dangerous chars) before dispatch
- Remove all `import React` that are only needed for JSX (React 17+ transform handles it)
- Fix encoding corruption in idGenerator.ts comment line

## Task List

### Phase 1: Foundation Fixes (encoding, types, imports)
- [x] Task 1: Fix encoding corruption in idGenerator.ts
- [x] Task 2: Remove unused imports across all pages (React, AlertCircle, ArrowRight, etc.)
- [x] Task 3: Fix AppContext (remove unused useEffect, fix logStorage.set -> logStorage.add)
- [x] Task 4: Fix QueueVisualizer to use real TicketRequest fields (requestId/passengerName/flightNumber)
- [x] Task 5: Remove the `.passengerId`/`.flightId` hack properties from QueuePage.tsx

### Checkpoint: Phase 1
- [ ] Build passes with 0 errors
- [ ] App loads without console errors

### Phase 2: Security Hardening (Login)
- [ ] Task 6: Sanitize login input (trim, maxlength 100, strip HTML/script chars, no XSS)
- [ ] Task 7: Add aria-labels and keyboard nav to login form
- [ ] Task 8: Add Content-Security-Policy meta tag to index.html

### Checkpoint: Phase 2
- [ ] Login page is secure for a demo app (no real auth required, but input safe)

### Phase 3: UI Quality (frontend-ui-engineering)
- [ ] Task 9: Split DSADashboard.tsx (1262 lines) into tab sub-components
- [ ] Task 10: Ensure all pages have loading/empty/error states
- [ ] Task 11: Verify responsive design on all key pages
- [ ] Task 12: Ensure all interactive elements are keyboard accessible

### Checkpoint: Phase 3
- [ ] App looks and behaves consistently on all pages
- [ ] No console errors at runtime

### Phase 4: Code Review Fixes
- [ ] Task 13: Review and fix any remaining type unsafe casts
- [ ] Task 14: Clean up dead code

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Split DSADashboard breaks state | High | Keep shared state in parent, pass down as props |
| Encoding fix corrupts other files | High | Use write_to_file tool only, never PowerShell Set-Content |
| Too many changes at once break build | Med | Fix, build, verify after each task |

## Open Questions
- None — user said "continue the project", scope is clear
