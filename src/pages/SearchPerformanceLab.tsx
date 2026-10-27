// ============================================================
// SearchPerformanceLab.tsx - CO3: Empirical Search Performance Lab
// Evaluates Linked List Linear Search O(n) vs. BST Tree Search O(log n)
// Runs actual algorithms on deterministic datasets of up to 10,000 records
// ============================================================

import { useState, useMemo } from 'react';
import {
  Gauge,
  Play,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Info,
} from 'lucide-react';
import { LinkedList } from '../algorithms/LinkedList';
import { BinarySearchTree } from '../algorithms/BST';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../context/AppContext';

type DatasetSize = 10 | 50 | 100 | 500 | 1000 | 5000 | 10000;
type SearchScenario = 'best' | 'average' | 'worst' | 'missing';

interface BenchmarkRecord {
  size: DatasetSize;
  scenario: SearchScenario;
  searchKey: string;
  numericKey: number;
  llFound: boolean;
  llComparisons: number;
  llTimeMs: number;
  bstFound: boolean;
  bstComparisons: number;
  bstTimeMs: number;
  diffComparisons: number;
  reductionPercent: number;
  timestamp: string;
}

const DATASET_SIZES: DatasetSize[] = [10, 50, 100, 500, 1000, 5000, 10000];

export default function SearchPerformanceLab() {
  const { addLog } = useApp();

  const [selectedSize, setSelectedSize] = useState<DatasetSize>(1000);
  const [scenario, setScenario] = useState<SearchScenario>('average');
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentResult, setCurrentResult] = useState<BenchmarkRecord | null>(null);
  const [history, setHistory] = useState<BenchmarkRecord[]>([]);

  // Build deterministic test records for the selected size
  // Keys: 1001 to (1000 + selectedSize)
  const { linkedList, bst, minKey, maxKey } = useMemo(() => {
    const ll = new LinkedList<{ key: number; bookingId: string }>();
    const tree = new BinarySearchTree();
    const keys: number[] = [];

    const startKey = 1001;
    const endKey = startKey + selectedSize - 1;

    for (let k = startKey; k <= endKey; k++) {
      keys.push(k);
      ll.insertAtTail({ key: k, bookingId: `B${k}` });
    }

    // Insert keys into BST in balanced median order so the tree is balanced
    function insertBalanced(arr: number[], left: number, right: number) {
      if (left > right) return;
      const mid = Math.floor((left + right) / 2);
      tree.insert(arr[mid], { bookingId: `B${arr[mid]}` });
      insertBalanced(arr, left, mid - 1);
      insertBalanced(arr, mid + 1, right);
    }
    insertBalanced(keys, 0, keys.length - 1);

    return {
      linkedList: ll,
      bst: tree,
      keyList: keys,
      minKey: startKey,
      maxKey: endKey,
    };
  }, [selectedSize]);

  // Determine target key based on scenario
  const targetKey = useMemo(() => {
    if (customKeyInput.trim()) {
      const parsed = parseInt(customKeyInput.replace(/\D/g, ''), 10);
      if (!isNaN(parsed)) return parsed;
    }

    switch (scenario) {
      case 'best':
        return minKey; // Key at head / root
      case 'average':
        return minKey + Math.floor(selectedSize / 2); // Middle element
      case 'worst':
        return maxKey; // Last element in list
      case 'missing':
        return 99999; // Element not in dataset
    }
  }, [scenario, selectedSize, minKey, maxKey, customKeyInput]);

  const runBenchmark = () => {
    setIsRunning(true);

    setTimeout(() => {
      // 1. Linked List Linear Search O(n)
      const llStats = linkedList.searchWithStats((item) => item.key === targetKey);

      // 2. BST Binary Search O(log n)
      const bstStats = bst.searchWithStats(targetKey);

      const diff = llStats.comparisons - bstStats.comparisons;
      const reduction = llStats.comparisons > 0
        ? Number(((diff / llStats.comparisons) * 100).toFixed(1))
        : 0;

      const record: BenchmarkRecord = {
        size: selectedSize,
        scenario,
        searchKey: `B${targetKey}`,
        numericKey: targetKey,
        llFound: llStats.found,
        llComparisons: llStats.comparisons,
        llTimeMs: Number(llStats.timeMs.toFixed(3)),
        bstFound: bstStats.found,
        bstComparisons: bstStats.comparisons,
        bstTimeMs: Number(bstStats.timeMs.toFixed(3)),
        diffComparisons: diff,
        reductionPercent: reduction,
        timestamp: new Date().toLocaleTimeString(),
      };

      setCurrentResult(record);
      setHistory((prev) => [record, ...prev.slice(0, 9)]);
      setIsRunning(false);

      addLog(
        'Search Benchmark (CO3)',
        `Evaluated search for B${targetKey} across ${selectedSize} records: LL took ${llStats.comparisons} comparisons, BST took ${bstStats.comparisons} comparisons (${reduction}% reduction)`,
        'bst'
      );
    }, 50);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      <PageHeader
        title="Search Performance Laboratory"
        subtitle="CO3 — Empirical evaluation of searching algorithms: Linear Search O(n) vs. Binary Search Tree O(log n)"
        icon={<Gauge size={20} />}
        action={<Badge variant="default" size="md">CO3: Search Performance</Badge>}
      />

      {/* Dataset & Parameter Control Console */}
      <Card>
        <CardHeader
          title="Benchmark Parameters"
          subtitle="Configure dataset magnitude, scenario distribution, and key target"
        />
        <div className="p-6 space-y-6">
          {/* Dataset Size Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              1. Dataset Size (Number of Booking Records N)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {DATASET_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setSelectedSize(size);
                    setCustomKeyInput('');
                  }}
                  className={[
                    'py-2 px-3 rounded-lg text-xs font-mono font-bold border transition-all text-center',
                    selectedSize === size
                      ? 'bg-aero-950 text-white border-aero-950 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300',
                  ].join(' ')}
                >
                  {size.toLocaleString()}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Active Range: B{minKey} ... B{maxKey} ({selectedSize.toLocaleString()} sequential records)
            </p>
          </div>

          {/* Search Scenario Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                2. Search Case Scenario
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'best' as SearchScenario, label: 'Best-Case', desc: 'First element / Root node' },
                  { id: 'average' as SearchScenario, label: 'Average-Case', desc: 'Median record' },
                  { id: 'worst' as SearchScenario, label: 'Worst-Case', desc: 'Last element / Deepest leaf' },
                  { id: 'missing' as SearchScenario, label: 'Missing Key', desc: 'Key not present in tree' },
                ].map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setScenario(sc.id);
                      setCustomKeyInput('');
                    }}
                    className={[
                      'p-2.5 rounded-lg border text-left transition-all',
                      scenario === sc.id && !customKeyInput
                        ? 'bg-blue-50/70 border-blue-500 text-blue-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <div className="text-xs font-bold">{sc.label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{sc.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Key Target */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                3. Or Custom Target Key
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  placeholder={`e.g. B${minKey + 42} or ${minKey + 42}`}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-aero-950 font-mono"
                />
                {customKeyInput && (
                  <button
                    type="button"
                    onClick={() => setCustomKeyInput('')}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-mono">
                Evaluated Target Key: <strong className="text-slate-900">B{targetKey}</strong> (ID #{targetKey})
              </p>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="lg"
              loading={isRunning}
              onClick={runBenchmark}
              icon={<Play size={16} />}
              className="bg-aero-950 hover:bg-slate-900 font-bold px-6"
            >
              Execute Search Comparison
            </Button>
          </div>
        </div>
      </Card>

      {/* Live Benchmark Execution Results */}
      {currentResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Linked List Card */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader
                title="Linked List Search (CO2)"
                subtitle="Sequential Linear Traversal from HEAD to TAIL"
                action={<Badge variant="warning">Linear O(n)</Badge>}
              />
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Record Found:</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    {currentResult.llFound ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={14} /> YES
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center gap-1">
                        <XCircle size={14} /> NO (Traversed full list)
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Total Comparisons:</span>
                  <span className="text-2xl font-bold font-mono text-amber-900">
                    {currentResult.llComparisons.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Execution Time:</span>
                  <span className="text-xs font-mono font-semibold text-slate-700">
                    {currentResult.llTimeMs} ms
                  </span>
                </div>

                <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200/70 text-xs text-amber-900">
                  <p className="font-semibold mb-1">Theoretical Model: O(n)</p>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Each node in the singly linked chain must be inspected sequentially from Head.
                    In an average case, ~N/2 comparisons are required; in worst-case or missing key, N comparisons are performed.
                  </p>
                </div>
              </div>
            </Card>

            {/* Binary Search Tree Card */}
            <Card className="border-l-4 border-l-emerald-600">
              <CardHeader
                title="Binary Search Tree Search (CO4)"
                subtitle="Divide-and-Conquer Logarithmic Search from ROOT"
                action={<Badge variant="success">Logarithmic O(log n)</Badge>}
              />
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Record Found:</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    {currentResult.bstFound ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={14} /> YES
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center gap-1">
                        <XCircle size={14} /> NO (Reached null branch)
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Total Comparisons:</span>
                  <span className="text-2xl font-bold font-mono text-emerald-700">
                    {currentResult.bstComparisons.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Execution Time:</span>
                  <span className="text-xs font-mono font-semibold text-slate-700">
                    {currentResult.bstTimeMs} ms
                  </span>
                </div>

                <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200/70 text-xs text-emerald-900">
                  <p className="font-semibold mb-1">Theoretical Model: O(log₂ n)</p>
                  <p className="text-[11px] leading-relaxed text-emerald-800">
                    At every tree node, half the remaining search space is eliminated by branching left or right based on the key invariant.
                    For N={currentResult.size.toLocaleString()}, maximum height is only ~{Math.ceil(Math.log2(currentResult.size))} levels!
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Efficiency Verdict Card */}
          <Card className="bg-slate-900 text-white border-slate-800">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                <TrendingDown size={16} /> Algorithmic Optimization Analysis
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div>
                  <p className="text-xs text-slate-400">Dataset Magnitude</p>
                  <p className="text-2xl font-bold font-mono text-white mt-1">
                    {currentResult.size.toLocaleString()} <span className="text-xs text-slate-400 font-normal">records</span>
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Operations Saved by BST</p>
                  <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    {currentResult.diffComparisons.toLocaleString()} <span className="text-xs text-slate-400 font-normal">comparisons</span>
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Search Cost Reduction</p>
                  <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                    {currentResult.reductionPercent}% <span className="text-xs text-slate-400 font-normal">fewer ops</span>
                  </p>
                </div>
              </div>

              {/* Relative Operation Bar */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Relative Operation Load</span>
                  <span>BST: {currentResult.bstComparisons} vs LL: {currentResult.llComparisons}</span>
                </div>
                <div className="h-4 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{
                      width: `${Math.max(1, (currentResult.bstComparisons / Math.max(1, currentResult.llComparisons)) * 100)}%`,
                    }}
                    title={`BST: ${currentResult.bstComparisons} comparisons`}
                  />
                  <div
                    className="bg-amber-500/80 h-full flex-1"
                    title={`Linked List: ${currentResult.llComparisons} comparisons`}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span className="text-emerald-400 font-semibold">■ BST Load (Logarithmic)</span>
                  <span className="text-amber-400 font-semibold">■ Linked List Load (Linear)</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Historical Runs Log */}
      {history.length > 0 && (
        <Card>
          <CardHeader
            title="Benchmark Run History"
            subtitle="Recorded verification runs across different dataset sizes and scenarios"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Size N</th>
                  <th className="py-2.5 px-4">Target Key</th>
                  <th className="py-2.5 px-4">Scenario</th>
                  <th className="py-2.5 px-4 text-amber-700">LL Comps (O(n))</th>
                  <th className="py-2.5 px-4 text-emerald-700">BST Comps (O(log n))</th>
                  <th className="py-2.5 px-4 text-slate-900 font-bold">Reduction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2 px-4 text-slate-500">{h.timestamp}</td>
                    <td className="py-2 px-4 font-bold text-slate-800">{h.size.toLocaleString()}</td>
                    <td className="py-2 px-4 text-blue-700">{h.searchKey}</td>
                    <td className="py-2 px-4 capitalize text-slate-600">{h.scenario}</td>
                    <td className="py-2 px-4 font-bold text-amber-700">{h.llComparisons.toLocaleString()}</td>
                    <td className="py-2 px-4 font-bold text-emerald-700">{h.bstComparisons.toLocaleString()}</td>
                    <td className="py-2 px-4 font-bold text-emerald-600">{h.reductionPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Academic Viva Reference Card */}
      <Card className="bg-slate-50 border border-slate-200">
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Info size={16} className="text-blue-600" /> Viva Voce Technical Explanation
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
            <div>
              <p className="font-semibold text-slate-800 mb-1">Why does Linked List degrade with dataset size?</p>
              <p>
                A singly linked list has sequential node references (each node points only to <code className="font-mono text-slate-800">next</code>).
                To find a target, the algorithm must visit nodes one by one starting from <code className="font-mono text-slate-800">HEAD</code>.
                When N grows to 10,000, locating a tail element requires 10,000 comparisons.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-800 mb-1">Why is Binary Search Tree superior for reservation indexing?</p>
              <p>
                BST preserves the invariant: <code className="font-mono text-slate-800">left &lt; root &lt; right</code>.
                Each comparison immediately halves the search space. Even with 10,000 reservation keys,
                a balanced BST requires at most <code className="font-mono text-slate-800">ceil(log₂(10,000)) = 14</code> comparisons!
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
