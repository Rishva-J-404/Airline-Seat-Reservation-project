import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownUp,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Plane,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/common/PageHeader';
import { ComplexityPanel } from '../components/common/ComplexityBadge';
import { SortVisualizer } from '../components/dsa/SortVisualizer';
import { selectionSort } from '../algorithms/SelectionSort';
import type { SortResult } from '../algorithms/SelectionSort';
import { MOCK_FLIGHTS } from '../data/flights';

const DEFAULT_SAMPLE_STR = '5500, 3200, 4800, 2500, 6200';
const ALT_SAMPLE_STR = '7200, 1900, 4500, 3100, 8900, 2400';

interface FlightPriceMapping {
  flightNumber: string;
  airline: string;
  route: string;
  originalPrice: number;
}

function resolveFlightDetails(price: number, index: number): FlightPriceMapping {
  const match = MOCK_FLIGHTS.find((f) => f.price === price);
  if (match) {
    return {
      flightNumber: match.flightNumber,
      airline: match.airline,
      route: `${match.from} -> ${match.to}`,
      originalPrice: price,
    };
  }

  const fallbackCodes = ['AI-551', '6E-782', 'SG-904', 'UK-412', 'QP-108', 'G8-319', 'IX-622'];
  const fallbackAirlines = ['Air India', 'IndiGo', 'SpiceJet', 'Vistara', 'Akasa Air', 'GoFirst', 'Air India Express'];
  const fallbackRoutes = [
    'Delhi -> Mumbai',
    'Bangalore -> Goa',
    'Chennai -> Kolkata',
    'Hyderabad -> Pune',
    'Kochi -> Ahmedabad',
  ];

  return {
    flightNumber: fallbackCodes[index % fallbackCodes.length],
    airline: fallbackAirlines[index % fallbackAirlines.length],
    route: fallbackRoutes[index % fallbackRoutes.length],
    originalPrice: price,
  };
}

export default function SelectionSortPage() {
  const { dispatch, addLog } = useApp();

  const [inputVal, setInputVal] = useState<string>(DEFAULT_SAMPLE_STR);
  const [inputError, setInputError] = useState<string | null>(null);

  const [sortResult, setSortResult] = useState<SortResult>(() => {
    const initialNums = DEFAULT_SAMPLE_STR.split(',').map((s) => parseInt(s.trim(), 10));
    return selectionSort(initialNums);
  });

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(800);

  // Auto-play effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isPlaying && sortResult.steps.length > 0) {
      if (currentStep < sortResult.steps.length - 1) {
        timer = setTimeout(() => {
          setCurrentStep((prev) => prev + 1);
        }, playbackSpeed);
      } else {
        timer = setTimeout(() => {
          setIsPlaying(false);
        }, 0);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, currentStep, sortResult, playbackSpeed]);

  const handleParseAndRun = (input: string) => {
    const rawParts = input.split(',').map((s) => s.trim()).filter(Boolean);
    if (rawParts.length < 2) {
      setInputError('Please enter at least 2 ticket prices separated by commas.');
      return;
    }

    const numbers: number[] = [];
    for (const part of rawParts) {
      const parsed = parseInt(part, 10);
      if (isNaN(parsed) || parsed < 0) {
        setInputError(`Invalid price: "${part}". All prices must be positive numbers.`);
        return;
      }
      numbers.push(parsed);
    }

    if (numbers.length > 12) {
      setInputError('For optimal visualizer display, please enter at most 12 ticket prices.');
      return;
    }

    setInputError(null);
    const result = selectionSort(numbers);
    setSortResult(result);
    setCurrentStep(0);
    setIsPlaying(true);

    dispatch({ type: 'INCREMENT_SORT' });
    addLog(
      'Selection Sort',
      `Sorted array of ${numbers.length} ticket prices: [${numbers.join(', ')}]`,
      'sort'
    );
  };

  const handleLoadSample = (sample: string) => {
    setInputVal(sample);
    handleParseAndRun(sample);
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

  const flightMappings = useMemo(() => {
    return sortResult.original.map((price, idx) => resolveFlightDetails(price, idx));
  }, [sortResult]);

  const isComplete = currentStep === sortResult.steps.length - 1;
  const currentStepObj = sortResult.steps[currentStep];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Page Header */}
      <PageHeader
        title="Fare Optimization (Selection Sort)"
        subtitle="CO3 - Step-by-step sorting of airline ticket fares"
        icon={<ArrowDownUp size={20} />}
        action={
          <Badge variant="default" size="md">
            CO3: Sorting Algorithms
          </Badge>
        }
      />

      {/* Input Panel Card */}
      <Card>
        <CardHeader
          title="Input Ticket Prices"
          subtitle="Enter comma-separated airline fares in INR to visualize selection sort"
          accentColor="text-sort"
        />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 w-full">
              <label htmlFor="price-input" className="sr-only">
                Ticket Prices
              </label>
              <input
                id="price-input"
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setInputError(null);
                }}
                placeholder="e.g. 5500, 3200, 4800, 2500, 6200"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sort focus:border-sort"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                variant="primary"
                onClick={() => {
                  if (isPlaying) {
                    setIsPlaying(false);
                  } else {
                    handleParseAndRun(inputVal);
                  }
                }}
                className={isPlaying ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-sort hover:bg-amber-600 focus:ring-sort text-white'}
                icon={isPlaying ? <Pause size={15} /> : <Play size={15} />}
              >
                {isPlaying ? 'Pause Sort' : 'Run Sort'}
              </Button>

              <Button
                variant="secondary"
                onClick={() => handleLoadSample(DEFAULT_SAMPLE_STR)}
                className="text-xs"
              >
                Sample 1 (Default)
              </Button>

              <Button
                variant="secondary"
                onClick={() => handleLoadSample(ALT_SAMPLE_STR)}
                className="text-xs"
              >
                Sample 2 (6 Fares)
              </Button>

              <Button
                variant="ghost"
                onClick={handleReset}
                icon={<RotateCcw size={14} />}
                className="text-xs"
                title="Reset steps"
              >
                Reset
              </Button>
            </div>
          </div>

          {inputError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle size={14} className="shrink-0" />
              <span>{inputError}</span>
            </div>
          )}

          <div className="text-xs text-slate-500 flex flex-wrap gap-x-6 gap-y-1">
            <span>Algorithm: In-Place Selection Sort</span>
            <span>Order: Ascending (Lowest Price First)</span>
            <span>Target: Airline Ticket Fare Ranking</span>
          </div>
        </div>
      </Card>

      {/* Main Sort Visualizer Card */}
      <Card>
        <CardHeader
          title="Step-by-Step Visualization"
          subtitle={`Interactive progress of selection sort on ${sortResult.original.length} elements`}
          icon={<ArrowDownUp size={18} />}
          accentColor="text-sort"
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Speed:</span>
              <select
                aria-label="Playback speed"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="text-xs rounded border border-slate-200 bg-slate-50 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sort"
              >
                <option value={1200}>0.75x (Slow)</option>
                <option value={800}>1.0x (Normal)</option>
                <option value={400}>2.0x (Fast)</option>
              </select>
            </div>
          }
        />

        <div className="space-y-6">
          {/* Visualizer Component */}
          <SortVisualizer
            steps={sortResult.steps}
            currentStep={currentStep}
            original={sortResult.original}
            comparisons={currentStepObj?.comparisons ?? sortResult.comparisons}
            swaps={currentStepObj?.swaps ?? sortResult.swaps}
          />

          {/* Stepper Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            {/* Step Counter & Progress */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                Step {currentStep + 1} of {sortResult.steps.length}
              </div>
              <div className="w-36 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sort transition-all duration-300"
                  style={{
                    width: `${((currentStep + 1) / sortResult.steps.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Playback Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0 || isPlaying}
                icon={<ChevronLeft size={16} />}
              >
                Previous Step
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleTogglePlay}
                icon={isPlaying ? <Pause size={16} /> : <Play size={16} />}
                className={isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sort hover:bg-amber-600'}
              >
                {isPlaying ? 'Pause' : isComplete ? 'Replay' : 'Auto Play'}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleNext}
                disabled={currentStep >= sortResult.steps.length - 1 || isPlaying}
                icon={<ChevronRight size={16} />}
              >
                Next Step
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                icon={<RotateCcw size={16} />}
                title="Reset to beginning"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Completion Summary Card */}
      {isComplete && (
        <Card className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg">
                <CheckCircle2 size={22} className="text-emerald-600" />
                <span>Selection Sort Completed!</span>
              </div>
              <Badge variant="success" size="md">
                100% Sorted in Ascending Order
              </Badge>
            </div>

            <p className="text-sm text-emerald-700">
              The ticket prices have been sorted from lowest to highest. Below is the comparative
              analysis of the array state before and after the algorithm executed.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/80 border border-emerald-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                  Before Sorting (Original)
                </span>
                <div className="font-mono text-base font-bold text-slate-700">
                  [{sortResult.original.join(', ')}]
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/80 border border-emerald-100 shadow-sm">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide block mb-1">
                  After Sorting (Sorted)
                </span>
                <div className="font-mono text-base font-bold text-emerald-700">
                  [{sortResult.sorted.join(', ')}]
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-2 text-xs font-mono text-emerald-800">
              <div>
                <span className="text-slate-500">Total Elements:</span>{' '}
                <span className="font-bold">{sortResult.original.length}</span>
              </div>
              <div>
                <span className="text-slate-500">Total Comparisons:</span>{' '}
                <span className="font-bold">{sortResult.comparisons}</span>
              </div>
              <div>
                <span className="text-slate-500">Total Swaps:</span>{' '}
                <span className="font-bold">{sortResult.swaps}</span>
              </div>
              <div>
                <span className="text-slate-500">Algorithm Passes:</span>{' '}
                <span className="font-bold">{sortResult.original.length - 1}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Flight Name to Price Mapping */}
      <Card>
        <CardHeader
          title="Flight Fare Mapping"
          subtitle="Real-world context: How ticket prices correspond to airline flight routes"
          icon={<Plane size={18} />}
          accentColor="text-sort"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Flight</th>
                <th className="py-3 px-4">Airline</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4 text-right">Fare (INR)</th>
                <th className="py-3 px-4 text-center">Rank (Sorted)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flightMappings.map((item, idx) => {
                const sortedRank = sortResult.sorted.indexOf(item.originalPrice) + 1;
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {item.flightNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{item.airline}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{item.route}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sort">
                      Rs. {item.originalPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                        {sortedRank}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Complexity and DSA Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComplexityPanel
          title="Selection Sort Complexity Analysis"
          items={[
            { label: 'Best Case Time', complexity: 'O(n^2)', variant: 'bad' },
            { label: 'Average Case Time', complexity: 'O(n^2)', variant: 'bad' },
            { label: 'Worst Case Time', complexity: 'O(n^2)', variant: 'bad' },
            { label: 'Space Complexity', complexity: 'O(1)', variant: 'good' },
            { label: 'Comparisons', complexity: 'n(n - 1) / 2', variant: 'medium' },
            { label: 'Max Swaps', complexity: 'n - 1', variant: 'good' },
          ]}
        />

        <Card>
          <CardHeader
            title="Course Outcome Mapping: CO3"
            subtitle="Sorting & Searching Techniques in Airline Operations"
            icon={<Sparkles size={18} />}
            accentColor="text-sort"
          />

          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              <strong>Selection Sort Mechanism:</strong> Divides the ticket price array into a sorted
              subarray (left) and unsorted subarray (right). In each iteration, it scans the unsorted
              portion to find the absolute minimum fare and swaps it into the next position of the sorted
              subarray.
            </p>
            <p>
              <strong>Why O(1) Auxiliary Space:</strong> Selection sort executes in-place by directly
              swapping elements within the existing array without allocating dynamic secondary memory buffers.
            </p>
            <p>
              <strong>Airline Application:</strong> Ideal for sorting small result sets (e.g., top 10-20
              flight results by cheapest fare) on memory-constrained client devices and airport display kiosks.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}


