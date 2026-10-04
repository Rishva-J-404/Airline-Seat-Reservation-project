// ============================================================
// dsa.test.js - Server-Side Data Structures & Algorithms Tests
// Verifies academic integrity of Queue, LinkedList, BST, SelectionSort
// ============================================================

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { Queue } from '../src/dsa/Queue.js';
import { LinkedList } from '../src/dsa/LinkedList.js';
import { BinarySearchTree } from '../src/dsa/BST.js';
import { selectionSort } from '../src/dsa/SelectionSort.js';

describe('Server-Side CO1: Queue ADT', () => {
  it('should initialize empty and maintain FIFO ordering', () => {
    const q = new Queue();
    assert.strictEqual(q.isEmpty(), true);
    assert.strictEqual(q.size(), 0);

    q.enqueue({ id: 'REQ-1', passenger: 'Alice' });
    q.enqueue({ id: 'REQ-2', passenger: 'Bob' });
    q.enqueue({ id: 'REQ-3', passenger: 'Charlie' });

    assert.strictEqual(q.size(), 3);
    assert.strictEqual(q.peek().id, 'REQ-1');

    assert.strictEqual(q.dequeue().id, 'REQ-1');
    assert.strictEqual(q.peek().id, 'REQ-2');

    assert.strictEqual(q.dequeue().id, 'REQ-2');
    assert.strictEqual(q.dequeue().id, 'REQ-3');
    assert.strictEqual(q.dequeue(), undefined);
    assert.strictEqual(q.isEmpty(), true);
  });

  it('should clear all nodes from queue', () => {
    const q = new Queue();
    q.enqueue(10);
    q.enqueue(20);
    q.clear();
    assert.strictEqual(q.isEmpty(), true);
    assert.strictEqual(q.size(), 0);
  });
});

describe('Server-Side CO2: Singly Linked List', () => {
  it('should maintain dynamic chain with head and tail insertions', () => {
    const list = new LinkedList();
    list.insertAtTail('Second');
    list.insertAtHead('First');
    list.insertAtTail('Third');

    assert.strictEqual(list.getSize(), 3);
    assert.deepStrictEqual(list.toArray(), ['First', 'Second', 'Third']);
  });

  it('should search by predicate correctly', () => {
    const list = new LinkedList();
    list.insertAtTail({ passengerId: 'P101', name: 'Neavis' });
    list.insertAtTail({ passengerId: 'P102', name: 'Priya' });

    const found = list.search(p => p.passengerId === 'P102');
    assert.ok(found);
    assert.strictEqual(found.name, 'Priya');

    const notFound = list.search(p => p.passengerId === 'P999');
    assert.strictEqual(notFound, null);
  });

  it('should delete node by predicate and update pointers', () => {
    const list = new LinkedList();
    list.insertAtTail('A');
    list.insertAtTail('B');
    list.insertAtTail('C');

    assert.strictEqual(list.deleteByKey(item => item === 'B'), true);
    assert.strictEqual(list.getSize(), 2);
    assert.deepStrictEqual(list.toArray(), ['A', 'C']);

    // Delete head
    assert.strictEqual(list.deleteByKey(item => item === 'A'), true);
    assert.deepStrictEqual(list.toArray(), ['C']);
  });
});

describe('Server-Side CO3: Binary Search Tree', () => {
  it('should insert keys and preserve BST invariant with in-order traversal', () => {
    const bst = new BinarySearchTree();
    [1004, 1002, 1006, 1001, 1003, 1005, 1007].forEach(k => bst.insert(k));

    assert.strictEqual(bst.size(), 7);
    // In-order traversal must return strictly ascending sorted array
    assert.deepStrictEqual(bst.inorderTraversal(), [1001, 1002, 1003, 1004, 1005, 1006, 1007]);
  });

  it('should track traversal path and comparisons during logarithmic search', () => {
    const bst = new BinarySearchTree();
    [1004, 1002, 1006, 1001, 1003].forEach(k => bst.insert(k));

    const result = bst.search(1003);
    assert.strictEqual(result.found, true);
    assert.strictEqual(result.comparisons, 3); // 1004 -> 1002 -> 1003
    assert.deepStrictEqual(result.path, [1004, 1002, 1003]);

    const notFound = bst.search(9999);
    assert.strictEqual(notFound.found, false);
  });
});

describe('Server-Side CO3: Selection Sort', () => {
  it('should sort airfares ascending in-place without Array.sort()', () => {
    const fares = [5500, 3200, 4800, 2500, 6200];
    const res = selectionSort(fares);

    assert.deepStrictEqual(res.sorted, [2500, 3200, 4800, 5500, 6200]);
    assert.ok(res.comparisons > 0);
    assert.ok(res.swaps > 0);
  });

  it('should handle already sorted arrays and reversed arrays', () => {
    const sorted = [1000, 2000, 3000];
    const res1 = selectionSort(sorted);
    assert.deepStrictEqual(res1.sorted, [1000, 2000, 3000]);
    assert.strictEqual(res1.swaps, 0);

    const reversed = [3000, 2000, 1000];
    const res2 = selectionSort(reversed);
    assert.deepStrictEqual(res2.sorted, [1000, 2000, 3000]);
  });
});
