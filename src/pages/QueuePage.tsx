import React, { useState } from 'react';
import {
  List,
  Plus,
  Play,
  Trash2,
  Clock,
  CheckCircle,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/common/PageHeader';
import { ComplexityPanel } from '../components/common/ComplexityBadge';
import { QueueVisualizer } from '../components/dsa/QueueVisualizer';
import { generateRequestId } from '../utils/idGenerator';
import type { TicketRequest } from '../types';

export function QueuePage() {
  const { state, dispatch, addLog } = useApp();

  const [passengerName, setPassengerName] = useState('');
  const [flightNumber, setFlightNumber] = useState('AI-201');
  const [requestType, setRequestType] = useState<'booking' | 'cancellation' | 'upgrade'>('booking');
  const [lastProcessed, setLastProcessed] = useState<TicketRequest | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const queueItems = state.queueSnapshot;
  const queueSize = queueItems.length;
  const frontItem = queueSize > 0 ? queueItems[0] : null;
  const rearItem = queueSize > 0 ? queueItems[queueSize - 1] : null;

  const handleEnqueue = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = passengerName.trim() || 'Passenger ' + Math.floor(100 + Math.random() * 900);
    const newRequest: TicketRequest = {
      requestId: generateRequestId(),
      passengerName: finalName,
      flightNumber,
      requestType,
      timestamp: new Date(),
    };

    dispatch({ type: 'QUEUE_ENQUEUE', payload: newRequest });
    addLog(
      'Enqueue',
      'Added ' + newRequest.requestId + ' (' + newRequest.requestType + ') for ' + newRequest.passengerName + ' on ' + newRequest.flightNumber,
      'queue'
    );
    setPassengerName('');
    setNotice('Enqueued request ' + newRequest.requestId + ' successfully.');
  };

  const handleProcessNext = () => {
    if (queueSize === 0) return;
    const currentFront = queueItems[0];
    dispatch({ type: 'QUEUE_DEQUEUE' });
    setLastProcessed(currentFront);
    setNotice('Processed request ' + currentFront.requestId + ' (' + currentFront.passengerName + ') via FIFO order.');
    addLog(
      'Dequeue',
      'Processed front request ' + currentFront.requestId + ' (' + currentFront.passengerName + ', ' + currentFront.requestType + ')',
      'queue'
    );
  };

  const handleClearQueue = () => {
    if (queueSize === 0) return;
    dispatch({ type: 'QUEUE_CLEAR' });
    setLastProcessed(null);
    setNotice('Queue cleared. All pending requests removed.');
    addLog('Queue Clear', 'Cleared all requests from ticket request queue', 'queue');
  };

  const queueLogs = (state.algorithmLog || []).filter((l) => l.type === 'queue');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      <PageHeader
        title="Ticket Request Queue"
        subtitle="CO1 - FIFO: First In, First Out using a singly-linked node chain"
        icon={<List size={20} />}
        action={
          <Badge variant="default" size="md">
            CO1: FIFO Queue
          </Badge>
        }
      />

      {/* Top Banner Notice */}
      {notice && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 border border-slate-300 text-slate-900 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-slate-700 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-xs text-queue-600 hover:text-queue-800 font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Left = Visualizer & Notes, Right = Controls & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visualizer Card */}
          <Card>
            <CardHeader
              title="Queue Visualizer"
              subtitle="Linked node chain: Front is dequeued first, Rear receives incoming requests."
              accentColor="text-queue-600"
            />
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[140px] flex items-center justify-center overflow-x-auto">
              <QueueVisualizer items={queueItems} highlightFront={true} />
            </div>

            {/* Last Processed Item Bar */}
            {lastProcessed && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <span className="font-semibold">Last Processed (Dequeued):</span>
                <span className="font-mono">
                  {lastProcessed.requestId} - {lastProcessed.passengerName} ({lastProcessed.flightNumber} / {lastProcessed.requestType})
                </span>
              </div>
            )}
          </Card>

          {/* Queue Items Table */}
          <Card>
            <CardHeader
              title="Pending Requests in Queue"
              subtitle={queueSize + ' total item(s) awaiting processing in FIFO sequence'}
              accentColor="text-queue-600"
            />
            {queueSize === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                Queue is empty. Use the control panel on the right to enqueue a new ticket request.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                      <th className="py-2 px-3">Pos</th>
                      <th className="py-2 px-3">Req ID</th>
                      <th className="py-2 px-3">Passenger</th>
                      <th className="py-2 px-3">Flight</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queueItems.map((item, idx) => {
                      const isFront = idx === 0;
                      const isRear = idx === queueSize - 1;
                      return (
                        <tr
                          key={item.requestId}
                          className={isFront ? 'bg-queue-50/50 font-medium' : 'hover:bg-slate-50'}
                        >
                          <td className="py-2.5 px-3 text-xs text-slate-500 font-mono">
                            #{idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-queue-700">
                            {item.requestId}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800">{item.passengerName}</td>
                          <td className="py-2.5 px-3 font-mono text-xs text-slate-600">
                            {item.flightNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant={
                                item.requestType === 'booking'
                                  ? 'success'
                                  : item.requestType === 'cancellation'
                                  ? 'danger'
                                  : 'warning'
                              }
                              size="sm"
                            >
                              {item.requestType}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-xs">
                            {isFront && (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-queue-600 text-white font-bold text-[10px] tracking-wide">
                                FRONT
                              </span>
                            )}
                            {isRear && !isFront && (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-500 text-white font-bold text-[10px] tracking-wide">
                                REAR
                              </span>
                            )}
                            {!isFront && !isRear && (
                              <span className="text-slate-400 text-xs">WAITING</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Implementation Note */}
          <Card>
            <div className="flex items-start gap-3">
              <Info size={20} className="text-queue-600 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-slate-600">
                <h4 className="font-semibold text-slate-800">Queue Implementation Note</h4>
                <p>
                  This module implements a pure First-In, First-Out (FIFO) queue backed by a
                  singly-linked node chain. Two internal pointers are maintained:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 pl-1 font-mono">
                  <li>frontNode: points to the oldest request (next to be processed).</li>
                  <li>rearNode: points to the most recently inserted request.</li>
                </ul>
                <p className="text-xs">
                  Enqueue runs in O(1) time by attaching the new node directly to rearNode.next and
                  updating rearNode. Dequeue runs in O(1) time by moving frontNode to frontNode.next.
                  Because pointers are updated directly, no array element shifting or memory reallocation
                  is incurred.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Queue Stats Card */}
          <Card>
            <CardHeader title="Queue Stats" subtitle="Current status of the FIFO linked chain" />
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Size</p>
                <p className="text-2xl font-bold text-queue-700 mt-1">{queueSize}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">items currently queued</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Front</p>
                <p className="text-xl font-bold font-mono text-slate-800 mt-1">
                  {frontItem ? frontItem.requestId : 'None'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {frontItem ? frontItem.passengerName : 'Queue is empty'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rear</p>
                <p className="text-xl font-bold font-mono text-slate-800 mt-1">
                  {rearItem ? rearItem.requestId : 'None'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {rearItem ? rearItem.passengerName : 'Queue is empty'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {state.dsaStats.queueRequests}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">all-time enqueued</p>
              </div>
            </div>
          </Card>

          {/* Controls Card */}
          <Card>
            <CardHeader title="Queue Controls" subtitle="Enqueue, dequeue, and clear actions" />

            {/* Add Request Form */}
            <form onSubmit={handleEnqueue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Passenger Name
                </label>
                <input
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Flight
                  </label>
                  <select
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queue-500"
                  >
                    <option value="AI-201">AI-201 (DEL-BOM)</option>
                    <option value="6E-402">6E-402 (BLR-DEL)</option>
                    <option value="SG-112">SG-112 (BOM-MAA)</option>
                    <option value="UK-305">UK-305 (DEL-CCU)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Request Type
                  </label>
                  <select
                    value={requestType}
                    onChange={(e) =>
                      setRequestType(e.target.value as 'booking' | 'cancellation' | 'upgrade')
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queue-500"
                  >
                    <option value="booking">Booking</option>
                    <option value="cancellation">Cancellation</option>
                    <option value="upgrade">Upgrade</option>
                  </select>
                </div>
              </div>

              <Button type="submit" variant="queue" fullWidth icon={<Plus size={16} />}>
                Add Request (Enqueue)
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <Button
                variant="primary"
                fullWidth
                onClick={handleProcessNext}
                disabled={queueSize === 0}
                icon={<Play size={16} />}
              >
                Process Next Request (Dequeue)
              </Button>

              <Button
                variant="ghost"
                fullWidth
                onClick={handleClearQueue}
                disabled={queueSize === 0}
                icon={<Trash2 size={16} />}
                className="text-red-600 hover:bg-red-50"
              >
                Clear Queue
              </Button>
            </div>
          </Card>

          {/* Complexity Panel */}
          <ComplexityPanel
            title="Queue Time Complexity"
            items={[
              { label: 'Enqueue', complexity: 'O(1)', variant: 'good' },
              { label: 'Dequeue', complexity: 'O(1)', variant: 'good' },
              { label: 'Peek', complexity: 'O(1)', variant: 'good' },
              { label: 'Size', complexity: 'O(1)', variant: 'good' },
              { label: 'Display', complexity: 'O(n)', variant: 'medium' },
            ]}
          />

          {/* Operation Log */}
          <Card>
            <CardHeader
              title="Queue Operation Log"
              subtitle="Recent FIFO queue operations"
              icon={<Clock size={16} />}
              accentColor="text-queue-600"
            />
            {queueLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No queue operations recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {queueLogs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-queue-700">{log.operation}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-600">{log.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default QueuePage;
