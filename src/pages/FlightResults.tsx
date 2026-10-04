import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownUp,
  Plane,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Flight, TicketRequest } from '../types';
import { selectionSort } from '../algorithms/SelectionSort';
import { generateRequestId } from '../utils/idGenerator';
import { PageHeader } from '../components/common/PageHeader';
import { FlightCard } from '../components/booking/FlightCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { MOCK_FLIGHTS } from '../data/flights';

export default function FlightResults() {
  const navigate = useNavigate();
  const { state, dispatch, addLog } = useApp();

  // Local list of flights initialized from state or mock
  const [flights, setFlights] = useState<Flight[]>(() => {
    if (state.searchedFlights && state.searchedFlights.length > 0) {
      return state.searchedFlights;
    }
    return MOCK_FLIGHTS;
  });

  const [isSorted, setIsSorted] = useState<boolean>(false);

  // Sync when state.searchedFlights updates using recommended React render-time sync
  const [prevSearched, setPrevSearched] = useState(state.searchedFlights);
  if (state.searchedFlights !== prevSearched) {
    setPrevSearched(state.searchedFlights);
    setFlights(state.searchedFlights && state.searchedFlights.length > 0 ? state.searchedFlights : MOCK_FLIGHTS);
    setIsSorted(false);
  }

  const handleSortByPrice = () => {
    const prices = flights.map((f) => f.price);
    const result = selectionSort(prices);

    // Apply selection sort to reorder flights array
    const sortedFlights = [...flights];
    const n = sortedFlights.length;
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        if (sortedFlights[j].price < sortedFlights[minIdx].price) {
          minIdx = j;
        }
      }
      if (minIdx !== i) {
        const temp = sortedFlights[i];
        sortedFlights[i] = sortedFlights[minIdx];
        sortedFlights[minIdx] = temp;
      }
    }

    setFlights(sortedFlights);
    setIsSorted(true);

    dispatch({ type: 'INCREMENT_SORT' });
    addLog(
      'Selection Sort',
      `Sorted ${flights.length} flights by price with ${result.comparisons} comparisons and ${result.swaps} swaps`,
      'sort'
    );
  };

  const handleResetSort = () => {
    if (state.searchedFlights && state.searchedFlights.length > 0) {
      setFlights(state.searchedFlights);
    } else {
      setFlights(MOCK_FLIGHTS);
    }
    setIsSorted(false);
  };

  const handleFlightSelect = (flight: Flight) => {
    dispatch({ type: 'SELECT_FLIGHT', payload: flight });

    const ticketReq: TicketRequest = {
      requestId: generateRequestId(),
      passengerName: state.user?.name || 'Guest Passenger',
      flightNumber: flight.flightNumber,
      requestType: 'booking',
      timestamp: new Date(),
    };

    dispatch({ type: 'QUEUE_ENQUEUE', payload: ticketReq });
    addLog(
      'Queue Enqueue',
      `Enqueued ticket request ${ticketReq.requestId} for passenger ${ticketReq.passengerName} (Flight ${flight.flightNumber})`,
      'queue'
    );

    navigate(`/flights/${flight.flightNumber}/seats`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-sans space-y-6">
      {/* Airline Booking Breadcrumb / Progress Steps */}
      <nav aria-label="Booking flow progress">
        <ol className="flex items-center gap-2 text-xs font-mono text-slate-500 overflow-x-auto pb-1">
          <li className="flex items-center gap-1.5 text-slate-700">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px]">
              1
            </span>
            <span>Search Flights</span>
            <span className="text-slate-300">/</span>
          </li>
          <li className="flex items-center gap-1.5 text-aero-950 font-bold" aria-current="step">
            <span className="w-5 h-5 rounded-full bg-aero-950 text-white flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Select Flight</span>
            <span className="text-slate-300">/</span>
          </li>
          <li className="flex items-center gap-1.5 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Seat Allocation</span>
            <span className="text-slate-300">/</span>
          </li>
          <li className="flex items-center gap-1.5 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px]">
              4
            </span>
            <span>Passenger Details</span>
            <span className="text-slate-300">/</span>
          </li>
          <li className="flex items-center gap-1.5 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px]">
              5
            </span>
            <span>Boarding Pass</span>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <PageHeader
        title="Available Flight Schedules"
        subtitle={
          flights.length > 0
            ? `Displaying ${flights.length} scheduled flight${flights.length !== 1 ? 's' : ''} on this sector`
            : 'No direct scheduled flights found for this route'
        }
        icon={<Plane className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Search className="h-4 w-4" />}
              onClick={() => navigate('/flights/search')}
            >
              Modify Search
            </Button>
          </div>
        }
      />

      {/* Flight Sort / Filter Bar */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block">
            Filter &amp; Sort Options
          </span>
          <p className="text-xs text-slate-600 mt-0.5">
            {isSorted
              ? 'Showing flights sorted by lowest fare first'
              : 'Showing all scheduled flights in default departure order'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isSorted ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowDownUp className="h-4 w-4" />}
              onClick={handleSortByPrice}
            >
              Price: Lowest First
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              onClick={handleResetSort}
            >
              Reset to Default Order
            </Button>
          )}
        </div>
      </div>

      {/* Flight Card Listing */}
      {flights.length === 0 ? (
        <Card className="p-12 text-center border border-slate-200 rounded-lg">
          <Plane className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 font-display">No Flights Scheduled</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            We couldn't find any direct scheduled flights for your selected sector and date.
          </p>
          <div className="mt-5">
            <Button
              variant="primary"
              size="md"
              icon={<Search className="h-4 w-4" />}
              onClick={() => navigate('/flights/search')}
            >
              Search Different Routes
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {flights.map((flight, idx) => (
            <FlightCard
              key={`${flight.flightNumber}-${idx}`}
              flight={flight}
              onSelect={handleFlightSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
