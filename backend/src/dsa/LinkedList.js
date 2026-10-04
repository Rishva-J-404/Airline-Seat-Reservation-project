// ============================================================
// LinkedList.js - Singly Linked List for Passenger Manifests
// Time Complexity: InsertHead O(1), InsertTail O(n), Delete O(n), Search O(n)
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
    this.size = 0;
  }

  insertAtHead(data) {
    const node = new ListNode(data);
    node.next = this.head;
    this.head = node;
    this.size++;
  }

  insertAtTail(data) {
    const node = new ListNode(data);
    if (this.head === null) {
      this.head = node;
    } else {
      let curr = this.head;
      while (curr.next !== null) {
        curr = curr.next;
      }
      curr.next = node;
    }
    this.size++;
  }

  deleteByKey(predicate) {
    if (this.head === null) return false;

    if (predicate(this.head.data)) {
      this.head = this.head.next;
      this.size--;
      return true;
    }

    let curr = this.head;
    while (curr.next !== null) {
      if (predicate(curr.next.data)) {
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

  clear() {
    this.head = null;
    this.size = 0;
  }
}
