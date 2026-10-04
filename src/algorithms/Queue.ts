// ============================================================
// Queue.ts - Custom Queue using a singly-linked node chain
// FIFO: enqueue at rear, dequeue from front
// Time complexity: enqueue O(1), dequeue O(1), peek O(1)
// ============================================================

class QueueNode<T> {
  data: T;
  next: QueueNode<T> | null = null;

  constructor(data: T) {
    this.data = data;
  }
}

export class Queue<T> {
  private frontNode: QueueNode<T> | null = null;
  private rearNode: QueueNode<T> | null = null;
  private count: number = 0;

  /** Add an item to the rear of the queue - O(1) */
  enqueue(item: T): void {
    const newNode = new QueueNode<T>(item);
    if (this.rearNode === null) {
      // Queue was empty
      this.frontNode = newNode;
      this.rearNode = newNode;
    } else {
      this.rearNode.next = newNode;
      this.rearNode = newNode;
    }
    this.count++;
  }

  /** Remove and return the front item - O(1) */
  dequeue(): T | undefined {
    if (this.frontNode === null) return undefined;
    const data = this.frontNode.data;
    this.frontNode = this.frontNode.next;
    if (this.frontNode === null) {
      // Queue is now empty
      this.rearNode = null;
    }
    this.count--;
    return data;
  }

  /** Inspect the front item without removing it - O(1) */
  peek(): T | undefined {
    return this.frontNode?.data;
  }

  /** Check if the queue has no elements - O(1) */
  isEmpty(): boolean {
    return this.count === 0;
  }

  /** Return current number of elements - O(1) */
  size(): number {
    return this.count;
  }

  /** Return all items as an array (front→rear) for display - O(n) */
  toArray(): T[] {
    const result: T[] = [];
    let current = this.frontNode;
    while (current !== null) {
      result.push(current.data);
      current = current.next;
    }
    return result;
  }

  /** Remove all elements - O(1) */
  clear(): void {
    this.frontNode = null;
    this.rearNode = null;
    this.count = 0;
  }
}
