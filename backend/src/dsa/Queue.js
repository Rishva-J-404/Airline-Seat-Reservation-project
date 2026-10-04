// ============================================================
// Queue.js - FIFO Queue using a singly-linked node chain
// Used for buffering ticket booking and cancellation requests
// Time Complexity: Enqueue O(1), Dequeue O(1), Peek O(1)
// ============================================================

class QueueNode {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

export class Queue {
  constructor() {
    this.frontNode = null;
    this.rearNode = null;
    this.count = 0;
  }

  enqueue(item) {
    const node = new QueueNode(item);
    if (this.rearNode === null) {
      this.frontNode = node;
      this.rearNode = node;
    } else {
      this.rearNode.next = node;
      this.rearNode = node;
    }
    this.count++;
  }

  dequeue() {
    if (this.frontNode === null) return undefined;
    const data = this.frontNode.data;
    this.frontNode = this.frontNode.next;
    if (this.frontNode === null) {
      this.rearNode = null;
    }
    this.count--;
    return data;
  }

  peek() {
    return this.frontNode?.data;
  }

  isEmpty() {
    return this.count === 0;
  }

  size() {
    return this.count;
  }

  toArray() {
    const result = [];
    let curr = this.frontNode;
    while (curr !== null) {
      result.push(curr.data);
      curr = curr.next;
    }
    return result;
  }

  clear() {
    this.frontNode = null;
    this.rearNode = null;
    this.count = 0;
  }
}
