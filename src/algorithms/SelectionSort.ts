// ============================================================
// SelectionSort.ts - Custom Selection Sort implementation (CO3)
// Does NOT use Array.sort() or any built-in sort function
// Time complexity: O(n²) in all cases | Space complexity: O(1) in-place
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

export interface SelectionSortBenchmarkResult {
  size: number;
  comparisons: number;
  swaps: number;
  timeMs: number;
  theoreticalComparisons: number;
  isSorted: boolean;
}

/**
 * Interactive Selection Sort with full step-by-step recording for UI playback
 * Recommended for visualization arrays (n <= 50)
 */
export function selectionSort(inputArray: number[]): SortResult {
  const arr = [...inputArray];
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
        comparingIndex: minIdx,
        comparisons,
        swaps,
        swapped: true,
        description: `Swapped minimum element ${arr[i]} into sorted position index ${i}`,
      });
    } else {
      steps.push({
        array: [...arr],
        minIndex: i,
        compareIndex: i,
        sortedBoundary: i + 1,
        sortedCount: i + 1,
        comparingIndex: i,
        comparisons,
        swaps,
        swapped: false,
        description: `Element ${arr[i]} at index ${i} is already in correct sorted position`,
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

/**
 * High-performance Selection Sort benchmark (CO3 Laboratory)
 * Runs actual two-nested-loop Selection Sort algorithm without Array.sort()
 * Measures exact comparison count, swap count, and wall-clock execution time
 */
export function selectionSortBenchmark(inputArray: number[]): SelectionSortBenchmarkResult {
  const arr = [...inputArray];
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;

  const start = performance.now();

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    for (let j = i + 1; j < n; j++) {
      comparisons++;
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }

    if (minIdx !== i) {
      const temp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = temp;
      swaps++;
    }
  }

  const timeMs = performance.now() - start;

  // Validate array is strictly sorted ascending
  let isSorted = true;
  for (let k = 0; k < n - 1; k++) {
    if (arr[k] > arr[k + 1]) {
      isSorted = false;
      break;
    }
  }

  return {
    size: n,
    comparisons,
    swaps,
    timeMs,
    theoreticalComparisons: (n * (n - 1)) / 2,
    isSorted,
  };
}
