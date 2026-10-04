import React, { useState } from 'react';
import {
  Network,
  Plus,
  Trash2,
  Search,
  RotateCcw,
  CheckCircle,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/common/PageHeader';
import { ComplexityPanel } from '../components/common/ComplexityBadge';
import { LinkedListVisualizer } from '../components/dsa/LinkedListVisualizer';
import { generatePassengerId, generateBookingId } from '../utils/idGenerator';
import type { Passenger } from '../types';

export function LinkedListPage() {
  const { state, dispatch, addLog } = useApp();

  // Form states
  const [passengerName, setPassengerName] = useState('');
  const [flightNumber, setFlightNumber] = useState('AI-201');
  const [seatNumber, setSeatNumber] = useState('14A');
  const [fare, setFare] = useState('3500');

  const [deleteTargetId, setDeleteTargetId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    passenger?: Passenger;
    message: string;
    comparisons: number;
  } | null>(null);

  const [highlightId, setHighlightId] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);

  const listItems = state.linkedListSnapshot;
  const listSize = listItems.length;
  const headNode = listSize > 0 ? listItems[0] : null;
  const tailNode = listSize > 0 ? listItems[listSize - 1] : null;

  // Insert handler
  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = passengerName.trim() || 'Passenger ' + Math.floor(100 + Math.random() * 900);
    const newPassenger: Passenger = {
      passengerId: generatePassengerId(),
      passengerName: finalName,
      bookingId: generateBookingId(),
      flightNumber: flightNumber.trim() || 'AI-201',
      seatNumber: seatNumber.trim() || '14A',
      fare: Number(fare) || 3500,
    };

    dispatch({ type: 'LL_INSERT', payload: newPassenger });
    addLog(
      'LL Insert',
      'Inserted node ' + newPassenger.passengerId + ' (' + newPassenger.passengerName + ') at list tail',
      'linkedlist'
    );

    setHighlightId(newPassenger.passengerId);
    setNotice('Inserted ' + newPassenger.passengerId + ' (' + newPassenger.passengerName + ') into linked list.');
    setPassengerName('');
    setSeatNumber(Math.floor(Math.random() * 28 + 1) + ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]);
  };

  // Delete handler
  const handleDeleteById = (targetId: string) => {
    const idToFind = targetId.trim().toUpperCase();
    if (!idToFind) return;

    const exists = listItems.some((p) => p.passengerId.toUpperCase() === idToFind);
    if (!exists) {
      setNotice('Delete failed: Passenger ID ' + idToFind + ' not found in linked list.');
      return;
    }

    const passenger = listItems.find((p) => p.passengerId.toUpperCase() === idToFind);
    dispatch({ type: 'LL_DELETE', payload: idToFind });
    addLog(
      'LL Delete',
      'Deleted node ' + idToFind + (passenger ? ' (' + passenger.passengerName + ')' : ''),
      'linkedlist'
    );

    if (highlightId?.toUpperCase() === idToFind) {
      setHighlightId(undefined);
    }
    setDeleteTargetId('');
    setNotice('Deleted node with Passenger ID ' + idToFind + '. Pointers updated.');
  };

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResult(null);
      setHighlightId(undefined);
      return;
    }

    let comparisons = 0;
    let match: Passenger | null = null;

    for (const item of listItems) {
      comparisons++;
      if (
        item.passengerId.toLowerCase() === query ||
        item.passengerName.toLowerCase().includes(query) ||
        item.bookingId.toLowerCase() === query
      ) {
        match = item;
        break;
      }
    }

    if (match) {
      setSearchResult({
        found: true,
        passenger: match,
        message: 'Found: Traversed ' + comparisons + ' node(s) from HEAD.',
        comparisons,
      });
      setHighlightId(match.passengerId);
      addLog(
        'LL Search',
        'Found ' + match.passengerId + ' (' + match.passengerName + ') after ' + comparisons + ' comparison(s)',
        'linkedlist'
      );
    } else {
      setSearchResult({
        found: false,
        message: 'Not Found: Traversed all ' + comparisons + ' node(s) to NULL without match.',
        comparisons,
      });
      setHighlightId(undefined);
      addLog(
        'LL Search',
        'Searched for "' + searchQuery + '", node Not Found after ' + comparisons + ' comparison(s)',
        'linkedlist'
      );
    }
  };

  // Clear handler
  const handleClear = () => {
    if (listSize === 0) return;
    dispatch({ type: 'LL_CLEAR' });
    setHighlightId(undefined);
    setSearchResult(null);
    setNotice('Linked list cleared. Head pointer reset to NULL.');
    addLog('LL Clear', 'Cleared all nodes in passenger linked list', 'linkedlist');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      <PageHeader
        title="Passenger Manifest (Linked List)"
        subtitle="CO2 - Dynamic passenger record management using singly-linked nodes"
        icon={<Network size={20} />}
        action={
          <Badge variant="default" size="md">
            CO2: Linked List
          </Badge>
        }
      />

      {/* Notice Banner */}
      {notice && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 border border-slate-300 text-slate-900 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-slate-700 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Left = Visualizer & Nodes, Right = Controls & Complexity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visualizer Card */}
          <Card>
            <CardHeader
              title="Linked List Node Chain"
              subtitle="Singly-linked pointers: Each node points to next node, terminating at NULL."
              accentColor="text-ll-600"
              action={
                highlightId ? (
                  <span className="text-xs font-mono text-ll-700 bg-ll-100 px-2 py-0.5 rounded">
                    Selected: {highlightId}
                  </span>
                ) : null
              }
            />

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 min-h-[180px] flex items-center justify-center overflow-x-auto">
              <LinkedListVisualizer items={listItems} highlightId={highlightId} />
            </div>

            {/* Quick Helper */}
            <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
              <span>Click a passenger in the records table below to highlight that node.</span>
              {highlightId && (
                <button
                  onClick={() => setHighlightId(undefined)}
                  className="text-ll-600 hover:underline font-medium"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </Card>

          {/* Passenger Node Records Table */}
          <Card>
            <CardHeader
              title="Passenger Node Records"
              subtitle={listSize + ' node(s) ordered sequentially from HEAD to TAIL'}
              accentColor="text-ll-600"
            />
            {listSize === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                Linked list is empty (HEAD points to NULL). Insert a passenger using the form on the right.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                      <th className="py-2 px-3">Node</th>
                      <th className="py-2 px-3">ID</th>
                      <th className="py-2 px-3">Passenger</th>
                      <th className="py-2 px-3">Flight / Seat</th>
                      <th className="py-2 px-3">Fare</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {listItems.map((p, idx) => {
                      const isHead = idx === 0;
                      const isTail = idx === listSize - 1;
                      const isSelected = p.passengerId === highlightId;
                      return (
                        <tr
                          key={p.passengerId}
                          onClick={() => setHighlightId(p.passengerId)}
                          className={[
                            'cursor-pointer transition-colors',
                            isSelected
                              ? 'bg-ll-50 font-medium'
                              : 'hover:bg-slate-50',
                          ].join(' ')}
                        >
                          <td className="py-2.5 px-3 text-xs font-mono text-slate-500">
                            {isHead ? (
                              <Badge variant="ll" size="sm">HEAD</Badge>
                            ) : isTail ? (
                              <Badge variant="default" size="sm">TAIL</Badge>
                            ) : (
                              '#' + (idx + 1)
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-ll-700">
                            {p.passengerId}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-slate-800">{p.passengerName}</div>
                            <div className="text-[11px] font-mono text-slate-400">{p.bookingId}</div>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-slate-600 font-mono">
                            {p.flightNumber} ({p.seatNumber})
                          </td>
                          <td className="py-2.5 px-3 text-xs font-semibold text-slate-700">
                            INR {p.fare}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteById(p.passengerId);
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title={'Delete ' + p.passengerId}
                            >
                              <Trash2 size={14} />
                            </button>
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
              <Info size={20} className="text-ll-600 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-slate-600">
                <h4 className="font-semibold text-slate-800">Linked List Architecture</h4>
                <p>
                  Each passenger record is wrapped in an individual ListNode containing a data payload
                  and a next reference pointing to the succeeding node. The list maintains a HEAD reference
                  and terminates when next is NULL.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800 block">Dynamic Sizing:</span>
                    Nodes are allocated on demand without fixed array capacity restrictions or expensive array reallocation.
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800 block">Pointer Rewiring:</span>
                    Deletions splice out target nodes by connecting current.next to current.next.next, leaving the garbage collector to reclaim unused nodes.
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader title="List Stats" subtitle="Head, tail, and node count indicators" />
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Size</p>
                <p className="text-2xl font-bold text-ll-700 mt-1">{listSize}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">nodes in list</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Head</p>
                <p className="text-sm font-bold font-mono text-slate-800 mt-2 truncate">
                  {headNode ? headNode.passengerId : 'NULL'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {headNode ? headNode.passengerName : 'Empty'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tail</p>
                <p className="text-sm font-bold font-mono text-slate-800 mt-2 truncate">
                  {tailNode ? tailNode.passengerId : 'NULL'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {tailNode ? tailNode.passengerName : 'Empty'}
                </p>
              </div>
            </div>
          </Card>

          {/* Controls: Insert, Delete, Search, Clear */}
          <Card>
            <CardHeader title="List Controls" subtitle="Dynamic operations on singly-linked chain" />

            <div className="space-y-6">
              {/* Insert Form */}
              <form onSubmit={handleInsert} className="space-y-3 pb-5 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Plus size={14} className="text-ll-600" />
                  Insert Passenger Record
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Passenger Name
                  </label>
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ll-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Flight
                    </label>
                    <select
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ll-500"
                    >
                      <option value="AI-201">AI-201</option>
                      <option value="6E-402">6E-402</option>
                      <option value="SG-112">SG-112</option>
                      <option value="UK-305">UK-305</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Seat
                    </label>
                    <input
                      type="text"
                      value={seatNumber}
                      onChange={(e) => setSeatNumber(e.target.value)}
                      placeholder="14A"
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ll-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Fare (INR)
                    </label>
                    <input
                      type="number"
                      value={fare}
                      onChange={(e) => setFare(e.target.value)}
                      placeholder="3500"
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ll-500"
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" fullWidth size="sm" icon={<Plus size={14} />}>
                  Insert Passenger (Tail O(n))
                </Button>
              </form>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="space-y-3 pb-5 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Search size={14} className="text-ll-600" />
                  Search Node by ID or Name
                </h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. P101, B1001, or Name"
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ll-500"
                  />
                  <Button type="submit" variant="secondary" size="sm" icon={<Search size={14} />}>
                    Search
                  </Button>
                </div>

                {/* Search Result Feedback */}
                {searchResult && (
                  <div
                    className={[
                      'p-2.5 rounded-lg text-xs space-y-1',
                      searchResult.found
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border border-amber-200 text-amber-900',
                    ].join(' ')}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Status: {searchResult.found ? 'Found' : 'Not Found'}</span>
                      <span className="font-mono text-[10px]">
                        {searchResult.comparisons} node(s) checked
                      </span>
                    </div>
                    <p className="text-[11px]">{searchResult.message}</p>
                    {searchResult.passenger && (
                      <div className="mt-1 pt-1 border-t border-emerald-200 font-mono text-[11px]">
                        {searchResult.passenger.passengerId}: {searchResult.passenger.passengerName} (Flight: {searchResult.passenger.flightNumber}, Seat: {searchResult.passenger.seatNumber})
                      </div>
                    )}
                  </div>
                )}
              </form>

              {/* Delete Form */}
              <div className="space-y-3 pb-5 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Trash2 size={14} className="text-red-500" />
                  Delete Passenger by ID
                </h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deleteTargetId}
                    onChange={(e) => setDeleteTargetId(e.target.value)}
                    placeholder="Enter ID, e.g. P101"
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteById(deleteTargetId)}
                    disabled={!deleteTargetId.trim()}
                    icon={<Trash2 size={14} />}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Clear Entire List */}
              <div className="pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={handleClear}
                  disabled={listSize === 0}
                  icon={<RotateCcw size={14} />}
                  className="text-red-600 hover:bg-red-50 text-xs"
                >
                  Clear Entire Linked List
                </Button>
              </div>
            </div>
          </Card>

          {/* Complexity Panel */}
          <ComplexityPanel
            title="Linked List Time Complexity"
            items={[
              { label: 'Insert Head', complexity: 'O(1)', variant: 'good' },
              { label: 'Insert Tail', complexity: 'O(n)', variant: 'medium' },
              { label: 'Delete', complexity: 'O(n)', variant: 'medium' },
              { label: 'Search', complexity: 'O(n)', variant: 'medium' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export default LinkedListPage;
