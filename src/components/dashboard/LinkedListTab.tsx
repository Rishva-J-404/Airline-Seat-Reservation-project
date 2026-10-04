// components/dashboard/LinkedListTab.tsx
// Tab component for the Linked List (CO2) demo section in DSADashboard

import { Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { LinkedListVisualizer } from '../dsa/LinkedListVisualizer';
import type { Passenger } from '../../types';

interface LinkedListTabProps {
  items: Passenger[];
  highlightId: string | undefined;
  name: string;
  flight: string;
  seat: string;
  fare: number;
  searchId: string;
  deleteId: string;
  onNameChange:     (v: string) => void;
  onFlightChange:   (v: string) => void;
  onSeatChange:     (v: string) => void;
  onFareChange:     (v: number) => void;
  onSearchIdChange: (v: string) => void;
  onDeleteIdChange: (v: string) => void;
  onInsert:         () => void;
  onSearch:         () => void;
  onDelete:         () => void;
  onClear:          () => void;
  onResetHighlight: () => void;
}

export function LinkedListTab({
  items, highlightId,
  name, flight, seat, fare, searchId, deleteId,
  onNameChange, onFlightChange, onSeatChange, onFareChange,
  onSearchIdChange, onDeleteIdChange,
  onInsert, onSearch, onDelete, onClear, onResetHighlight,
}: LinkedListTabProps) {
  return (
    <div className="space-y-6">
      {/* Description bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-cyan-50 p-4 rounded-xl border border-cyan-100">
        <div>
          <h4 className="font-semibold text-slate-800 text-sm">Singly Linked List Passenger Manifest</h4>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic node allocation prevents array resizing. Each node points to the subsequent record until NULL.
          </p>
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={onClear}
          disabled={items.length === 0}
          className="text-red-600 hover:bg-red-50 shrink-0"
        >
          Clear List
        </Button>
      </div>

      {/* Visualizer */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 overflow-x-auto">
        <LinkedListVisualizer items={items} highlightId={highlightId} />
      </div>

      {/* Operations: Insert | Search | Delete */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
        {/* Insert */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <Plus size={14} className="text-cyan-600" aria-hidden="true" />
            Insert Passenger (Tail)
          </h5>
          <input
            type="text"
            placeholder="Passenger Name"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            aria-label="New passenger name"
            className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 mb-2 focus:ring-1 focus:ring-cyan-500"
          />
          <div className="grid grid-cols-3 gap-1 mb-2">
            <input type="text" placeholder="Flight" value={flight} onChange={e => onFlightChange(e.target.value)} aria-label="Flight number" className="px-2 py-1 text-xs rounded border border-slate-200" />
            <input type="text" placeholder="Seat" value={seat} onChange={e => onSeatChange(e.target.value)} aria-label="Seat number" className="px-2 py-1 text-xs rounded border border-slate-200" />
            <input type="number" placeholder="Fare" value={fare} onChange={e => onFareChange(Number(e.target.value))} aria-label="Fare amount" className="px-2 py-1 text-xs rounded border border-slate-200" />
          </div>
          <Button variant="primary" size="sm" fullWidth onClick={onInsert} className="bg-cyan-600 hover:bg-cyan-700">
            Insert to Manifest
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <Search size={14} className="text-cyan-600" aria-hidden="true" />
            Search by Passenger ID
          </h5>
          <p className="text-xs text-slate-500">Traverses links from HEAD to match passengerId or bookingId.</p>
          <input
            type="text"
            placeholder="e.g. P101, B1001"
            value={searchId}
            onChange={e => onSearchIdChange(e.target.value)}
            aria-label="Search passenger ID"
            className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 focus:ring-1 focus:ring-cyan-500"
          />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" fullWidth onClick={onSearch} icon={<Search size={14} aria-hidden="true" />}>
              Search
            </Button>
            {highlightId && (
              <Button variant="ghost" size="sm" onClick={onResetHighlight} aria-label="Clear search highlight">
                Reset
              </Button>
            )}
          </div>
          {highlightId && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
              Found: {highlightId}
            </p>
          )}
        </div>

        {/* Delete */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <Trash2 size={14} className="text-red-600" aria-hidden="true" />
            Delete Passenger Node
          </h5>
          <p className="text-xs text-slate-500">Relinks pointers around the targeted node to remove it.</p>
          <input
            type="text"
            placeholder="Enter Passenger ID (e.g. P101)"
            value={deleteId}
            onChange={e => onDeleteIdChange(e.target.value)}
            aria-label="Delete passenger ID"
            className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 focus:ring-1 focus:ring-red-500"
          />
          <Button variant="danger" size="sm" fullWidth onClick={onDelete} disabled={!deleteId.trim()}>
            Delete Node
          </Button>
        </div>
      </div>
    </div>
  );
}
