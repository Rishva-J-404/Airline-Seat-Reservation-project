import { describe, it } from 'node:test';
import assert from 'node:assert';

import { Queue } from '../Queue.ts';
import { LinkedList } from '../LinkedList.ts';
import { BinarySearchTree } from '../BST.ts';
import { selectionSort } from '../SelectionSort.ts';
import { recommendSeat } from '../../services/seatRecommendation.ts';
import { DEFAULT_SEATS } from '../../data/seats.ts';
import type { Passenger, SeatPreferences } from '../../types/index.ts';

describe('CO1: Queue Data Structure (FIFO)', () => {
  it('should initialize as empty', () => {
    const queue = new Queue<string>();
    assert.strictEqual(queue.isEmpty(), true);
    assert.strictEqual(queue.size(), 0);
    assert.strictEqual(queue.peek(), undefined);
  });

  it('should maintain strict First-In First-Out (FIFO) ordering', () => {
    const queue = new Queue<string>();
    queue.enqueue('REQ-001');
    queue.enqueue('REQ-002');
    queue.enqueue('REQ-003');

    assert.strictEqual(queue.size(), 3);
    assert.strictEqual(queue.peek(), 'REQ-001');

    assert.strictEqual(queue.dequeue(), 'REQ-001');
    assert.strictEqual(queue.peek(), 'REQ-002');
    assert.strictEqual(queue.size(), 2);

    assert.strictEqual(queue.dequeue(), 'REQ-002');
    assert.strictEqual(queue.dequeue(), 'REQ-003');
    assert.strictEqual(queue.dequeue(), undefined);
    assert.strictEqual(queue.isEmpty(), true);
  });

  it('should clear all nodes from the queue', () => {
    const queue = new Queue<number>();
    queue.enqueue(10);
    queue.enqueue(20);
    queue.clear();
    assert.strictEqual(queue.isEmpty(), true);
    assert.strictEqual(queue.size(), 0);
  });
});

describe('CO2: Singly Linked List Data Structure', () => {
  it('should append and prepend nodes correctly', () => {
    const list = new LinkedList<string>();
    list.insertAtTail('Second');
    list.insertAtHead('First');
    list.insertAtTail('Third');

    assert.strictEqual(list.getSize(), 3);
    const arr = list.toArray();
    assert.deepStrictEqual(arr, ['First', 'Second', 'Third']);
  });

  it('should search for nodes matching a predicate', () => {
    const list = new LinkedList<Passenger>();
    const p1: Passenger = { passengerId: 'P1', passengerName: 'Alice', bookingId: 'B1', flightNumber: 'AI-201', seatNumber: '1A', fare: 3000 };
    const p2: Passenger = { passengerId: 'P2', passengerName: 'Bob', bookingId: 'B2', flightNumber: 'AI-201', seatNumber: '1B', fare: 3500 };

    list.insertAtTail(p1);
    list.insertAtTail(p2);

    const found = list.search((p) => p.passengerId === 'P2');
    assert.ok(found);
    assert.strictEqual(found?.passengerName, 'Bob');

    const notFound = list.search((p) => p.passengerId === 'P999');
    assert.strictEqual(notFound, null);
  });

  it('should delete nodes by predicate correctly', () => {
    const list = new LinkedList<number>();
    list.insertAtTail(100);
    list.insertAtTail(200);
    list.insertAtTail(300);

    const deleted = list.deleteByKey((v) => v === 200);
    assert.strictEqual(deleted, true);
    assert.strictEqual(list.getSize(), 2);
    assert.deepStrictEqual(list.toArray(), [100, 300]);

    // Deleting head
    assert.strictEqual(list.deleteByKey((v) => v === 100), true);
    assert.deepStrictEqual(list.toArray(), [300]);
  });
});

describe('CO3: Binary Search Tree (BST)', () => {
  it('should insert keys and maintain BST invariant', () => {
    const bst = new BinarySearchTree();
    [1003, 1001, 1005, 1002, 1004].forEach((k) => bst.insert(k));

    assert.strictEqual(bst.size(), 5);
    // Inorder traversal must return keys in strictly ascending sorted order
    assert.deepStrictEqual(bst.inorderTraversal(), [1001, 1002, 1003, 1004, 1005]);
  });

  it('should track search path and comparisons correctly', () => {
    const bst = new BinarySearchTree();
    [1003, 1001, 1005, 1002, 1004].forEach((k) => bst.insert(k));

    const found = bst.search(1002);
    assert.strictEqual(found.found, true);
    assert.strictEqual(found.comparisons, 3); // 1003 -> 1001 -> 1002
    assert.deepStrictEqual(found.path, [1003, 1001, 1002]);

    const notFound = bst.search(9999);
    assert.strictEqual(notFound.found, false);
    assert.strictEqual(notFound.node, null);
    assert.ok(notFound.comparisons > 0);
  });

  it('should compute valid 2D coordinates for visual rendering', () => {
    const bst = new BinarySearchTree();
    [1002, 1001, 1003].forEach((k) => bst.insert(k));
    const layout = bst.getLayout(600, 70);

    assert.strictEqual(layout.nodes.length, 3);
    assert.strictEqual(layout.edges.length, 2);
    assert.ok(layout.width > 0);
    assert.ok(layout.height > 0);
  });
});

describe('CO3: Selection Sort Algorithm', () => {
  it('should sort numbers in ascending order without using Array.sort', () => {
    const input = [5500, 3200, 4800, 2500, 6200];
    const result = selectionSort(input);

    assert.deepStrictEqual(result.sorted, [2500, 3200, 4800, 5500, 6200]);
    assert.deepStrictEqual(result.original, [5500, 3200, 4800, 2500, 6200]);
    assert.ok(result.comparisons > 0);
    assert.ok(result.steps.length > 0);
  });

  it('should handle already sorted and reversed arrays', () => {
    const alreadySorted = [10, 20, 30, 40];
    const res1 = selectionSort(alreadySorted);
    assert.deepStrictEqual(res1.sorted, [10, 20, 30, 40]);
    assert.strictEqual(res1.swaps, 0);

    const reversed = [40, 30, 20, 10];
    const res2 = selectionSort(reversed);
    assert.deepStrictEqual(res2.sorted, [10, 20, 30, 40]);
  });
});

describe('Innovation: AI Seat Recommendation Engine', () => {
  it('should recommend a window seat when window preference is selected', () => {
    const prefs: SeatPreferences = {
      window: true,
      aisle: false,
      extraLegroom: false,
      frontRow: false,
      quietArea: false,
    };

    const recommendation = recommendSeat(prefs, DEFAULT_SEATS);
    assert.ok(recommendation);
    assert.strictEqual(recommendation?.seat.type, 'window');
    assert.ok((recommendation?.score ?? 0) > 0);
    assert.ok((recommendation?.reasons.length ?? 0) > 0);
  });

  it('should recommend an aisle seat when aisle preference is selected', () => {
    const prefs: SeatPreferences = {
      window: false,
      aisle: true,
      extraLegroom: false,
      frontRow: false,
      quietArea: false,
    };

    const recommendation = recommendSeat(prefs, DEFAULT_SEATS);
    assert.ok(recommendation);
    assert.strictEqual(recommendation?.seat.type, 'aisle');
  });

  it('should prefer legroom seats in exit or bulkhead rows when extraLegroom is chosen', () => {
    const prefs: SeatPreferences = {
      window: false,
      aisle: false,
      extraLegroom: true,
      frontRow: false,
      quietArea: false,
    };

    const recommendation = recommendSeat(prefs, DEFAULT_SEATS);
    assert.ok(recommendation);
    assert.strictEqual(recommendation?.seat.hasExtraLegroom, true);
  });
});
