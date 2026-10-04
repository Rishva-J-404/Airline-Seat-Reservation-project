import { ArrowRight } from 'lucide-react';
import type { TicketRequest } from '../../types';

interface QueueVisualizerProps {
  items: TicketRequest[];
  highlightFront?: boolean;
  compact?: boolean;
}

export function QueueVisualizer({ items, highlightFront = true, compact = false }: QueueVisualizerProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <ArrowRight className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-sm font-medium">Queue is empty</p>
        <p className="text-xs text-slate-400 mt-1">Enqueue a ticket request to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* FRONT label */}
      <div className="flex items-center gap-2 text-xs font-bold text-queue uppercase tracking-widest">
        <span className="px-2 py-0.5 bg-queue/10 rounded">FRONT</span>
        <div className="flex-1 border-t-2 border-dashed border-queue/20" />
      </div>

      {/* Queue items */}
      <div className={`flex flex-col gap-2 ${compact ? '' : 'px-2'}`}>
        {items.map((item, index) => {
          const isFront = index === 0;
          return (
            <div key={item.requestId} className="flex items-center gap-3">
              {/* Position badge */}
              <span className={`text-xs font-mono w-6 text-center ${isFront ? 'text-queue font-bold' : 'text-slate-400'}`}>
                {index + 1}
              </span>

              {/* Node box */}
              <div
                className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${
                  isFront && highlightFront
                    ? 'bg-queue text-white border-queue shadow-md'
                    : 'bg-violet-50 text-slate-700 border-violet-100'
                }`}
              >
                {/* Request ID */}
                <span className={`font-mono font-bold text-sm min-w-[40px] ${isFront && highlightFront ? 'text-white' : 'text-queue'}`}>
                  {item.requestId}
                </span>

                {!compact && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isFront && highlightFront ? 'text-white' : 'text-slate-700'}`}>
                        {item.passengerName}
                      </p>
                      <p className={`text-xs truncate ${isFront && highlightFront ? 'text-violet-100' : 'text-slate-400'}`}>
                        {item.flightNumber} &middot; {item.requestType}
                      </p>
                    </div>
                    {isFront && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold shrink-0">
                        Next
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Arrow to next */}
              {index < items.length - 1 && (
                <div className="text-slate-300 text-xs">
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* REAR label */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex-1 border-t-2 border-dashed border-slate-200" />
        <span className="px-2 py-0.5 bg-slate-100 rounded">REAR</span>
      </div>

      {/* Stats footer */}
      {!compact && (
        <div className="grid grid-cols-3 gap-2 pt-2">
          {[
            { label: 'Size', value: items.length },
            { label: 'Front', value: items[0]?.requestId ?? '--' },
            { label: 'Rear',  value: items[items.length - 1]?.requestId ?? '--' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center bg-violet-50 rounded-lg p-2 border border-violet-100">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="font-mono font-bold text-queue text-sm">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
