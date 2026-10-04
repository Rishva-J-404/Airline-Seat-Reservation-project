import { Fragment } from 'react';
import { ArrowDown } from 'lucide-react';
import type { Passenger } from '../../types';

interface LinkedListVisualizerProps {
  items: Passenger[];
  highlightId?: string;
  compact?: boolean;
}

export function LinkedListVisualizer({ items, highlightId, compact = false }: LinkedListVisualizerProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
        <div className="text-4xl mb-2">&#8709;</div>
        <p className="text-sm font-medium">List is empty</p>
        <p className="text-xs mt-1">Insert a passenger to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-0">
      {/* HEAD badge */}
      <span className="mb-1 inline-block bg-ll-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-widest">
        HEAD
      </span>

      {items.map((passenger, idx) => {
        const isHighlighted = passenger.passengerId === highlightId;
        return (
          <Fragment key={passenger.passengerId}>
            {/* Node box */}
            <div
              className={[
                'rounded-lg border-2 transition-all',
                compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
                isHighlighted
                  ? 'bg-ll-500 border-ll-600 text-white shadow-lg'
                  : 'bg-ll-50 border-ll-300 text-ll-900',
              ].join(' ')}
              style={{ minWidth: compact ? 160 : 220 }}
            >
              <div className={['font-mono font-bold', isHighlighted ? 'text-white' : 'text-ll-700'].join(' ')}>
                {passenger.passengerId}
              </div>
              <div className={['font-medium truncate', isHighlighted ? 'text-white' : 'text-gray-800'].join(' ')}>
                {passenger.passengerName}
              </div>
              {!compact && (
                <div className={['text-xs mt-0.5', isHighlighted ? 'text-ll-100' : 'text-gray-500'].join(' ')}>
                  <span className="font-mono">{passenger.bookingId}</span>
                  {' | '}
                  <span>{passenger.flightNumber} &bull; {passenger.seatNumber}</span>
                </div>
              )}
            </div>

            {/* Arrow to next node */}
            {idx < items.length - 1 && (
              <div className="flex flex-col items-center my-0.5 self-start ml-6">
                <ArrowDown size={compact ? 14 : 18} className="text-ll-400" />
              </div>
            )}
          </Fragment>
        );
      })}

      {/* Arrow to NULL */}
      <div className="flex flex-col items-center my-0.5 self-start ml-6">
        <ArrowDown size={compact ? 14 : 18} className="text-ll-400" />
      </div>

      {/* NULL terminal box */}
      <div
        className={[
          'rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 font-mono font-bold flex items-center justify-center',
          compact ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm',
        ].join(' ')}
        style={{ minWidth: compact ? 60 : 80 }}
      >
        NULL
      </div>
    </div>
  );
}
