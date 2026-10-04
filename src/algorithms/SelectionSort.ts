// ============================================================
// SelectionSort.ts - Custom Selection Sort implementation
// Does NOT use Array.sort() or any built-in sort
// Time complexity: O(n²) - two nested loops
// Space complexity: O(1) - in-place sort
// ============================================================

export interface SortStep {
  /** Snapshot of array at this step */
  array: number[];
  /** Index of the current minimum found so far */
  minIndex: number;
  /** Index being compared in inner loop */
  compareIndex: number;
  /** The outer loop boundary (sorted boundary) */
  sortedBoundary: number;
  /** Whether a swap occurred at this step */
  swapped: boolean;
  /** Human-readable description */
  description: string;
  sortedCount?: number;
  comparingIndex?: number;
  comparisons?: number;
  swaps?: number;
}

export interface SortResult {
  original: number[];
  sorted: number[];
  steps: SortStep[];
  comparisons: number;
  swaps: number;
}

export function selectionSort(inputArray: number[]): SortResult {
  const arr = [...inputArray]; // work on a copy
  const original = [...inputArray];
  const steps: SortStep[] = [];
  let comparisons = 0;
  let swaps = 0;

  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    // Find the minimum in the unsorted portion arr[i..n-1]
    for (let j = i + 1; j < n; j++) {
      comparisons++;

      steps.push({
        array: [...arr],
        minIndex: minIdx,
        compareIndex: j,
        sortedBoundary: i,
        sortedCount: i,
        comparingIndex: j,
        comparisons,
        swaps,
        swapped: false,
        description: `Comparing ${arr[j]} with current min ${arr[minIdx]} (index ${minIdx})`,
      });

      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }

    // Swap the found minimum with the first unsorted element
    if (minIdx !== i) {
      const temp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = temp;
      swaps++;

      steps.push({
        array: [...arr],
        minIndex: i,
        compareIndex: minIdx,
        sortedBoundary: i + 1,
        sortedCount: i + 1,
        comparingIndex: -1,
        comparisons,
        swaps,
        swapped: true,
        description: `Swapped ${arr[minIdx]} -> position ${i}: [${arr.join(', ')}]`,
      });
    } else {
      steps.push({
        array: [...arr],
        minIndex: i,
        compareIndex: i,
        sortedBoundary: i + 1,
        sortedCount: i + 1,
        comparingIndex: -1,
        comparisons,
        swaps,
        swapped: false,
        description: `${arr[i]} is already in correct position`,
      });
    }
  }

  return {
    original,
    sorted: arr,
    steps,
    comparisons,
    swaps,
  };
}

/** Get only the "after each pass" snapshots for a simplified view */
export function selectionSortPassSnapshots(inputArray: number[]): {
  passIndex: number;
  array: number[];
  swappedPair: [number, number] | null;
}[] {
  const arr = [...inputArray];
  const snapshots: { passIndex: number; array: number[]; swappedPair: [number, number] | null }[] = [];
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    const swappedPair: [number, number] | null = minIdx !== i ? [arr[i], arr[minIdx]] : null;
    if (minIdx !== i) {
      const temp = arr[i]; arr[i] = arr[minIdx]; arr[minIdx] = temp;
    }
    snapshots.push({ passIndex: i, array: [...arr], swappedPair });
  }
  return snapshots;
}
