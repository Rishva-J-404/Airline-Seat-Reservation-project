// ============================================================
// LinkedList.js - Singly Linked List for Passenger Manifests (CO2)
// Time Complexity: InsertHead O(1), InsertTail O(1) with tail pointer, Delete O(n), Search O(n)
// ============================================================

class ListNode {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

export class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  /**
   * Insert a new node at the head - O(1)
   */
  insertAtHead(data) {
    const node = new ListNode(data);
    node.next = this.head;
    this.head = node;
    if (this.tail === null) {
      this.tail = node;
    }
    this.size++;
  }

  /**
   * Insert a new node at the tail - O(1) with tail pointer
   */
  insertAtTail(data) {
    const node = new ListNode(data);
    if (this.head === null) {
      this.head = node;
      this.tail = node;
    } else {
      if (this.tail !== null) {
        this.tail.next = node;
        this.tail = node;
      } else {
        let curr = this.head;
        while (curr.next !== null) {
          curr = curr.next;
        }
        curr.next = node;
        this.tail = node;
      }
    }
    this.size++;
  }

  /**
   * Delete first matching node - O(n)
   */
  deleteByKey(predicate) {
    if (this.head === null) return false;

    // Delete head node
    if (predicate(this.head.data)) {
      this.head = this.head.next;
      if (this.head === null) {
        this.tail = null;
      }
      this.size--;
      return true;
    }

    let curr = this.head;
    while (curr.next !== null) {
      if (predicate(curr.next.data)) {
        if (curr.next === this.tail) {
          this.tail = curr;
        }
        curr.next = curr.next.next;
        this.size--;
        return true;
      }
      curr = curr.next;
    }
    return false;
  }

  search(predicate) {
    let curr = this.head;
    while (curr !== null) {
      if (predicate(curr.data)) return curr.data;
      curr = curr.next;
    }
    return null;
  }

  toArray() {
    const arr = [];
    let curr = this.head;
    while (curr !== null) {
      arr.push(curr.data);
      curr = curr.next;
    }
    return arr;
  }

  getSize() {
    return this.size;
  }

  isEmpty() {
    return this.size === 0;
  }

  getHead() {
    return this.head?.data ?? null;
  }

  getTail() {
    return this.tail?.data ?? null;
  }

  clear() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }
}
