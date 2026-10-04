// ============================================================
// BST.js - Binary Search Tree for Booking Key Indexing
// Average Complexity: Search O(log n), Insert O(log n)
// Inorder Traversal: O(n) sorted output
// ============================================================

class BSTNode {
  constructor(key, data = {}) {
    this.key = key;
    this.data = data;
    this.left = null;
    this.right = null;
  }
}

export class BinarySearchTree {
  constructor() {
    this.root = null;
    this.nodeCount = 0;
  }

  insert(key, data = {}) {
    const node = new BSTNode(key, data);
    if (this.root === null) {
      this.root = node;
      this.nodeCount++;
      return;
    }
    this._insertNode(this.root, node);
  }

  _insertNode(current, node) {
    if (node.key < current.key) {
      if (current.left === null) {
        current.left = node;
        this.nodeCount++;
      } else {
        this._insertNode(current.left, node);
      }
    } else if (node.key > current.key) {
      if (current.right === null) {
        current.right = node;
        this.nodeCount++;
      } else {
        this._insertNode(current.right, node);
      }
    }
  }

  search(key) {
    const path = [];
    let comparisons = 0;
    let curr = this.root;

    while (curr !== null) {
      path.push(curr.key);
      comparisons++;

      if (key === curr.key) {
        return { found: true, node: curr, path, comparisons };
      } else if (key < curr.key) {
        curr = curr.left;
      } else {
        curr = curr.right;
      }
    }

    return { found: false, node: null, path, comparisons };
  }

  inorderTraversal() {
    const result = [];
    const traverse = (node) => {
      if (!node) return;
      traverse(node.left);
      result.push(node.key);
      traverse(node.right);
    };
    traverse(this.root);
    return result;
  }

  size() {
    return this.nodeCount;
  }

  isEmpty() {
    return this.root === null;
  }

  clear() {
    this.root = null;
    this.nodeCount = 0;
  }
}
