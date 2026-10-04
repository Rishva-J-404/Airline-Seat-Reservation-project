// ============================================================
// SelectionSort.ts - In-Place Comparison Selection Sort
// Time Complexity: O(n²) in all cases | Space Complexity: O(1) in-place
// ============================================================

export function selectionSort(inputArray, keyExtractor = (item) => item) {
  const arr = [...inputArray];
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    for (let j = i + 1; j < n; j++) {
      comparisons++;
      if (keyExtractor(arr[j]) < keyExtractor(arr[minIdx])) {
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

  return {
    sorted: arr,
    comparisons,
    swaps,
  };
}
