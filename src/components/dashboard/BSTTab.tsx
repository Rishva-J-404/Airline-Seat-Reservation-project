// components/dashboard/BSTTab.tsx
// Tab component for the BST (CO3) demo section in DSADashboard

import { Search, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { BSTVisualizer } from '../dsa/BSTVisualizer';
import type { BinarySearchTree } from '../../algorithms/BST';

interface BSTSearchResult {
  found: boolean;
  path: number[];
  comparisons: number;
}

interface BSTTabProps {
  bst:           BinarySearchTree;
  bstSnapshot:   number[];
  searchKey:     string;
  insertKey:     string;
  searchResult:  BSTSearchResult | null;
  searchPath:    number[];
  highlightNode: number | null;
  onSearchKeyChange: (v: string) => void;
  onInsertKeyChange: (v: string) => void;
  onSearch: () => void;
  onInsert: () => void;
  onClear:  () => void;
}

export function BSTTab({
  bst, bstSnapshot,
  searchKey, insertKey, searchResult, searchPath, highlightNode,
  onSearchKeyChange, onInsertKeyChange,
  onSearch, onInsert, onClear,
}: BSTTabProps) {
  return (
    <div className="space-y-6">
      {/* Description bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
        <div>
          <h4 className="font-semibold text-slate-800 text-sm">Binary Search Tree (BST) Booking Lookup Index</h4>
          <p className="text-xs text-slate-500 mt-1">
            Organizes booking keys hierarchically (left &lt; root &lt; right) for O(log n) search and sorted in-order traversal.
          </p>
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={onClear}
          disabled={bstSnapshot.length === 0}
          className="text-red-600 hover:bg-red-50 shrink-0"
        >
          Clear BST
        </Button>
      </div>

      {/* BST Visualizer */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 overflow-auto min-h-64 max-h-[520px] flex items-center justify-center">
        <BSTVisualizer bst={bst} snapshot={bstSnapshot} searchPath={searchPath} highlightNode={highlightNode} width={640} />
      </div>

      {/* Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <Search size={14} className="text-orange-600" aria-hidden="true" />
            Search Booking Reference Key
          </h5>
          <div className="flex gap-2">
            <label htmlFor="bst-search" className="sr-only">Booking key to search</label>
            <input
              id="bst-search"
              type="number"
              value={searchKey}
              onChange={e => onSearchKeyChange(e.target.value)}
              placeholder="e.g. 1001, 1002"
              className="flex-1 px-3 py-1.5 text-xs rounded border border-slate-200 focus:ring-1 focus:ring-orange-500"
            />
            <Button variant="primary" size="sm" onClick={onSearch} className="bg-orange-600 hover:bg-orange-700">
              Search Key
            </Button>
          </div>

          {searchResult && (
            <div
              role="status"
              aria-live="polite"
              className={`p-3 rounded-lg text-xs border ${
                searchResult.found
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <div className="font-bold mb-1">
                {searchResult.found
                  ? `Key ${searchKey} found in BST`
                  : `Key ${searchKey} not found in BST`}
              </div>
              <div>Comparisons: {searchResult.comparisons}</div>
              <div>Path: [{searchResult.path.join(' -&gt; ')}]</div>
            </div>
          )}
        </div>

        {/* Insert + In-order */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <Plus size={14} className="text-orange-600" aria-hidden="true" />
            Insert Key &amp; In-Order Traversal
          </h5>
          <div className="flex gap-2">
            <label htmlFor="bst-insert" className="sr-only">Key to insert</label>
            <input
              id="bst-insert"
              type="number"
              value={insertKey}
              onChange={e => onInsertKeyChange(e.target.value)}
              placeholder="e.g. 1007"
              className="flex-1 px-3 py-1.5 text-xs rounded border border-slate-200 focus:ring-1 focus:ring-orange-500"
            />
            <Button variant="secondary" size="sm" onClick={onInsert} icon={<Plus size={14} aria-hidden="true" />}>
              Insert Node
            </Button>
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs" aria-live="polite">
            <span className="font-semibold text-slate-500 block mb-0.5">In-Order Traversal (sorted):</span>
            <span className="font-mono text-slate-800 font-bold">
              {bstSnapshot.length > 0 ? `[${bstSnapshot.join(', ')}]` : 'Tree is empty'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
