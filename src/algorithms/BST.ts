// ============================================================
// BST.ts - Custom Binary Search Tree implementation
// Operations: insert, search (with path tracking), inorder traversal
// Average time complexity: O(log n) | Worst case: O(n) (unbalanced)
// ============================================================

export class BSTNode {
  key: number;
  data: Record<string, unknown>;
  left: BSTNode | null = null;
  right: BSTNode | null = null;

  constructor(key: number, data: Record<string, unknown> = {}) {
    this.key = key;
    this.data = data;
  }
}

export interface SearchResult {
  found: boolean;
  node: BSTNode | null;
  /** Keys visited during traversal from root */
  path: number[];
  comparisons: number;
}

export interface TreeNodeLayout {
  key: number;
  value: number;
  data: Record<string, unknown>;
  x: number;
  y: number;
  parentKey: number | null;
}

export interface BSTEdge {
  from: number;
  to: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface BSTLayout {
  nodes: TreeNodeLayout[];
  edges: BSTEdge[];
  width: number;
  height: number;
}

export class BinarySearchTree {
  root: BSTNode | null = null;
  private nodeCount: number = 0;

  /** Insert a key into the BST - avg O(log n), worst O(n) */
  insert(key: number, data: Record<string, unknown> = {}): void {
    const newNode = new BSTNode(key, data);
    if (this.root === null) {
      this.root = newNode;
      this.nodeCount++;
      return;
    }
    this._insertNode(this.root, newNode);
  }

  private _insertNode(current: BSTNode, newNode: BSTNode): void {
    if (newNode.key < current.key) {
      if (current.left === null) {
        current.left = newNode;
        this.nodeCount++;
      } else {
        this._insertNode(current.left, newNode);
      }
    } else if (newNode.key > current.key) {
      if (current.right === null) {
        current.right = newNode;
        this.nodeCount++;
      } else {
        this._insertNode(current.right, newNode);
      }
    }
    // Duplicate keys are ignored
  }

  /** Search for a key, returning the path and comparison count */
  search(key: number): SearchResult {
    const path: number[] = [];
    let comparisons = 0;
    let current = this.root;

    while (current !== null) {
      path.push(current.key);
      comparisons++;

      if (key === current.key) {
        return { found: true, node: current, path, comparisons };
      } else if (key < current.key) {
        current = current.left;
      } else {
        current = current.right;
      }
    }

    return { found: false, node: null, path, comparisons };
  }

  /** Return all keys in sorted order via inorder traversal - O(n) */
  inorderTraversal(): number[] {
    const result: number[] = [];
    this._inorder(this.root, result);
    return result;
  }

  private _inorder(node: BSTNode | null, result: number[]): void {
    if (node === null) return;
    this._inorder(node.left, result);
    result.push(node.key);
    this._inorder(node.right, result);
  }

  /** Total number of nodes in the tree */
  size(): number {
    return this.nodeCount;
  }

  /** Check if tree is empty */
  isEmpty(): boolean {
    return this.root === null;
  }

  /** Clear the entire tree */
  clear(): void {
    this.root = null;
    this.nodeCount = 0;
  }

  /**
   * Compute x,y positions for each node for SVG rendering.
   * Uses a simple recursive algorithm: vertical by depth, horizontal by in-order rank.
   */
  getLayout(svgWidth = 600, levelHeight = 70): BSTLayout {
    if (this.root === null) return { nodes: [], edges: [], width: svgWidth, height: 0 };

    const nodeList: TreeNodeLayout[] = [];
    const edges: BSTEdge[] = [];

    // Assign in-order rank to each node
    const inorderKeys = this.inorderTraversal();
    const rankMap = new Map<number, number>();
    inorderKeys.forEach((k, i) => rankMap.set(k, i));

    const totalNodes = inorderKeys.length;
    const effectiveWidth = Math.max(svgWidth, (totalNodes + 1) * 68);
    const horizontalSpacing = effectiveWidth / (totalNodes + 1);

    const traverse = (node: BSTNode | null, depth: number, parentKey: number | null) => {
      if (node === null) return;
      const rank = rankMap.get(node.key) ?? 0;
      const x = Math.round((rank + 1) * horizontalSpacing);
      const y = depth * levelHeight + 40;

      nodeList.push({ key: node.key, value: node.key, data: node.data, x, y, parentKey });

      if (parentKey !== null) {
        const parentNode = nodeList.find((n) => n.key === parentKey);
        edges.push({
          from: parentKey,
          to: node.key,
          x1: parentNode ? parentNode.x : x,
          y1: parentNode ? parentNode.y : y,
          x2: x,
          y2: y,
        });
      }

      traverse(node.left, depth + 1, node.key);
      traverse(node.right, depth + 1, node.key);
    };

    traverse(this.root, 0, null);

    const maxY = Math.max(...nodeList.map(n => n.y)) + 60;
    return { nodes: nodeList, edges, width: effectiveWidth, height: maxY };
  }
}
