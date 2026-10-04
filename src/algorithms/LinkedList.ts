// ============================================================
// LinkedList.ts - Custom Singly Linked List implementation
// Operations: insert (head/tail), delete, search, display
// Time complexity: insertHead O(1), insertTail O(n),
//                 delete O(n), search O(n), display O(n)
// ============================================================

export class ListNode<T> {
  data: T;
  next: ListNode<T> | null = null;

  constructor(data: T) {
    this.data = data;
  }
}

export class LinkedList<T> {
  private head: ListNode<T> | null = null;
  private size: number = 0;

  /** Insert a new node at the head - O(1) */
  insertAtHead(data: T): void {
    const newNode = new ListNode<T>(data);
    newNode.next = this.head;
    this.head = newNode;
    this.size++;
  }

  /** Insert a new node at the tail - O(n) */
  insertAtTail(data: T): void {
    const newNode = new ListNode<T>(data);
    if (this.head === null) {
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next !== null) {
        current = current.next;
      }
      current.next = newNode;
    }
    this.size++;
  }

  /** Delete the first node matching the predicate - O(n) */
  deleteByKey(predicate: (data: T) => boolean): boolean {
    if (this.head === null) return false;

    // Check head node
    if (predicate(this.head.data)) {
      this.head = this.head.next;
      this.size--;
      return true;
    }

    // Traverse to find node before the target
    let current = this.head;
    while (current.next !== null) {
      if (predicate(current.next.data)) {
        current.next = current.next.next;
        this.size--;
        return true;
      }
      current = current.next;
    }
    return false;
  }

  /** Search for the first node matching the predicate - O(n) */
  search(predicate: (data: T) => boolean): T | null {
    let current = this.head;
    while (current !== null) {
      if (predicate(current.data)) {
        return current.data;
      }
      current = current.next;
    }
    return null;
  }

  /** Return all data as an array (head→tail) for display - O(n) */
  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current !== null) {
      result.push(current.data);
      current = current.next;
    }
    return result;
  }

  /** Return the number of nodes - O(1) */
  getSize(): number {
    return this.size;
  }

  /** Check if list is empty - O(1) */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /** Get the head node data - O(1) */
  getHead(): T | null {
    return this.head?.data ?? null;
  }

  /** Remove all nodes - O(1) */
  clear(): void {
    this.head = null;
    this.size = 0;
  }
}
