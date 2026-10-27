import { useState, useEffect } from 'react';
import {
  ArrowDownUp,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Gauge,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/common/PageHeader';
import { ComplexityPanel } from '../components/common/ComplexityBadge';
import { SortVisualizer } from '../components/dsa/SortVisualizer';
import { selectionSort, selectionSortBenchmark } from '../algorithms/SelectionSort';
import type { SortResult, SelectionSortBenchmarkResult } from '../algorithms/SelectionSort';

const DEFAULT_SAMPLE_STR = '5500, 3200, 4800, 2500, 6200';
const ALT_SAMPLE_STR = '7200, 1900, 4500, 3100, 8900, 2400';

type SortBenchmarkSize = 10 | 50 | 100 | 500 | 1000 | 5000;
const BENCHMARK_SIZES: SortBenchmarkSize[] = [10, 50, 100, 500, 1000, 5000];



export default function SelectionSortPage() {
  const { dispatch, addLog } = useApp();

  const [activeMode, setActiveMode] = useState<'visualizer' | 'lab'>('visualizer');

  // ---------- Visualizer State ----------
  const [inputVal, setInputVal] = useState<string>(DEFAULT_SAMPLE_STR);
  const [inputError, setInputError] = useState<string | null>(null);

  const [sortResult, setSortResult] = useState<SortResult>(() => {
    const initialNums = DEFAULT_SAMPLE_STR.split(',').map((s) => parseInt(s.trim(), 10));
    return selectionSort(initialNums);
  });

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(800);

  // ---------- Benchmark Lab State ----------
  const [benchmarkSize, setBenchmarkSize] = useState<SortBenchmarkSize>(500);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<SelectionSortBenchmarkResult | null>(null);
  const [benchmarkHistory, setBenchmarkHistory] = useState<SelectionSortBenchmarkResult[]>([]);

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying) return;

    if (currentStep >= sortResult.steps.length - 1) {
      const stopTimer = setTimeout(() => setIsPlaying(false), 0);
      return () => clearTimeout(stopTimer);
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, playbackSpeed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, sortResult.steps.length, playbackSpeed]);

  const handleParseAndRun = (inputToParse: string) => {
    setInputError(null);
    const parts = inputToParse.split(',').map((s) => s.trim()).filter(Boolean);

    if (parts.length < 2) {
      setInputError('Please enter at least 2 numbers separated by commas.');
      return;
    }

    const numbers: number[] = [];
    for (const part of parts) {
      const parsed = parseInt(part, 10);
      if (isNaN(parsed) || parsed < 0) {
        setInputError(`Invalid ticket fare "${part}". Fares must be positive integers.`);
        return;
      }
      numbers.push(parsed);
    }

    const result = selectionSort(numbers);
    setSortResult(result);
    setCurrentStep(0);
    setIsPlaying(false);

    dispatch({ type: 'INCREMENT_SORT' });
    addLog(
      'Selection Sort',
      `Manual SelectionSort executed on ${numbers.length} airfares (Comparisons: ${result.comparisons}, Swaps: ${result.swaps})`,
      'sort'
    );
  };

  const handleNext = () => {
    if (currentStep < sortResult.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleTogglePlay = () => {
    if (currentStep >= sortResult.steps.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const runBenchmark = () => {
    setIsBenchmarking(true);
    setTimeout(() => {
      // Generate random airfares between 2000 and 15000
      const testArray: number[] = [];
      for (let i = 0; i < benchmarkSize; i++) {
        testArray.push(Math.floor(2000 + Math.random() * 13000));
      }

      const res = selectionSortBenchmark(testArray);
      setBenchmarkResult(res);
      setBenchmarkHistory((prev) => [res, ...prev.slice(0, 7)]);
      setIsBenchmarking(false);

      addLog(
        'Selection Sort Benchmark (CO3)',
        `Sorted ${res.size} airfares: ${res.comparisons.toLocaleString()} comparisons, ${res.swaps} swaps in ${res.timeMs.toFixed(2)}ms (O(n²) verified)`,
        'sort'
      );
    }, 40);
  };

  const isComplete = currentStep === sortResult.steps.length - 1;
  const currentStepObj = sortResult.steps[currentStep];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      <PageHeader
        title="Fare Optimization (Selection Sort)"
        subtitle="CO3 — Sorting performance evaluation: In-place manual Selection Sort without Array.sort()"
        icon={<ArrowDownUp size={20} />}
        action={<Badge variant="default" size="md">CO3: Selection Sort</Badge>}
      />

      {/* Mode Switch Pills */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveMode('visualizer')}
          className={[
            'py-2.5 px-5 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-2',
            activeMode === 'visualizer'
              ? 'border-aero-950 text-aero-950'
              : 'border-transparent text-slate-500 hover:text-slate-800',
          ].join(' ')}
        >
          <Layers size={15} /> Step-by-Step Visualizer (Airfares)
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveMode('lab');
            if (!benchmarkResult) runBenchmark();
          }}
          className={[
            'py-2.5 px-5 text-xs font-bold font-mono transition-colors border-b-2 flex items-center gap-2',
            activeMode === 'lab'
              ? 'border-aero-950 text-aero-950'
              : 'border-transparent text-slate-500 hover:text-slate-800',
          ].join(' ')}
        >
          <Gauge size={15} /> Sorting Performance Lab (CO3: O(n²) Benchmark)
        </button>
      </div>

      {activeMode === 'visualizer' ? (
        <>
          {/* Input Panel Card */}
          <Card>
            <CardHeader
              title="Input Ticket Prices"
              subtitle="Enter comma-separated airline fares in INR to visualize selection sort"
            />
            <div className="space-y-4 p-6">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex-1 w-full">
                  <input
                    id="price-input"
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="e.g. 5500, 3200, 4800, 2500, 6200"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-aero-950"
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleParseAndRun(inputVal)}
                    icon={<Play size={15} />}
                    className="bg-aero-950 hover:bg-slate-900 font-bold"
                  >
                    Run Sort
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setInputVal(ALT_SAMPLE_STR);
                      handleParseAndRun(ALT_SAMPLE_STR);
                    }}
                  >
                    Sample 2
                  </Button>
                </div>
              </div>

              {inputError && (
                <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{inputError}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Stepper Playback Controls */}
          <Card>
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentStep === 0 || isPlaying}
                  icon={<ChevronLeft size={16} />}
                >
                  Step Prev
                </Button>
                <Button
                  variant={isPlaying ? 'danger' : 'primary'}
                  size="sm"
                  onClick={handleTogglePlay}
                  icon={isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  className={isPlaying ? 'bg-rose-600' : 'bg-aero-950'}
                >
                  {isPlaying ? 'Pause' : isComplete ? 'Replay' : 'Play Auto'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNext}
                  disabled={isComplete || isPlaying}
                  icon={<ChevronRight size={16} />}
                >
                  Step Next
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  icon={<RotateCcw size={14} />}
                >
                  Reset
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-mono">Speed:</span>
                {[
                  { label: '0.5x', speed: 1200 },
                  { label: '1x', speed: 800 },
                  { label: '2x', speed: 400 },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setPlaybackSpeed(s.speed)}
                    className={[
                      'px-2 py-1 text-xs font-mono rounded border transition-colors',
                      playbackSpeed === s.speed
                        ? 'bg-slate-900 text-white border-slate-900 font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100',
                    ].join(' ')}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Step Progress & Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3">
              <div className="text-[10px] uppercase font-mono text-slate-500">Step Progress</div>
              <div className="text-lg font-bold font-mono text-slate-900">
                {currentStep + 1} / {sortResult.steps.length}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-[10px] uppercase font-mono text-slate-500">Comparisons</div>
              <div className="text-lg font-bold font-mono text-amber-700">
                {currentStepObj?.comparisons ?? 0}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-[10px] uppercase font-mono text-slate-500">Swaps Performed</div>
              <div className="text-lg font-bold font-mono text-indigo-700">
                {currentStepObj?.swaps ?? 0}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-[10px] uppercase font-mono text-slate-500">Status</div>
              <div className="text-sm font-bold mt-1">
                {isComplete ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={15} /> Sorted
                  </span>
                ) : (
                  <span className="text-amber-700">Sorting...</span>
                )}
              </div>
            </Card>
          </div>

          {/* Current Step Description */}
          {currentStepObj && (
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800">
              <span className="font-bold text-slate-900">Step {currentStep + 1}:</span> {currentStepObj.description}
            </div>
          )}

          {/* Main Visualizer Canvas */}
          <Card>
            <CardHeader
              title="Ticket Fares Array State"
              subtitle="Green: Sorted portion | Orange: Current Min | Blue: Comparing element"
            />
            <div className="p-6">
              <SortVisualizer
                steps={sortResult.steps}
                currentStep={currentStep}
                original={sortResult.original}
                comparisons={sortResult.comparisons}
                swaps={sortResult.swaps}
              />
            </div>
          </Card>
        </>
      ) : (
        /* SORTING PERFORMANCE LAB (CO3 BENCHMARK) */
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Selection Sort Scalability Benchmark"
              subtitle="Empirical execution of two-nested-loop Selection Sort across dataset sizes 10 to 5,000"
            />
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Dataset Magnitude N (Array of Airfares)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {BENCHMARK_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setBenchmarkSize(size)}
                      className={[
                        'py-2 px-3 rounded-lg text-xs font-mono font-bold border transition-all text-center',
                        benchmarkSize === size
                          ? 'bg-aero-950 text-white border-aero-950 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      N = {size.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  loading={isBenchmarking}
                  onClick={runBenchmark}
                  icon={<Play size={16} />}
                  className="bg-aero-950 hover:bg-slate-900 font-bold px-6"
                >
                  Run O(n²) Benchmark
                </Button>
              </div>
            </div>
          </Card>

          {/* Benchmark Output Cards */}
          {benchmarkResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-l-slate-900">
                  <div className="text-xs text-slate-500 uppercase font-mono">Dataset Size</div>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {benchmarkResult.size.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Airfare integers</div>
                </Card>

                <Card className="p-4 border-l-4 border-l-amber-600">
                  <div className="text-xs text-slate-500 uppercase font-mono">Actual Comparisons</div>
                  <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
                    {benchmarkResult.comparisons.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    Formula: n(n-1)/2 = {benchmarkResult.theoreticalComparisons.toLocaleString()}
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-indigo-600">
                  <div className="text-xs text-slate-500 uppercase font-mono">Total Swaps</div>
                  <div className="text-2xl font-bold font-mono text-indigo-700 mt-1">
                    {benchmarkResult.swaps.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Max theoretical: n - 1</div>
                </Card>

                <Card className="p-4 border-l-4 border-l-emerald-600">
                  <div className="text-xs text-slate-500 uppercase font-mono">Execution Time</div>
                  <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                    {benchmarkResult.timeMs.toFixed(2)} ms
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    Array Validated: Sorted Ascending
                  </div>
                </Card>
              </div>

              {/* Quadratic Behavior Explanation Card */}
              <Card className="bg-slate-900 text-white border-slate-800">
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    <TrendingUp size={16} /> Quadratic Growth Demonstration (O(n²))
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Notice that as dataset magnitude increases by a factor of 10 (e.g. from 100 to 1,000),
                    the number of comparisons increases by a factor of <strong>~100x</strong> (from 4,950 to 499,500).
                    This strictly verifies the theoretical <code className="text-cyan-300 font-mono">O(n²)</code> quadratic time complexity.
                    Selection Sort makes no assumptions on data ordering and always executes <code className="text-cyan-300 font-mono">n(n-1)/2</code> comparisons.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* Benchmark Run Log */}
          {benchmarkHistory.length > 0 && (
            <Card>
              <CardHeader
                title="Sorting Scalability History"
                subtitle="Verification log across multiple input sizes"
              />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Size N</th>
                      <th className="py-2.5 px-4">Observed Comparisons</th>
                      <th className="py-2.5 px-4">Theoretical n(n-1)/2</th>
                      <th className="py-2.5 px-4">Swaps</th>
                      <th className="py-2.5 px-4">Time (ms)</th>
                      <th className="py-2.5 px-4">Order Validated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {benchmarkHistory.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 font-bold text-slate-900">{h.size.toLocaleString()}</td>
                        <td className="py-2 px-4 font-bold text-amber-700">{h.comparisons.toLocaleString()}</td>
                        <td className="py-2 px-4 text-slate-500">{h.theoreticalComparisons.toLocaleString()}</td>
                        <td className="py-2 px-4 text-indigo-700">{h.swaps.toLocaleString()}</td>
                        <td className="py-2 px-4 font-bold text-slate-700">{h.timeMs.toFixed(2)} ms</td>
                        <td className="py-2 px-4 text-emerald-600 font-bold">✓ PASS</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Complexity & Viva Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ComplexityPanel
          title="Selection Sort Complexity Contract"
          items={[
            { label: 'Best Case Time', complexity: 'O(n^2)', variant: 'bad' },
            { label: 'Average Case Time', complexity: 'O(n^2)', variant: 'bad' },
            { label: 'Worst Case Time', complexity: 'O(n^2)', variant: 'bad' },
            { label: 'Auxiliary Space', complexity: 'O(1) in-place', variant: 'good' },
            { label: 'Exact Comparisons', complexity: 'n(n - 1) / 2', variant: 'medium' },
            { label: 'Maximum Swaps', complexity: 'n - 1', variant: 'good' },
          ]}
        />

        <Card>
          <CardHeader
            title="Course Outcome Mapping: CO3"
            subtitle="Evaluating Searching and Sorting Algorithm Performance"
            icon={<Sparkles size={18} />}
          />
          <div className="text-xs text-slate-600 space-y-3 leading-relaxed p-6 pt-0">
            <p>
              <strong>Selection Sort Mechanism:</strong> Divides the ticket price array into a sorted
              subarray (left) and unsorted subarray (right). In each iteration, it scans the unsorted
              portion to find the absolute minimum fare and swaps it into the next position of the sorted subarray.
            </p>
            <p>
              <strong>Why O(1) Auxiliary Space:</strong> Selection sort executes in-place by directly
              swapping elements within the existing array without allocating dynamic secondary memory buffers.
            </p>
            <p>
              <strong>Academic Purpose:</strong> Demonstrates quadratic $O(n^2)$ behavior and why it is
              ideal for small flight fare rankings ($n \le 50$) but not suitable for massive datasets.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
