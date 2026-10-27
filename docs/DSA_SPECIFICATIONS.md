# FlySmart Aviation System - Data Structures & Algorithms Specification

This document provides formal technical specifications for the Data Structures and Algorithms (DSA) implemented across both the frontend client and the backend REST service in the FlySmart Aviation system.

---

## 1. Course Outcomes (CO) Mapping

| Outcome Code | Focus Area | Data Structure / Algorithm | Practical Airline Application |
| :--- | :--- | :--- | :--- |
| **CO1** | Linear Abstract Data Types | **FIFO Queue** (`Queue.ts` / `Queue.js`) | Ticket Booking Intake & Fair Waiting List Buffer |
| **CO2** | Dynamic Node-Linked Structures | **Singly Linked List** (`LinkedList.ts` / `LinkedList.js`) | Dynamic In-Memory Passenger Manifest |
| **CO3** | Searching & Sorting Performance Evaluation | **Selection Sort** & **Search Performance Lab** | Airfare Sorting & $O(n)$ LL vs $O(\log n)$ BST Empirical Benchmark |
| **CO4** | Tree Hierarchies & Indexing | **Binary Search Tree** (`BST.ts` / `BST.js`) | Fast Booking Reference Indexing & Tree Visualization |
| **CO5** | Graph Algorithms & Route Traversal | **NOT IMPLEMENTED** | Preserved as honest future scope (flight route network optimization) |
| **Innovation** | Multi-Factor Heuristic Optimization | **Intelligent Seat Recommendation Engine** | Explainable Top-3 Seat Allocation by Ergonomic Constraints |

---

## 2. In-Depth Algorithm Specifications

### 2.1 CO1: FIFO Queue (Linear ADT)
- **Primary Files**: `src/algorithms/Queue.ts` (Client) and `backend/src/dsa/Queue.js` (Server)
- **Design Pattern**: Singly linked node chain with `head` (front) and `tail` (rear) pointers.
- **Why Not an Array**: JavaScript `Array.prototype.shift()` has $O(n)$ time complexity due to index re-indexing. A linked node chain achieves strict $O(1)$ dequeuing.

#### Complexity Analysis:
| Operation | Time Complexity | Space Complexity | Description |
| :--- | :--- | :--- | :--- |
| `enqueue(item)` | $O(1)$ | $O(1)$ | Appends a new node to the `tail` pointer |
| `dequeue()` | $O(1)$ | $O(1)$ | Unlinks and returns the `head` node |
| `peek()` | $O(1)$ | $O(1)$ | Reads `head.value` without pointer mutation |
| `size()` | $O(1)$ | $O(1)$ | Maintained via tracked integer counter |
| `clear()` | $O(1)$ | $O(1)$ | Resets `head = null`, `tail = null`, `length = 0` |
| `toArray()` | $O(n)$ | $O(n)$ | Linear traversal to snapshot state for visualizer |

---

### 2.2 CO2: Dynamic Singly Linked List
- **Primary Files**: `src/algorithms/LinkedList.ts` (Client) and `backend/src/dsa/LinkedList.js` (Server)
- **Design Pattern**: Pointer chain with dynamic allocation.
- **Practical Application**: Real-time passenger manifest where passengers check in or cancel tickets dynamically without contiguous memory pre-allocation.

#### Complexity Analysis:
| Operation | Time Complexity | Space Complexity | Description |
| :--- | :--- | :--- | :--- |
| `insertAtHead(item)`| $O(1)$ | $O(1)$ | Prepends node; new node points to previous head |
| `insertAtTail(item)`| $O(1)$ | $O(1)$ | Directly links to `tail` pointer |
| `search(predicate)` | $O(n)$ | $O(1)$ | Sequential scan from head to tail |
| `deleteByKey(predicate)`| $O(n)$ | $O(1)$ | $O(n)$ scan to locate node, then $O(1)$ pointer splice |
| `clear()` | $O(1)$ | $O(1)$ | Dereferences head and tail pointers |

---

### 2.3 CO4: Binary Search Tree (Tree Structures & Indexing)
- **Primary Files**: `src/algorithms/BST.ts` (Client) and `backend/src/dsa/BST.js` (Server)
- **Design Pattern**: Recursive binary tree where left children have keys `< parent.key` and right children have keys `> parent.key`.
- **Search Metric**: Every search tracks both `comparisons` count and `path` history (`[1001, 1003, 1002]`). Note: While BST primarily satisfies **CO4 (Tree Structures)**, empirical search comparisons between BST and Linked List also contribute to **CO3 (Searching Performance Evaluation)**.

#### Complexity Analysis:
| Operation | Average Time | Worst-Case Time | Space Complexity |
| :--- | :--- | :--- | :--- |
| `insert(key, data)` | $O(\log n)$ | $O(n)$ | $O(1)$ iterative / $O(h)$ recursive stack |
| `search(key)` | $O(\log n)$ | $O(n)$ | $O(1)$ auxiliary |
| `inorderTraversal()`| $O(n)$ | $O(n)$ | $O(n)$ array output (sorted keys) |
| `getLayout(width, height)` | $O(n)$ | $O(n)$ | Computes SVG $(x, y)$ coordinates for visualization |

> **Academic Note**: The tree is a standard unbalanced BST. For sorted input sequences (e.g. inserting `1001`, `1002`, `1003` in ascending order), the tree degenerates into a singly linked list with $O(n)$ worst-case search time.

---

### 2.4 CO3: Selection Sort Algorithm
- **Primary Files**: `src/algorithms/SelectionSort.ts` (Client) and `backend/src/dsa/SelectionSort.js` (Server)
- **Design Pattern**: In-place comparison sort dividing the array into a sorted sublist (left) and unsorted sublist (right).
- **Academic Invariant**: Built-in methods (`Array.prototype.sort`) are strictly prohibited. The algorithm explicitly steps through finding the minimum element in each pass.

#### Complexity Analysis:
| Metric | Formula / Value | Notes |
| :--- | :--- | :--- |
| **Best-Case Time** | $O(n^2)$ | Always performs $\frac{n(n-1)}{2}$ comparisons |
| **Average Time** | $O(n^2)$ | Quadratic comparison complexity |
| **Worst-Case Time** | $O(n^2)$ | Unaffected by initial ordering |
| **Space Complexity**| $O(1)$ | In-place element swapping |
| **Total Comparisons** | $\frac{n(n-1)}{2}$ | For $n=5$: $\frac{5 \times 4}{2} = 10$ comparisons |
| **Maximum Swaps** | $n - 1$ | Highly efficient for expensive write mediums |

---

### 2.5 Innovation: Heuristic AI Seat Recommendation Engine
- **Primary File**: `src/services/seatRecommendation.ts`
- **Objective**: Evaluates passenger preferences against physical aircraft geometry (exit row legroom, quiet aft cabin, front rapid debarkation, window vs. aisle).

#### Scoring Matrix:
```
Score = Base Availability (10 pts)
      + [Window Match]       * 25 pts
      + [Aisle Match]        * 25 pts
      + [Extra Legroom Exit] * 30 pts
      + [Front Row Rapid Exit] * 20 pts
      + [Quiet Cabin Zone]   * 15 pts
```
The engine ranks all available seats in $O(m)$ time where $m$ is the count of available seats, and returns the highest-scoring seat along with human-readable rationale explanations.

---

## 3. Dual-Persona Architecture

The application enforces a strict separation between consumer travel UX and academic algorithmic exploration:

1. **Passenger Portal (`/dashboard`, `/flights/search`, `/flights/results`, `/flights/:id/seats`, `/booking/confirm`, `/bookings`)**:
   - Polished, professional airline design (Navy `#0a192f`, Slate `#475569`, Warm Amber `#d97706`).
   - Clean ticket cards, seat maps, e-boarding passes, and live flight search.
   - Zero raw Big-O complexity badges, debug telemetry, or academic distractions.

2. **Technical Core (`/dsa/*`)**:
   - Interactive algorithm laboratories for students, evaluators, and engineers.
   - Step-by-step sorting playback with comparisons/swaps metrics.
   - Real-time SVG tree rendering and linked-node chains.
   - Comprehensive complexity panels and course outcome rubrics.
