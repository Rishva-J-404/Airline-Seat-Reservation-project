// components/dashboard/SortTab.tsx
// Tab component for the Selection Sort (CO3) demo section in DSADashboard

import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { SortVisualizer } from '../dsa/SortVisualizer';
import type { SortResult } from '../../algorithms/SelectionSort';

interface SortTabProps {
  sortInput:    string;
  sortResult:   SortResult;
  currentStep:  number;
  isPlaying:    boolean;
  sortError:    string | null;
  onInputChange: (v: string) => void;
  onRunSort:     () => void;
  onPrev:        () => void;
  onNext:        () => void;
  onTogglePlay:  () => void;
  onReset:       () => void;
}

export function SortTab({
  sortInput, sortResult, currentStep, isPlaying, sortError,
  onInputChange, onRunSort, onPrev, onNext, onTogglePlay, onReset,
}: SortTabProps) {
  const totalSteps = sortResult.steps.length;
  const step = sortResult.steps[currentStep];

  return (
    <div className="space-y-6">
      {/* Description + input bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-amber-50 p-4 rounded-xl border border-amber-100">
        <div>
          <h4 className="font-semibold text-slate-800 text-sm">In-Place Selection Sort for Ticket Prices</h4>
          <p className="text-xs text-slate-500 mt-1">
            Repeatedly selects the minimum from the unsorted partition and swaps it into place.
            Time: O(n&#178;), Space: O(1).
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="sort-input" className="sr-only">Comma-separated prices</label>
          <input
            id="sort-input"
            type="text"
            value={sortInput}
            onChange={e => onInputChange(e.target.value)}
            placeholder="5500, 3200, 4800, 2500, 6200"
            className="px-3 py-1.5 text-xs rounded border border-slate-200 font-mono w-56 focus:ring-1 focus:ring-amber-500"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={isPlaying ? onTogglePlay : onRunSort}
            className={isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'}
            icon={isPlaying ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
          >
            {isPlaying ? 'Pause' : 'Sort Prices'}
          </Button>
        </div>
      </div>

      {sortError && (
        <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {sortError}
        </p>
      )}

      {/* Visualizer */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <SortVisualizer
          steps={sortResult.steps}
          currentStep={currentStep}
          original={sortResult.original}
          comparisons={step?.comparisons ?? sortResult.comparisons}
          swaps={step?.swaps ?? sortResult.swaps}
        />
      </div>

      {/* Stepper controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-xs font-mono text-slate-600" aria-live="polite">
          Step {currentStep + 1} of {totalSteps}
          {step?.sortedBoundary !== undefined && ` | Sorted: ${step.sortedBoundary} element(s)`}
        </p>
        <div className="flex items-center gap-2" role="toolbar" aria-label="Sort step controls">
          <Button variant="secondary" size="sm" onClick={onPrev} disabled={currentStep === 0 || isPlaying} icon={<ChevronLeft size={14} aria-hidden="true" />} aria-label="Previous step">
            Prev
          </Button>
          <Button
            variant="primary" size="sm"
            onClick={onTogglePlay}
            icon={isPlaying ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            className="bg-amber-500 hover:bg-amber-600"
            aria-pressed={isPlaying}
          >
            {isPlaying ? 'Pause' : 'Auto Play'}
          </Button>
          <Button variant="secondary" size="sm" onClick={onNext} disabled={currentStep >= totalSteps - 1 || isPlaying} icon={<ChevronRight size={14} aria-hidden="true" />} aria-label="Next step">
            Next
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset} icon={<RotateCcw size={14} aria-hidden="true" />} aria-label="Reset to step 1">
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
