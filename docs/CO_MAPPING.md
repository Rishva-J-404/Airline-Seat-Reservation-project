# FlySmart Aviation System - Academic Course Outcome (CO) Mapping

This document provides the definitive academic mapping between the **FlySmart Airline Seat Reservation System & DSA Laboratory** and standard undergraduate Computer Science **Data Structures & Algorithms (DSA)** Course Outcomes.

---

## 1. Course Outcome Summary Matrix

| Course Outcome | Description | Data Structure / Algorithm | Practical Airline Application | Status |
| :--- | :--- | :--- | :--- | :--- |
| **CO1** | Develop efficient solutions using relevant linear data structures. | **FIFO Queue** (`Queue.ts` / `Queue.js`) | Ticket booking request intake & fair waiting list buffer on full flights | **IMPLEMENTED** |
| **CO2** | Use dynamic data structures for efficient storage and retrieval. | **Singly Linked List** (`LinkedList.ts` / `LinkedList.js`) | Dynamic passenger manifest supporting dynamic check-in and cancellation | **IMPLEMENTED** |
| **CO3** | Evaluate the performance of searching and sorting algorithms for solving engineering problems. | **Selection Sort** & **Search Performance Lab** | In-place fare sorting ($O(n^2)$) and empirical comparison of Sequential vs BST search ($O(n)$ vs $O(\log n)$) | **IMPLEMENTED** |
| **CO4** | Develop tree structures for solving engineering problems. | **Binary Search Tree** (`BST.ts` / `BST.js`) | Hierarchical PNR/Booking reference indexing, binary search traversal, and in-order dump | **IMPLEMENTED** |
| **CO5** | Evaluate the applicability of graph data structures and traversal techniques for solving engineering problems. | **Graph Route Traversal** | Multi-city route network optimization (Dijkstra shortest path) | **NOT IMPLEMENTED** (Future Scope) |
| **Innovation** | Multi-factor heuristic constraint satisfaction. | **Intelligent Seat Recommendation Engine** | Explainable Top-3 ergonomic seat assignment based on weighted cabin attributes | **IMPLEMENTED** |

---

## 2. In-Depth Outcome Mapping

### CO1: Linear Data Structures (FIFO Queue)
- **Course Objective**: Formulate solutions requiring strict chronological sequencing and first-come, first-served (FIFO) discipline.
- **Implementation**: Pointer-based linked queue with designated `front` (head) and `rear` (tail) pointers.
- **Complexity**:
  - `enqueue(x)`: $O(1)$ time, $O(1)$ space.
  - `dequeue()`: $O(1)$ time, $O(1)$ space.
- **Application 1 - Ticket Request Intake**: When multiple booking requests arrive, they are enqueued into the ticket queue and processed sequentially to ensure transactional fairness.
- **Application 2 - Flight Waiting List**: When a flight has zero available seats (e.g. Flight `AI-999` with all 80 seats occupied), passengers join a FIFO waiting queue. When an existing passenger cancels, the front passenger in the waiting queue is automatically promoted to confirmed status.

---

### CO2: Dynamic Data Structures (Singly Linked List)
- **Course Objective**: Allocate and deallocate records dynamically without fixed array capacity limitations or contiguous reallocation penalties.
- **Implementation**: Pointer-linked node structure (`PassengerNode`) storing passenger code, name, flight number, seat number, and fare. Maintains head and tail pointers.
- **Complexity**:
  - `insertAtTail(record)`: $O(1)$ time with tail pointer.
  - `deleteByKey(passengerId)`: $O(n)$ search + $O(1)$ pointer splice.
  - `search(predicate)`: $O(n)$ linear traversal.
- **Application**: The **Passenger Manifest**. Passengers are appended to the manifest as they book and spliced out when cancelling.

---

### CO3: Searching & Sorting Performance Evaluation
- **Course Objective**: Measure, benchmark, and evaluate the empirical behavior and theoretical complexity of sorting and searching algorithms.
- **Implementation 1 - Manual Selection Sort**:
  - In-place quadratic sorting of flight fares.
  - Strictly avoids built-in `Array.prototype.sort()`.
  - Measures comparisons ($\frac{n(n-1)}{2}$), swaps, and intermediate visual states.
  - Provides a dedicated **Sorting Performance Lab** benchmarking datasets from $N = 10$ to $5,000$ to verify $O(n^2)$ quadratic growth.
- **Implementation 2 - Search Performance Lab**:
  - Dedicated empirical lab comparing **Linked List Linear Search ($O(n)$)** vs. **Binary Search Tree Search ($O(\log n)$)**.
  - Tests deterministic datasets across sizes: $N \in \{10, 50, 100, 500, 1000, 5000, 10000\}$.
  - Evaluates Best-Case, Average-Case, and Worst-Case search keys.
  - Accurately counts real operation comparisons (e.g., at $N = 1,000$: Linked List requires 500-1000 comparisons; BST requires only 10-14 comparisons).

---

### CO4: Tree Structures & Indexing (Binary Search Tree)
- **Course Objective**: Construct hierarchical tree data structures for logarithmic search and ordered traversals.
- **Implementation**: Pure Binary Search Tree (`BinarySearchTree`) indexing numeric PNR booking references (`B1001` $\to 1001$).
- **Complexity**:
  - `insert(key, bookingData)`: Average $O(\log n)$, Worst $O(n)$ (degenerate tree).
  - `search(key)`: Average $O(\log n)$, Worst $O(n)$.
  - `inorderTraversal()`: $O(n)$ yields strictly ascending sorted booking list.
- **Application**: The **Booking Reference Index**. Instant lookup of e-tickets and boarding passes with live SVG tree visualization and search path tracking.

---

### CO5: Graph Data Structures & Route Traversal
- **Status**: **NOT IMPLEMENTED**.
- **Academic Integrity Statement**: The current micro-project focuses thoroughly on Linear ADTs (CO1), Linked Lists (CO2), Searching & Sorting Analysis (CO3), and Binary Trees (CO4). Graph algorithms (such as Dijkstra's algorithm for multi-hop connecting flight route optimization across an airline hub network) are explicitly recognized as future scope and are not falsely claimed.

---

## 3. Viva Voce Preparation Questions & Model Answers

### Q1: Why did you use a custom Queue class instead of JavaScript `Array.push()` and `Array.shift()`?
> **Answer**: JavaScript's `Array.prototype.shift()` has $O(n)$ time complexity because removing the first element requires shifting all remaining $(n-1)$ elements in memory. Our custom linked queue maintains explicit `head` and `tail` pointers, guaranteeing strict $O(1)$ constant-time enqueue and dequeue operations, satisfying CO1 requirements.

### Q2: How does your cancellation process handle seat synchronization and waiting lists?
> **Answer**: When a reservation is cancelled, our backend runs an atomic transaction that: (1) marks the reservation as `cancelled`, (2) releases the physical seat in the database (`status = 'available'`), (3) splices the passenger node out of the manifest linked list, and (4) checks the flight's FIFO waiting list. If waiting passengers exist, the first waiting passenger is automatically allocated the released seat and promoted to confirmed status.

### Q3: Why does BST search outperform Linked List search in the Search Performance Lab?
> **Answer**: Sequential search in a Linked List checks elements one by one, giving linear $O(n)$ comparison complexity. A balanced BST divides the search space in half at every comparison (left if key is smaller, right if larger), reducing comparison complexity to logarithmic $O(\log n)$. For a dataset of $N = 10,000$, a linked list averages 5,000 comparisons, while a BST requires only approximately 14 comparisons.

### Q4: Is your Selection Sort implementation genuinely in-place?
> **Answer**: Yes. Our `selectionSort` algorithm divides the input array into a sorted subarray on the left and an unsorted subarray on the right. In each pass $i$, it finds the index of the minimum element in the range $[i, n-1]$ and performs at most one swap with index $i$. It allocates zero auxiliary arrays, maintaining strict $O(1)$ auxiliary space complexity.
