// components/dashboard/QueueTab.tsx
// Tab component for the Queue (CO1) demo section in DSADashboard

import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { QueueVisualizer } from '../dsa/QueueVisualizer';
import type { TicketRequest } from '../../types';

interface QueueTabProps {
  items: TicketRequest[];
  passengerName: string;
  flightNumber: string;
  requestType: 'booking' | 'cancellation' | 'upgrade';
  onPassengerNameChange: (v: string) => void;
  onFlightNumberChange:  (v: string) => void;
  onRequestTypeChange:   (v: 'booking' | 'cancellation' | 'upgrade') => void;
  onEnqueue:             () => void;
  onDequeue:             () => void;
  onClear:               () => void;
  onSeedSamples:         () => void;
}

const FLIGHTS = [
  { code: 'AI-201', label: 'AI-201 (Coimbatore - Chennai)' },
  { code: '6E-402', label: '6E-402 (Coimbatore - Chennai)' },
  { code: 'SG-112', label: 'SG-112 (Coimbatore - Mumbai)' },
  { code: 'UK-305', label: 'UK-305 (Chennai - Delhi)' },
  { code: 'AI-410', label: 'AI-410 (Mumbai - Bangalore)' },
];

export function QueueTab({
  items, passengerName, flightNumber, requestType,
  onPassengerNameChange, onFlightNumberChange, onRequestTypeChange,
  onEnqueue, onDequeue, onClear, onSeedSamples,
}: QueueTabProps) {
  return (
    <div className="space-y-6">
      {/* Description bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-violet-50 p-4 rounded-xl border border-violet-100">
        <div>
          <h4 className="font-semibold text-slate-800 text-sm">First-In First-Out (FIFO) Ticket Processing Queue</h4>
          <p className="text-xs text-slate-500 mt-1">
            Requests are enqueued at the REAR and serviced strictly from the FRONT. Enqueue O(1), Dequeue O(1).
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={onSeedSamples}>Add 3 Samples</Button>
          <Button
            variant="ghost" size="sm"
            onClick={onClear}
            disabled={items.length === 0}
            className="text-red-600 hover:bg-red-50"
          >
            Clear Queue
          </Button>
        </div>
      </div>

      {/* Visualizer */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <QueueVisualizer items={items} highlightFront />
      </div>

      {/* Enqueue form */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end pt-2">
        <div>
          <label htmlFor="q-name" className="block text-xs font-semibold text-slate-600 mb-1">Passenger Name</label>
          <input
            id="q-name"
            type="text"
            value={passengerName}
            onChange={e => onPassengerNameChange(e.target.value)}
            placeholder="e.g. Priya Sharma"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div>
          <label htmlFor="q-flight" className="block text-xs font-semibold text-slate-600 mb-1">Flight Code</label>
          <select
            id="q-flight"
            value={flightNumber}
            onChange={e => onFlightNumberChange(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            {FLIGHTS.map(f => <option key={f.code} value={f.code}>{f.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="q-type" className="block text-xs font-semibold text-slate-600 mb-1">Request Type</label>
          <select
            id="q-type"
            value={requestType}
            onChange={e => onRequestTypeChange(e.target.value as 'booking' | 'cancellation' | 'upgrade')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="booking">Booking Request</option>
            <option value="cancellation">Cancellation Request</option>
            <option value="upgrade">Upgrade Request</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={onEnqueue}
            icon={<Plus size={16} aria-hidden="true" />}
            className="bg-violet-600 hover:bg-violet-700 flex-1"
          >
            Enqueue
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={onDequeue}
            disabled={items.length === 0}
            className="flex-1"
          >
            Dequeue
          </Button>
        </div>
      </div>
    </div>
  );
}
