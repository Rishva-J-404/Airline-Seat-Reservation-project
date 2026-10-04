import React, { useState } from 'react';
import {
  GitBranch,
  Search,
  Plus,
  RotateCcw,
  AlertTriangle,
  Info,
  ListOrdered,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/common/PageHeader';
import { ComplexityPanel } from '../components/common/ComplexityBadge';
import { BSTVisualizer } from '../components/dsa/BSTVisualizer';

interface SearchDisplayResult {
  found: boolean;
  searchedKey: number;
  path: number[];
  comparisons: number;
  bookingData?: Record<string, unknown>;
}

export function BSTPage() {
  const { state, dispatch, addLog, bst } = useApp();

  const [searchKeyInput, setSearchKeyInput] = useState('');
  const [insertKeyInput, setInsertKeyInput] = useState('');
  const [searchResult, setSearchResult] = useState<SearchDisplayResult | null>(null);
  const [searchPath, setSearchPath] = useState<number[]>([]);
  const [highlightNode, setHighlightNode] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const bstKeys = state.bstSnapshot || [];
  const nodeCount = bstKeys.length;

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = searchKeyInput.trim();
    if (!raw) return;

    // Support both numeric input ("1001") and formatted booking ID ("B1001")
    const numericKey = parseInt(raw.replace(/\D/g, ''), 10);
    if (isNaN(numericKey)) {
      setNotice('Please enter a valid numeric booking key or ID (e.g. 1001 or B1001).');
      return;
    }

    const result = bst.search(numericKey);
    setSearchPath(result.path);
    setHighlightNode(result.found ? numericKey : null);

    setSearchResult({
      found: result.found,
      searchedKey: numericKey,
      path: result.path,
      comparisons: result.comparisons,
      bookingData: result.node?.data,
    });

    const statusText = result.found ? 'Found' : 'Not Found';
    const logDetail =
      statusText +
      ': Key ' +
      numericKey +
      ' in ' +
      result.comparisons +
      ' comparison(s). Path: [' +
      result.path.join(' -> ') +
      ']';

    addLog('BST Search', logDetail, 'bst');
    setNotice(statusText + ': Checked ' + result.comparisons + ' node(s) along search path.');
  };

  // Insert handler
  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = insertKeyInput.trim();
    if (!raw) return;

    const numericKey = parseInt(raw.replace(/\D/g, ''), 10);
    if (isNaN(numericKey)) {
      setNotice('Please enter a valid numeric key to insert.');
      return;
    }

    if (bstKeys.includes(numericKey)) {
      setNotice('Key ' + numericKey + ' already exists in the BST. Duplicate keys are ignored.');
      setHighlightNode(numericKey);
      return;
    }

    dispatch({ type: 'BST_INSERT', payload: numericKey });
    addLog(
      'BST Insert',
      'Inserted key ' + numericKey + ' into binary search tree based on key comparison',
      'bst'
    );

    setHighlightNode(numericKey);
    setSearchPath([numericKey]);
    setInsertKeyInput(String(numericKey));
    setNotice('Inserted key ' + numericKey + ' successfully into BST.');
  };

  // Quick insert helper
  const handleQuickInsert = (val: number) => {
    setInsertKeyInput(String(val));
    if (bstKeys.includes(val)) {
      setNotice('Key ' + val + ' is already present in BST.');
      setHighlightNode(val);
      return;
    }
    dispatch({ type: 'BST_INSERT', payload: val });
    addLog('BST Insert', 'Quick inserted key ' + val + ' into binary search tree', 'bst');
    setHighlightNode(val);
    setSearchPath([val]);
    setNotice('Quick inserted key ' + val + '.');
  };

  // Inorder Traversal handler
  const handleInorderTraversal = () => {
    const keys = bst.inorderTraversal();
    setSearchPath(keys);
    setHighlightNode(null);
    setNotice('Inorder traversal: Visited ' + keys.length + ' node(s) in sorted order: ' + keys.join(', '));
    addLog('BST Inorder', 'Traversed tree in-order (Left -> Root -> Right): ' + keys.join(', '), 'bst');
  };

  // Clear handler
  const handleClear = () => {
    if (nodeCount === 0) return;
    dispatch({ type: 'BST_CLEAR' });
    setSearchPath([]);
    setHighlightNode(null);
    setSearchResult(null);
    setNotice('Cleared all nodes from BST. Root reset to NULL.');
    addLog('BST Clear', 'Cleared binary search tree', 'bst');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      <PageHeader
        title="Reservation Index (Binary Search Tree)"
        subtitle="CO3 - Efficient booking ID search and retrieval"
        icon={<GitBranch size={20} />}
        action={
          <Badge variant="default" size="md">
            CO3: BST Index
          </Badge>
        }
      />

      {/* Notice Banner */}
      {notice && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 border border-slate-300 text-slate-900 text-sm">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-slate-700 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Left = Visualizer & Inorder, Right = Search, Insert, Clear, Complexity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* BST Visualizer Card */}
          <Card>
            <CardHeader
              title="Tree Visualization"
              subtitle="Hierarchical structure: Left subtree keys < Root key < Right subtree keys"
              accentColor="text-bst-600"
              action={
                highlightNode !== null ? (
                  <span className="text-xs font-mono text-bst-800 bg-bst-100 px-2 py-0.5 rounded font-bold">
                    Target: {highlightNode}
                  </span>
                ) : null
              }
            />

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[300px] max-h-[560px] flex items-center justify-center overflow-auto">
              <BSTVisualizer
                bst={bst}
                snapshot={bstKeys}
                searchPath={searchPath}
                highlightNode={highlightNode}
                width={560}
              />
            </div>

            {/* Path Legend */}
            <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#f97316] inline-block border border-[#ea580c]"></span>
                  Target / Found
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#fed7aa] inline-block border border-[#fb923c]"></span>
                  Visited Path
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#fff7ed] inline-block border border-[#fdba74]"></span>
                  Unvisited
                </span>
              </div>
              {searchPath.length > 0 && (
                <button
                  onClick={() => {
                    setSearchPath([]);
                    setHighlightNode(null);
                  }}
                  className="text-bst-600 hover:underline font-medium"
                >
                  Reset Highlights
                </button>
              )}
            </div>
          </Card>

          {/* Inorder Traversal Output Display */}
          <Card>
            <CardHeader
              title="Inorder Traversal Sequence (Left -> Root -> Right)"
              subtitle="Traversing BST in-order yields all stored keys in strictly ascending sorted order (O(n))"
              accentColor="text-bst-600"
              icon={<ListOrdered size={18} />}
            />
            {bstKeys.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">BST is empty. Insert keys to view traversal.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  {bstKeys.map((key, idx) => {
                    const isTarget = key === highlightNode;
                    const isTraversed = searchPath.includes(key);
                    return (
                      <span
                        key={key}
                        onClick={() => {
                          setHighlightNode(key);
                          const res = bst.search(key);
                          setSearchPath(res.path);
                          setSearchResult({
                            found: true,
                            searchedKey: key,
                            path: res.path,
                            comparisons: res.comparisons,
                            bookingData: res.node?.data,
                          });
                        }}
                        className={[
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold cursor-pointer transition-all',
                          isTarget
                            ? 'bg-bst-600 text-white shadow-sm ring-2 ring-bst-300'
                            : isTraversed
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100',
                        ].join(' ')}
                      >
                        {key}
                        {idx < bstKeys.length - 1 && (
                          <span className="text-slate-300 font-normal ml-1">-&gt;</span>
                        )}
                      </span>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500">
                  Click any key above to execute a BST search and inspect the comparison path from the root.
                </p>
              </div>
            )}
          </Card>

          {/* Warning About Non-Balanced Tree */}
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5 text-xs">
                <h4 className="font-bold text-amber-900 text-sm">Warning: Non-Balanced Tree Behavior</h4>
                <p className="leading-relaxed">
                  This implementation is a standard, un-balanced Binary Search Tree. It does not perform
                  automatic balancing rotations (such as those in AVL or Red-Black trees).
                </p>
                <p className="leading-relaxed">
                  If keys are inserted in sequential or sorted order (for example: 1001, 1002, 1003, 1004...),
                  each new key becomes the right child of the previous node. The tree degenerates into a linear
                  singly-linked list of height O(n), causing both search and insertion complexity to degrade
                  from average O(log n) down to worst-case O(n).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tree Summary Metrics */}
          <Card>
            <CardHeader title="BST Metrics" subtitle="Current structural dimensions of the tree" />
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Nodes</p>
                <p className="text-2xl font-bold text-bst-700 mt-1">{nodeCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">keys stored</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Root Key</p>
                <p className="text-xl font-bold font-mono text-slate-800 mt-1">
                  {bst.root ? bst.root.key : 'None'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">tree root value</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Min Key</p>
                <p className="text-lg font-bold font-mono text-slate-800 mt-1">
                  {bstKeys.length > 0 ? bstKeys[0] : 'None'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">leftmost leaf</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Max Key</p>
                <p className="text-lg font-bold font-mono text-slate-800 mt-1">
                  {bstKeys.length > 0 ? bstKeys[bstKeys.length - 1] : 'None'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">rightmost leaf</p>
              </div>
            </div>
          </Card>

          {/* Search Section */}
          <Card>
            <CardHeader
              title="Search Booking Key"
              subtitle="Search binary tree by key with exact comparison path tracking"
              accentColor="text-bst-600"
            />
            <form onSubmit={handleSearch} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Booking Key / ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchKeyInput}
                    onChange={(e) => setSearchKeyInput(e.target.value)}
                    placeholder="e.g. 1002 or B1002"
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bst-500"
                  />
                  <Button type="submit" variant="primary" size="sm" icon={<Search size={14} />}>
                    Search
                  </Button>
                </div>
              </div>
            </form>

            {/* Search Result Box (Strict ASCII text: Found or Not Found, no unicode symbols) */}
            {searchResult && (
              <div
                className={[
                  'mt-4 p-3 rounded-lg text-xs space-y-2 border',
                  searchResult.found
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950',
                ].join(' ')}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-sm tracking-wide">
                    Result: {searchResult.found ? 'Found' : 'Not Found'}
                  </span>
                  <span className="font-mono text-[11px]">
                    {searchResult.comparisons} comparison(s)
                  </span>
                </div>

                <div className="text-[11px] font-mono">
                  <span className="font-semibold text-slate-700">Path: </span>
                  {searchResult.path.length > 0 ? searchResult.path.join(' -> ') : 'None'}
                </div>

                {searchResult.found ? (
                  <p className="text-[11px] text-emerald-800">
                    Key {searchResult.searchedKey} was located successfully in the binary search tree.
                  </p>
                ) : (
                  <p className="text-[11px] text-rose-800">
                    Key {searchResult.searchedKey} does not exist in the binary search tree. Reached NULL branch.
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Insert Section */}
          <Card>
            <CardHeader
              title="Insert Key"
              subtitle="Place a new numeric booking key into its invariant position"
              accentColor="text-bst-600"
            />
            <form onSubmit={handleInsert} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Numeric Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={insertKeyInput}
                    onChange={(e) => setInsertKeyInput(e.target.value)}
                    placeholder="e.g. 1006"
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bst-500"
                  />
                  <Button type="submit" variant="secondary" size="sm" icon={<Plus size={14} />}>
                    Insert Key
                  </Button>
                </div>
              </div>

              {/* Quick sample inserts */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
                  Quick Add Samples:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[1005, 990, 1010, 1025].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickInsert(val)}
                      disabled={bstKeys.includes(val)}
                      className={[
                        'px-2 py-0.5 rounded text-xs font-mono border transition-colors',
                        bstKeys.includes(val)
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-bst-700 border-bst-200 hover:bg-bst-50',
                      ].join(' ')}
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </Card>

          {/* Operations: Inorder Traversal & Clear Buttons */}
          <Card>
            <CardHeader title="Tree Operations" subtitle="Traversal and reset controls" />
            <div className="space-y-2">
              <Button
                type="button"
                variant="primary"
                fullWidth
                size="sm"
                onClick={handleInorderTraversal}
                disabled={nodeCount === 0}
                icon={<ListOrdered size={14} />}
              >
                Inorder Traversal (Sorted Output)
              </Button>

              <Button
                type="button"
                variant="ghost"
                fullWidth
                size="sm"
                onClick={handleClear}
                disabled={nodeCount === 0}
                icon={<RotateCcw size={14} />}
                className="text-red-600 hover:bg-red-50 text-xs"
              >
                Clear Entire BST
              </Button>
            </div>
          </Card>

          {/* Complexity Panel */}
          <ComplexityPanel
            title="BST Time Complexity"
            items={[
              { label: 'Search (Avg)', complexity: 'O(log n)', variant: 'good' },
              { label: 'Search (Worst)', complexity: 'O(n)', variant: 'bad' },
              { label: 'Insert (Avg)', complexity: 'O(log n)', variant: 'good' },
              { label: 'Insert (Worst)', complexity: 'O(n)', variant: 'bad' },
              { label: 'Inorder Traversal', complexity: 'O(n)', variant: 'good' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export default BSTPage;
