// pages/DSADashboard.tsx
// Flight Operations & Algorithmic Dispatch Center: orchestrates state + handlers, renders tabs via sub-components.

import { useState, useEffect } from 'react';
import {
  List, Network, GitBranch, ArrowDownUp, Cpu, Activity, ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { AlgorithmLog } from '../components/common/AlgorithmLog';
import { selectionSort } from '../algorithms/SelectionSort';
import type { SortResult } from '../algorithms/SelectionSort';
import { recommendSeat } from '../services/seatRecommendation';
import { DEFAULT_SEATS } from '../data/seats';
import { generateRequestId, generatePassengerId, generateBookingId } from '../utils/idGenerator';
import type { TicketRequest, Passenger, SeatPreferences, RecommendationResult } from '../types';

// Tab sub-components
import { QueueTab }       from '../components/dashboard/QueueTab';
import { LinkedListTab }  from '../components/dashboard/LinkedListTab';
import { SortTab }        from '../components/dashboard/SortTab';
import { BSTTab }         from '../components/dashboard/BSTTab';
import { AITab }          from '../components/dashboard/AITab';

type DashboardTab = 'queue' | 'll' | 'sort' | 'bst' | 'ai';

const DEFAULT_SORT_NUMS = '5500, 3200, 4800, 2500, 6200';

function parseNumbers(input: string): number[] | null {
  const parts = input.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const nums: number[] = [];
  for (const p of parts) {
    const n = parseInt(p, 10);
    if (isNaN(n) || n < 0) return null;
    nums.push(n);
  }
  return nums;
}

const TABS: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
  { id: 'queue', label: 'Ticket Queue (CO1)',       icon: <List size={16} /> },
  { id: 'll',    label: 'Passenger Manifest (CO2)', icon: <Network size={16} /> },
  { id: 'sort',  label: 'Fare Sorter (CO3)',        icon: <ArrowDownUp size={16} /> },
  { id: 'bst',   label: 'BST Index (CO3)',          icon: <GitBranch size={16} /> },
  { id: 'ai',    label: 'Seat Matcher',             icon: <Cpu size={16} /> },
];

export default function DSADashboard() {
  const { state, dispatch, addLog, bst } = useApp();

  const [activeTab, setActiveTab] = useState<DashboardTab>('queue');

  // ---------- Queue State ----------
  const [qName, setQName]       = useState('Priya Sharma');
  const [qFlight, setQFlight]   = useState('AI-201');
  const [qType, setQType]       = useState<'booking' | 'cancellation' | 'upgrade'>('booking');

  // ---------- Linked List State ----------
  const [llName, setLlName]           = useState('Vikramaditya Rao');
  const [llFlight, setLlFlight]       = useState('AI-201');
  const [llSeat, setLlSeat]           = useState('14D');
  const [llFare, setLlFare]           = useState(3800);
  const [llSearchId, setLlSearchId]   = useState('');
  const [llDeleteId, setLlDeleteId]   = useState('');
  const [llHighlight, setLlHighlight] = useState<string | undefined>(undefined);

  // ---------- Sort State ----------
  const [sortInput, setSortInput]     = useState(DEFAULT_SORT_NUMS);
  const [sortResult, setSortResult]   = useState<SortResult>(() => selectionSort([5500, 3200, 4800, 2500, 6200]));
  const [sortStep, setSortStep]       = useState(0);
  const [sortPlaying, setSortPlaying] = useState(false);
  const [sortError, setSortError]     = useState<string | null>(null);

  // ---------- BST State ----------
  const [bstSearchKey,    setBstSearchKey]    = useState('1002');
  const [bstInsertKey,    setBstInsertKey]    = useState('1006');
  const [bstSearchResult, setBstSearchResult] = useState<{ found: boolean; path: number[]; comparisons: number } | null>(null);
  const [bstSearchPath,   setBstSearchPath]   = useState<number[]>([]);
  const [bstHighlight,    setBstHighlight]    = useState<number | null>(null);

  // ---------- AI State ----------
  const [localPrefs, setLocalPrefs]               = useState<SeatPreferences>(state.preferences);
  const [recommendation, setRecommendation]       = useState<RecommendationResult | null>(null);

  // Auto-play sort timer
  useEffect(() => {
    if (!sortPlaying || sortResult.steps.length === 0) return;
    if (sortStep >= sortResult.steps.length - 1) {
      const stopTimer = setTimeout(() => setSortPlaying(false), 0);
      return () => clearTimeout(stopTimer);
    }
    const t = setTimeout(() => setSortStep(p => p + 1), 800);
    return () => clearTimeout(t);
  }, [sortPlaying, sortStep, sortResult]);

  // ============================================================
  // Queue handlers
  // ============================================================
  const handleEnqueue = () => {
    if (!qName.trim()) return;
    const req: TicketRequest = { requestId: generateRequestId(), passengerName: qName.trim(), flightNumber: qFlight, requestType: qType, timestamp: new Date() };
    dispatch({ type: 'QUEUE_ENQUEUE', payload: req });
    addLog('Queue Enqueue', `Enqueued ${req.requestId}: ${req.passengerName} (${req.requestType}) on ${req.flightNumber}`, 'queue');
  };
  const handleDequeue = () => {
    const front = state.queueSnapshot[0];
    if (!front) return;
    dispatch({ type: 'QUEUE_DEQUEUE' });
    addLog('Queue Dequeue', `Dequeued ${front.requestId}: ${front.passengerName} from front`, 'queue');
  };
  const handleClearQueue = () => { dispatch({ type: 'QUEUE_CLEAR' }); addLog('Queue Clear', 'Cleared all pending ticket requests', 'queue'); };
  const handleSeedQueue = () => {
    const samples: Omit<TicketRequest, 'requestId' | 'timestamp'>[] = [
      { passengerName: 'Aarav Patel',  flightNumber: '6E-402', requestType: 'booking' },
      { passengerName: 'Diya Menon',   flightNumber: 'SG-112', requestType: 'cancellation' },
      { passengerName: 'Karthik Nair', flightNumber: 'UK-305', requestType: 'upgrade' },
    ];
    samples.forEach(s => dispatch({ type: 'QUEUE_ENQUEUE', payload: { requestId: generateRequestId(), timestamp: new Date(), ...s } }));
    addLog('Queue Seed', 'Enqueued 3 demonstration ticket requests', 'queue');
  };

  // ============================================================
  // Linked List handlers
  // ============================================================
  const handleLLInsert = () => {
    if (!llName.trim()) return;
    const p: Passenger = { passengerId: generatePassengerId(), passengerName: llName.trim(), bookingId: generateBookingId(), flightNumber: llFlight, seatNumber: llSeat, fare: llFare };
    dispatch({ type: 'LL_INSERT', payload: p });
    addLog('Linked List Insert', `Appended node ${p.passengerId} (${p.passengerName}) to tail`, 'linkedlist');
  };
  const handleLLSearch = () => {
    if (!llSearchId.trim()) { setLlHighlight(undefined); return; }
    const target = llSearchId.trim().toUpperCase();
    const found = state.linkedListSnapshot.find(p => p.passengerId.toUpperCase() === target || p.bookingId.toUpperCase() === target);
    setLlHighlight(found?.passengerId);
    addLog('Linked List Search', found ? `Found ${found.passengerName} (${found.passengerId})` : `${target} not found - traversed all nodes to NULL`, 'linkedlist');
  };
  const handleLLDelete = () => {
    if (!llDeleteId.trim()) return;
    const target = llDeleteId.trim().toUpperCase();
    dispatch({ type: 'LL_DELETE', payload: target });
    if (llHighlight === target) setLlHighlight(undefined);
    addLog('Linked List Delete', `Deleted node ${target} by updating pointer links`, 'linkedlist');
  };
  const handleLLClear = () => { dispatch({ type: 'LL_CLEAR' }); setLlHighlight(undefined); addLog('Linked List Clear', 'Reset head pointer to NULL', 'linkedlist'); };

  // ============================================================
  // Sort handlers
  // ============================================================
  const handleRunSort = () => {
    const nums = parseNumbers(sortInput);
    if (!nums) { setSortError('Enter at least 2 valid non-negative numbers.'); return; }
    setSortError(null);
    const result = selectionSort(nums);
    setSortResult(result);
    setSortStep(0);
    setSortPlaying(true);
    dispatch({ type: 'INCREMENT_SORT' });
    addLog('Selection Sort', `Sorted [${nums.join(', ')}] - ${result.comparisons} comparisons, ${result.swaps} swaps`, 'sort');
  };
  const handleSortTogglePlay = () => {
    if (sortStep >= sortResult.steps.length - 1) { setSortStep(0); setSortPlaying(true); }
    else { setSortPlaying(p => !p); }
  };

  // ============================================================
  // BST handlers
  // ============================================================
  const handleBSTSearch = () => {
    const key = parseInt(bstSearchKey.trim(), 10);
    if (isNaN(key)) return;
    const res = bst.search(key);
    setBstSearchResult(res);
    setBstSearchPath(res.path);
    setBstHighlight(res.found ? key : null);
    addLog('BST Search', `Key ${key}: ${res.found ? 'FOUND' : 'NOT FOUND'}, ${res.comparisons} comparisons, path [${res.path.join(' -> ')}]`, 'bst');
  };
  const handleBSTInsert = () => {
    const key = parseInt(bstInsertKey.trim(), 10);
    if (isNaN(key)) return;
    dispatch({ type: 'BST_INSERT', payload: key });
    setBstInsertKey(String(key + 1));
    addLog('BST Insert', `Inserted key ${key} into BST index`, 'bst');
  };
  const handleBSTClear = () => { dispatch({ type: 'BST_CLEAR' }); setBstSearchResult(null); setBstSearchPath([]); setBstHighlight(null); addLog('BST Clear', 'Cleared all keys (root = NULL)', 'bst'); };

  // ============================================================
  // AI handlers
  // ============================================================
  const handleTogglePref = (key: keyof SeatPreferences) => {
    const updated = { ...localPrefs, [key]: !localPrefs[key] };
    setLocalPrefs(updated);
    dispatch({ type: 'SET_PREFERENCES', payload: updated });
  };
  const handleRunAI = () => {
    const result = recommendSeat(localPrefs, DEFAULT_SEATS);
    if (!result) return;
    setRecommendation(result);
    dispatch({ type: 'SET_RECOMMENDATION', payload: { seat: result.seat, reasons: result.reasons } });
    dispatch({ type: 'INCREMENT_AI' });
    addLog('AI Seat Recommender', `Evaluated 80 seats. Best match: Seat ${result.seat.id} (Score: ${Math.round(result.score)}/100)`, 'ai');
  };

  // ============================================================
  // Render
  // ============================================================
  const { dsaStats, queueSnapshot, linkedListSnapshot, bstSnapshot, algorithmLog } = state;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      <PageHeader
        title="Flight Operations & Algorithmic Dispatch Center"
        subtitle="Verification and live interaction console for commercial aviation core data structures"
        icon={<Activity size={20} />}
        action={<Badge variant="default" size="md">CO1 - CO3 Standards</Badge>}
      />

      {/* Unified Telemetry Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-left">
          {[
            { tab: 'queue' as DashboardTab, label: 'Ticket Queue', value: dsaStats.queueRequests, sub: `${queueSnapshot.length} in buffer`, invariant: 'O(1) FIFO' },
            { tab: 'll'    as DashboardTab, label: 'Passenger Manifest', value: linkedListSnapshot.length, sub: `${dsaStats.passengerRecords} total nodes`, invariant: 'O(1) Insert' },
            { tab: 'bst'   as DashboardTab, label: 'BST PNR Index', value: bstSnapshot.length, sub: `${dsaStats.bstNodes} tree nodes`, invariant: 'O(log n) Lookup' },
            { tab: 'sort'  as DashboardTab, label: 'Fare Sorter', value: dsaStats.flightsSorted, sub: 'In-place passes', invariant: 'O(n^2) Space O(1)' },
            { tab: 'ai'    as DashboardTab, label: 'Seat Allocation', value: dsaStats.aiRecommendations, sub: 'Constraint evaluations', invariant: 'Heuristic Scoring' },
          ].map(mod => {
            const isActive = activeTab === mod.tab;
            return (
              <button
                key={mod.tab}
                type="button"
                onClick={() => setActiveTab(mod.tab)}
                aria-pressed={isActive}
                className={[
                  'p-3.5 transition-colors text-left focus:outline-none',
                  isActive ? 'bg-slate-50' : 'hover:bg-slate-50/50',
                ].join(' ')}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={[
                    'uppercase tracking-wider font-semibold',
                    isActive ? 'text-slate-900 font-bold' : 'text-slate-500',
                  ].join(' ')}>
                    {mod.label}
                  </span>
                  <span className="text-[10px] text-slate-400">{mod.invariant}</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {mod.value}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{mod.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabbed Demo Area */}
      <Card padding={false} className="overflow-hidden border border-slate-200 rounded-lg">
        {/* Tab navigation */}
        <nav aria-label="Flight operations tabs" className="flex border-b border-slate-200 overflow-x-auto bg-slate-50">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`tab-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'px-5 py-3 text-xs font-bold font-mono flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-slate-900 text-slate-900 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100',
                ].join(' ')}
              >
                <span aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab panels */}
        <div className="p-6">
          <div id="tab-panel-queue" role="tabpanel" aria-label="Queue demo" hidden={activeTab !== 'queue'}>
            {activeTab === 'queue' && (
              <QueueTab
                items={queueSnapshot}
                passengerName={qName} flightNumber={qFlight} requestType={qType}
                onPassengerNameChange={setQName} onFlightNumberChange={setQFlight} onRequestTypeChange={setQType}
                onEnqueue={handleEnqueue} onDequeue={handleDequeue} onClear={handleClearQueue} onSeedSamples={handleSeedQueue}
              />
            )}
          </div>

          <div id="tab-panel-ll" role="tabpanel" aria-label="Linked List demo" hidden={activeTab !== 'll'}>
            {activeTab === 'll' && (
              <LinkedListTab
                items={linkedListSnapshot}
                highlightId={llHighlight}
                name={llName} flight={llFlight} seat={llSeat} fare={llFare}
                searchId={llSearchId} deleteId={llDeleteId}
                onNameChange={setLlName} onFlightChange={setLlFlight} onSeatChange={setLlSeat} onFareChange={setLlFare}
                onSearchIdChange={setLlSearchId} onDeleteIdChange={setLlDeleteId}
                onInsert={handleLLInsert} onSearch={handleLLSearch} onDelete={handleLLDelete}
                onClear={handleLLClear} onResetHighlight={() => setLlHighlight(undefined)}
              />
            )}
          </div>

          <div id="tab-panel-sort" role="tabpanel" aria-label="Selection Sort demo" hidden={activeTab !== 'sort'}>
            {activeTab === 'sort' && (
              <SortTab
                sortInput={sortInput} sortResult={sortResult} currentStep={sortStep}
                isPlaying={sortPlaying} sortError={sortError}
                onInputChange={setSortInput} onRunSort={handleRunSort}
                onPrev={() => setSortStep(p => Math.max(0, p - 1))}
                onNext={() => setSortStep(p => Math.min(sortResult.steps.length - 1, p + 1))}
                onTogglePlay={handleSortTogglePlay}
                onReset={() => { setSortPlaying(false); setSortStep(0); }}
              />
            )}
          </div>

          <div id="tab-panel-bst" role="tabpanel" aria-label="BST demo" hidden={activeTab !== 'bst'}>
            {activeTab === 'bst' && (
              <BSTTab
                bst={bst} bstSnapshot={bstSnapshot}
                searchKey={bstSearchKey} insertKey={bstInsertKey}
                searchResult={bstSearchResult} searchPath={bstSearchPath} highlightNode={bstHighlight}
                onSearchKeyChange={setBstSearchKey} onInsertKeyChange={setBstInsertKey}
                onSearch={handleBSTSearch} onInsert={handleBSTInsert} onClear={handleBSTClear}
              />
            )}
          </div>

          <div id="tab-panel-ai" role="tabpanel" aria-label="AI Recommendation demo" hidden={activeTab !== 'ai'}>
            {activeTab === 'ai' && (
              <AITab
                preferences={localPrefs}
                recommendation={recommendation}
                onTogglePref={handleTogglePref}
                onRunAI={handleRunAI}
              />
            )}
          </div>
        </div>
      </Card>

      {/* CO Architectural Invariants */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-slate-700" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-900 font-display">
            Aviation System Specifications &amp; Course Outcome Mappings
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'CO1 · Queue ADT',        title: 'FIFO Request Pipeline',      desc: 'Ingests reservations and cancellations in strict chronological sequence.', left: 'Enqueue: O(1)', right: 'Dequeue: O(1)' },
            { label: 'CO2 · Linked List',      title: 'Passenger Manifest',         desc: 'Pointer-linked dynamic roster eliminates array pre-allocation penalties.', left: 'Insert: O(1)',  right: 'Search: O(n)' },
            { label: 'CO3 · Selection Sort',   title: 'In-Place Fare Sorter',       desc: 'Sorts prices in-place with minimal memory consumption.',                 left: 'Time: O(n^2)',  right: 'Aux Space: O(1)' },
            { label: 'CO3 · BST Index',        title: 'Hierarchical Key Index',     desc: 'Organizes booking reference keys for efficient search and in-order dump.', left: 'Search: O(log n)', right: 'In-order: O(n)' },
          ].map(co => (
            <Card key={co.label} className="border border-slate-200 rounded-lg p-5 bg-white">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">{co.label}</span>
              <h4 className="font-bold text-sm text-slate-900 mb-1">{co.title}</h4>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">{co.desc}</p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-mono text-slate-700 font-semibold">
                <span>{co.left}</span>
                <span>{co.right}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Algorithm Activity Log */}
      <Card className="border border-slate-200 rounded-lg">
        <CardHeader
          title="Operations Activity Telemetry Log"
          subtitle="Real-time operational stream of all algorithmic executions"
          icon={<Activity size={18} />}
          accentColor="text-slate-800"
          action={<Badge variant="default" size="sm">{algorithmLog?.length ?? 0} Recorded</Badge>}
        />
        <AlgorithmLog />
      </Card>
    </div>
  );
}
