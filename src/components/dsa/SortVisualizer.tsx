import { ArrowDownUp } from 'lucide-react';
import type { SortStep } from '../../algorithms/SelectionSort';

interface SortVisualizerProps {
  steps: SortStep[];
  currentStep: number;
  original: number[];
  comparisons: number;
  swaps: number;
}

export function SortVisualizer({ steps, currentStep, original, comparisons, swaps }: SortVisualizerProps) {
  if (steps.length === 0) return null;
  const step = steps[currentStep];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-sm font-medium text-ink-muted mr-2">Original:</span>
        {original.map((val, i) => (
          <span key={i} className="px-2 py-1 rounded bg-slate-100 text-xs font-mono">{val}</span>
        ))}
      </div>

      <div className="h-48 border-b-2 border-slate-200 flex items-end justify-around gap-2 pb-2 relative">
        {step.array.map((val, i) => {
          const height = Math.max(10, (val / Math.max(...original)) * 100);
          
          let colorClass = 'bg-sort/30'; // unsorted default
          let textColor = 'text-ink-secondary';
          
          if (i < (step.sortedCount || 0)) {
            colorClass = 'bg-success';
            textColor = 'text-success-dark font-bold';
          } else if (step.comparingIndex !== undefined && step.comparingIndex >= 0 && i === step.comparingIndex) {
            colorClass = 'bg-sort';
            textColor = 'text-sort-dark font-bold';
          } else if (i === step.minIndex) {
            colorClass = 'bg-brand-500';
            textColor = 'text-brand-700 font-bold';
          }

          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div 
                className={`w-full rounded-t-sm transition-all duration-300 max-w-16 ${colorClass}`}
                style={{ height: `${height}%` }}
              ></div>
              <div className={`mt-2 text-xs tabular-nums ${textColor}`}>
                {val}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <p className="font-semibold text-ink-primary flex items-center gap-2">
            <ArrowDownUp className="w-4 h-4 text-sort" />
            Step {currentStep + 1} of {steps.length}
          </p>
          <p className="text-sm text-ink-secondary mt-1">{step.description}</p>
        </div>
        <div className="flex gap-4 text-sm font-mono bg-white px-3 py-2 rounded border border-slate-200 shadow-sm">
          <div><span className="text-ink-muted">Comparisons:</span> <span className="font-bold">{step.comparisons ?? comparisons}</span></div>
          <div><span className="text-ink-muted">Swaps:</span> <span className="font-bold">{step.swaps ?? swaps}</span></div>
        </div>
      </div>
      
      <div className="flex gap-4 text-xs font-medium">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-success rounded-sm"></div> Sorted</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-brand-500 rounded-sm"></div> Current Min</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-sort rounded-sm"></div> Comparing</div>
      </div>
    </div>
  );
}

