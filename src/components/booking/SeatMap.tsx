import React, { useState } from 'react';
import type { Seat } from '../../types';

interface SeatMapProps {
  seats: Seat[];
  onSeatSelect: (s: Seat) => void;
  selectedSeatId?: string;
  recommendedSeatId?: string;
}

interface TooltipState {
  seat: Seat;
  x: number;
  y: number;
}

function getSeatClass(
  seat: Seat,
  selectedSeatId?: string,
  recommendedSeatId?: string
): string {
  if (seat.status === 'occupied' || (seat as any).isOccupied) return 'seat-occupied';
  if (seat.id === selectedSeatId || seat.status === 'selected') return 'seat-selected';
  if (seat.id === recommendedSeatId || seat.status === 'recommended') return 'seat-recommended';
  return 'seat-available';
}

function getSeatTitle(seat: Seat): string {
  const parts: string[] = [seat.id];
  if ((seat as any).class) parts.push((seat as any).class);
  if (seat.type === 'window' || (seat as any).isWindowSeat) parts.push('Window');
  if (seat.type === 'aisle' || (seat as any).isAisleSeat) parts.push('Aisle');
  if (seat.hasExtraLegroom) parts.push('Extra Legroom');
  if (seat.isQuietZone) parts.push('Quiet Zone');
  if (seat.status === 'occupied' || (seat as any).isOccupied) parts.push('Occupied');
  return parts.join(' | ');
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  onSeatSelect,
  selectedSeatId,
  recommendedSeatId,
}) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Build lookup: seatId -> Seat
  const seatMap: Record<string, Seat> = {};
  for (const seat of seats) {
    seatMap[seat.id] = seat;
  }

  // Determine rows (1 to 20)
  const rowNums = Array.from({ length: 20 }, (_, i) => i + 1);

  function handleMouseEnter(seat: Seat, e: React.MouseEvent<HTMLButtonElement>) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ seat, x: rect.left, y: rect.top });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  return (
    <div className="relative select-none font-sans max-w-md mx-auto">
      {/* Fuselage Hull Container with realistic aircraft nose curvature */}
      <div className="rounded-t-[88px] rounded-b-xl border-2 border-slate-300 bg-white p-4 sm:p-6 shadow-sm">
        {/* Cockpit Nose Cone & Flight Deck */}
        <div className="text-center pt-2 pb-4 mb-4 border-b border-slate-200">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono uppercase tracking-widest text-slate-600 font-semibold mb-2">
            <span>Airbus A320neo · 20 Rows</span>
          </div>
          <div className="flex justify-center items-center gap-2">
            <div className="w-10 h-1.5 bg-slate-800 rounded-full" />
            <div className="w-10 h-1.5 bg-slate-800 rounded-full" />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-medium mt-1">
            Flight Deck · Cockpit Forward
          </p>
        </div>

        {/* Galley & Lavatory Ahead of Row 1 */}
        <div className="grid grid-cols-2 gap-2 mb-4 pb-3 border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase text-center">
          <div className="p-1 rounded bg-slate-50 border border-slate-200">Forward Galley</div>
          <div className="p-1 rounded bg-slate-50 border border-slate-200">Lavatory L1</div>
        </div>

        {/* Column Headers with Row Placeholder on left and right */}
        <div className="mb-2.5 flex items-center justify-between text-xs font-mono font-bold text-slate-600 px-1">
          <div className="w-6 text-center text-[10px] text-slate-400">ROW</div>
          <div className="flex items-center gap-2">
            <div className="w-8 sm:w-9 text-center">A</div>
            <div className="w-8 sm:w-9 text-center">B</div>
          </div>
          {/* Central Aisle Label */}
          <div className="w-8 text-center text-[10px] text-slate-400 tracking-wider">AISLE</div>
          <div className="flex items-center gap-2">
            <div className="w-8 sm:w-9 text-center">C</div>
            <div className="w-8 sm:w-9 text-center">D</div>
          </div>
          <div className="w-6 text-center text-[10px] text-slate-400">ROW</div>
        </div>

        {/* 20 Rows Matrix */}
        <div className="flex flex-col gap-1.5">
          {rowNums.map((row) => {
            const isExitRow = row === 10;
            const isWingRow = row >= 8 && row <= 13;

            return (
              <React.Fragment key={row}>
                {isExitRow && (
                  <div className="my-1.5 py-1 px-3 rounded bg-amber-50 border border-amber-200 text-center flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold">
                      EXIT ◀
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-900 font-bold">
                      Row 10 Overwing Emergency Exit (Extra Legroom)
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold">
                      ▶ EXIT
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between relative">
                  {/* Wing indicator flanking row */}
                  {isWingRow && (
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-slate-300 pointer-events-none hidden sm:block">
                      |
                    </div>
                  )}

                  {/* Left row indicator */}
                  <span className="w-6 text-center text-xs font-mono font-semibold text-slate-500">
                    {row}
                  </span>

                  {/* Left Seats (A, B) */}
                  <div className="flex items-center gap-2">
                    {['A', 'B'].map((col) => {
                      const seatId = `${row}${col}`;
                      const seat = seatMap[seatId];
                      const cls = seat ? getSeatClass(seat, selectedSeatId, recommendedSeatId) : '';
                      const isOccupied = !seat || seat.status === 'occupied' || (seat as any).isOccupied;

                      return (
                        <button
                          key={seatId}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => seat && !isOccupied && onSeatSelect(seat)}
                          onMouseEnter={(e) => seat && handleMouseEnter(seat, e)}
                          onMouseLeave={handleMouseLeave}
                          aria-label={seat ? getSeatTitle(seat) : seatId}
                          className={[
                            'w-8 h-8 sm:w-9 sm:h-9 rounded text-xs font-mono font-bold flex items-center justify-center transition-all duration-150',
                            cls === 'seat-available'
                              ? 'bg-white text-slate-800 border border-slate-300 hover:border-flight-azure hover:bg-blue-50/50 cursor-pointer shadow-2xs hover:scale-105 active:scale-95'
                              : cls === 'seat-occupied'
                              ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-60'
                              : cls === 'seat-selected'
                              ? 'bg-flight-azure text-white border-flight-azure shadow-md ring-2 ring-blue-300 font-black scale-105'
                              : cls === 'seat-recommended'
                              ? 'bg-emerald-50 text-emerald-950 border-2 border-emerald-500 font-black shadow-2xs ring-2 ring-emerald-200'
                              : 'bg-white border-slate-200 text-slate-400',
                          ].join(' ')}
                        >
                          {isOccupied ? 'x' : col}
                        </button>
                      );
                    })}
                  </div>

                  {/* Central Aisle Gap */}
                  <div className="w-8 flex items-center justify-center">
                    <div className="h-4 w-px bg-slate-200" />
                  </div>

                  {/* Right Seats (C, D) */}
                  <div className="flex items-center gap-2">
                    {['C', 'D'].map((col) => {
                      const seatId = `${row}${col}`;
                      const seat = seatMap[seatId];
                      const cls = seat ? getSeatClass(seat, selectedSeatId, recommendedSeatId) : '';
                      const isOccupied = !seat || seat.status === 'occupied' || (seat as any).isOccupied;

                      return (
                        <button
                          key={seatId}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => seat && !isOccupied && onSeatSelect(seat)}
                          onMouseEnter={(e) => seat && handleMouseEnter(seat, e)}
                          onMouseLeave={handleMouseLeave}
                          aria-label={seat ? getSeatTitle(seat) : seatId}
                          className={[
                            'w-8 h-8 sm:w-9 sm:h-9 rounded text-xs font-mono font-bold flex items-center justify-center transition-all duration-150',
                            cls === 'seat-available'
                              ? 'bg-white text-slate-800 border border-slate-300 hover:border-flight-azure hover:bg-blue-50/50 cursor-pointer shadow-2xs hover:scale-105 active:scale-95'
                              : cls === 'seat-occupied'
                              ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-60'
                              : cls === 'seat-selected'
                              ? 'bg-flight-azure text-white border-flight-azure shadow-md ring-2 ring-blue-300 font-black scale-105'
                              : cls === 'seat-recommended'
                              ? 'bg-emerald-50 text-emerald-950 border-2 border-emerald-500 font-black shadow-2xs ring-2 ring-emerald-200'
                              : 'bg-white border-slate-200 text-slate-400',
                          ].join(' ')}
                        >
                          {isOccupied ? 'x' : col}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right row indicator */}
                  <span className="w-6 text-center text-xs font-mono font-semibold text-slate-500">
                    {row}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Galley Rear Casing & Lavatories */}
        <div className="mt-5 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 uppercase text-center mb-2">
            <div className="p-1 rounded bg-slate-50 border border-slate-200">Lavatory L2</div>
            <div className="p-1 rounded bg-slate-50 border border-slate-200">Aft Galley</div>
          </div>
          <div className="text-center text-[10px] font-mono uppercase tracking-widest text-slate-400">
            Aft Aircraft Bulkhead · Empennage Direction
          </div>
        </div>
      </div>

      {/* Cabin Legend */}
      <div className="mt-4 p-3 rounded-lg bg-white border border-slate-200 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-700 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-white border border-slate-300" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-flight-azure border border-flight-azure shadow-xs" />
          <span className="font-semibold text-slate-900">Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200 text-slate-400 text-[10px] font-mono flex items-center justify-center">
            x
          </div>
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-emerald-50 border-2 border-emerald-500" />
          <span>AI Best Match</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-300" />
          <span>Exit Row</span>
        </div>
      </div>

      {/* Flight Tooltip Popover */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded bg-slate-900 px-3 py-2 text-xs text-white shadow-lg border border-slate-700 font-mono"
          style={{ top: tooltip.y - 70, left: tooltip.x - 10 }}
        >
          <p className="font-bold text-sm text-white">Seat {tooltip.seat.id}</p>
          {(tooltip.seat.type === 'window' || (tooltip.seat as any).isWindowSeat) && (
            <p className="text-slate-300">Window View</p>
          )}
          {(tooltip.seat.type === 'aisle' || (tooltip.seat as any).isAisleSeat) && (
            <p className="text-slate-300">Direct Aisle Access</p>
          )}
          {tooltip.seat.hasExtraLegroom && (
            <p className="text-amber-300">34-inch Extended Legroom</p>
          )}
          {tooltip.seat.isQuietZone && (
            <p className="text-slate-300">Quiet Zone Cabin</p>
          )}
          {(tooltip.seat.status === 'occupied' || (tooltip.seat as any).isOccupied) && (
            <p className="text-rose-300">Occupied by Another Passenger</p>
          )}
        </div>
      )}
    </div>
  );
};
