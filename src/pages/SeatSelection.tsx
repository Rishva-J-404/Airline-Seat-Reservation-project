import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Armchair,
  Plane,
  SlidersHorizontal,
  ArrowRight,
  ArrowLeft,
  Clock,
  MapPin,
  Info,
  Check,
  AlertCircle,
  UserPlus,
  List,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Seat, TicketRequest } from '../types';
import { generateSeats } from '../data/seats';
import { flightsAPI, reservationsAPI } from '../services/api';
import { SeatMap } from '../components/booking/SeatMap';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../utils/formatters';
import { generateRequestId } from '../utils/idGenerator';

export default function SeatSelection() {
  const navigate = useNavigate();
  const { state, dispatch, addLog } = useApp();
  const selectedFlight = state.selectedFlight;

  // Redirect if no flight is selected
  useEffect(() => {
    if (!selectedFlight) {
      navigate('/flights/search', { replace: true });
    }
  }, [selectedFlight, navigate]);

  // Initialize seats layout with fallback to generateSeats()
  const [seats, setSeats] = useState<Seat[]>(() => {
    if (selectedFlight?.flightNumber === 'AI-999' || (selectedFlight as any)?.availableSeats === 0) {
      return generateSeats().map((s, idx) => ({ ...s, dbId: idx + 1, status: 'occupied' as const }));
    }
    return generateSeats().map((s, idx) => ({ ...s, dbId: idx + 1 }));
  });

  const [waitingListSuccess, setWaitingListSuccess] = useState<string | null>(null);
  const [isJoiningWaitingList, setIsJoiningWaitingList] = useState(false);
  const [waitingListError, setWaitingListError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFlight) return;
    let isMounted = true;

    const flightId =
      (selectedFlight as any).id ||
      (selectedFlight.flightNumber === 'AI-201'
        ? 1
        : selectedFlight.flightNumber === '6E-402'
        ? 2
        : selectedFlight.flightNumber === 'SG-112'
        ? 3
        : selectedFlight.flightNumber === 'UK-305'
        ? 4
        : selectedFlight.flightNumber === 'AI-999'
        ? 6
        : 5);

    flightsAPI
      .getSeats(flightId)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.seats && res.seats.length > 0) {
          const mappedSeats: Seat[] = res.seats.map((s) => ({
            id: s.seatNumber,
            dbId: typeof s.id === 'number' ? s.id : Number(s.id),
            row: s.row,
            col: s.col as 'A' | 'B' | 'C' | 'D',
            type: s.type,
            hasExtraLegroom: s.hasExtraLegroom,
            isQuietZone: s.isQuietZone,
            isFrontRow: s.isFrontRow,
            status: s.status as any,
          }));
          setSeats(mappedSeats);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        if (selectedFlight.flightNumber === 'AI-999' || (selectedFlight as any).availableSeats === 0) {
          setSeats(generateSeats().map((s, idx) => ({ ...s, dbId: idx + 1, status: 'occupied' as const })));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFlight]);

  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(() => {
    if (state.selectedSeat) return state.selectedSeat;
    if (state.lastRecommendation) return state.lastRecommendation.seat;
    return null;
  });

  if (!selectedFlight) {
    return null;
  }

  const availableCount = seats.filter((s) => s.status === 'available').length;
  const isFlightFull = seats.length > 0 && availableCount === 0;

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'available') return;
    setSelectedSeat(seat);
  };

  const handleConfirmSeat = () => {
    if (!selectedSeat) return;

    dispatch({ type: 'SELECT_SEAT', payload: selectedSeat });
    addLog(
      'Seat Selected',
      `Seat ${selectedSeat.id} (${selectedSeat.type}) confirmed on flight ${selectedFlight.flightNumber}`,
      'ai'
    );

    navigate('/booking/confirm');
  };

  const handleGoToAIRecommendation = () => {
    navigate('/dsa/ai');
  };

  const handleJoinWaitingList = async () => {
    if (!selectedFlight) return;
    setIsJoiningWaitingList(true);
    setWaitingListError(null);

    const flightId =
      (selectedFlight as any).id ||
      (selectedFlight.flightNumber === 'AI-201'
        ? 1
        : selectedFlight.flightNumber === '6E-402'
        ? 2
        : selectedFlight.flightNumber === 'SG-112'
        ? 3
        : selectedFlight.flightNumber === 'UK-305'
        ? 4
        : selectedFlight.flightNumber === 'AI-999'
        ? 6
        : 5);

    const passengerName = state.user?.name || 'Traveler ' + Math.floor(100 + Math.random() * 900);
    const reqId = generateRequestId();

    try {
      const res = await reservationsAPI.joinWaitingList({
        flightId,
        passengerName,
        seatPreference: 'any',
      });

      const queuePos = res.waitingEntry?.queuePosition || state.queueSnapshot.length + 1;
      const newRequest: TicketRequest = {
        requestId: `WL-${res.waitingEntry?.id || reqId}`,
        passengerName,
        flightNumber: selectedFlight.flightNumber,
        requestType: 'waiting',
        timestamp: new Date(),
      };

      dispatch({ type: 'QUEUE_ENQUEUE', payload: newRequest });
      addLog(
        'Waiting List Intake (CO1 Queue)',
        `Flight ${selectedFlight.flightNumber} full. Enqueued ${passengerName} to backend FIFO waiting list. Position in Queue: #${queuePos}.`,
        'queue'
      );

      setWaitingListSuccess(
        `Successfully enqueued into the FIFO Waiting List! Your request ID is WL-${res.waitingEntry?.id || reqId}. You are at Queue Position #${queuePos}.`
      );
    } catch (err: any) {
      if (err?.code === 'ALREADY_WAITING') {
        setWaitingListError('You already have an active waiting list entry for this flight.');
      } else if (err?.code === 'FLIGHT_NOT_FULL') {
        setWaitingListError('Flight still has seats available. You can book an available seat directly.');
      } else if (err?.code === 'NETWORK_ERROR' || err?.statusCode === 0) {
        // Fallback for standalone/demo offline mode
        const newRequest: TicketRequest = {
          requestId: reqId,
          passengerName,
          flightNumber: selectedFlight.flightNumber,
          requestType: 'waiting',
          timestamp: new Date(),
        };

        dispatch({ type: 'QUEUE_ENQUEUE', payload: newRequest });
        addLog(
          'Waiting List Intake (CO1 Queue - Standalone)',
          `Flight ${selectedFlight.flightNumber} full. Enqueued ${passengerName} to local FIFO waiting list (Request ${reqId}). Position in Queue: #${state.queueSnapshot.length + 1}.`,
          'queue'
        );

        setWaitingListSuccess(
          `Successfully enqueued into the FIFO Waiting List (Local Session)! Your request ID is ${reqId}. You are at Queue Position #${state.queueSnapshot.length + 1}.`
        );
      } else {
        setWaitingListError(err?.message || 'Unable to join waiting list. Please try again.');
      }
    } finally {
      setIsJoiningWaitingList(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      {/* Airline Booking Breadcrumb / Progress Steps */}
      <nav aria-label="Booking flow progress" className="mb-6">
        <ol className="flex items-center gap-2 text-xs font-mono text-slate-500 overflow-x-auto pb-1">
          <li className="flex items-center gap-1.5 text-slate-700">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px]">
              1
            </span>
            <span>Search</span>
            <span className="text-slate-300">/</span>
          </li>
          <li className="flex items-center gap-1.5 text-slate-700">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px]">
              2
            </span>
            <span>Select Flight</span>
            <span className="text-slate-300">/</span>
          </li>
          <li className="flex items-center gap-1.5 text-aero-950 font-bold" aria-current="step">
            <span className="w-5 h-5 rounded-full bg-aero-950 text-white flex items-center justify-center text-[10px]">
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
        title="Cabin Seat Selection"
        subtitle={`Flight ${selectedFlight.flightNumber} - ${selectedFlight.airline} (${selectedFlight.from} to ${selectedFlight.to})`}
        icon={<Armchair className="h-5 w-5" />}
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/flights/results')}
          >
            Change Flight
          </Button>
        }
      />

      {/* Full Flight Alert Banner (CO1 FIFO Waiting List) */}
      {isFlightFull && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Flight Full — All 80 Seats Occupied</span>
                <Badge variant="warning">CO1: FIFO Waiting Queue</Badge>
              </div>
              <p className="text-xs text-amber-800 mt-1">
                No direct seats are currently open. Join the FIFO waiting queue — when an existing passenger cancels,
                the first eligible waiting passenger is automatically allocated the released seat.
              </p>
              {waitingListError && (
                <p className="text-xs text-rose-700 font-semibold mt-2">{waitingListError}</p>
              )}
            </div>
          </div>
          <Button
            variant="accent"
            size="md"
            loading={isJoiningWaitingList}
            icon={<UserPlus size={16} />}
            onClick={handleJoinWaitingList}
            className="shrink-0"
          >
            Join FIFO Waiting List
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Aircraft Fuselage Map & Zone Specs */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  Cabin Layout (Airbus A320neo)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Single Aisle &bull; 4-Across Configuration &bull; {availableCount} Available
              </span>
            </div>

            <div className="py-2">
              <SeatMap
                seats={seats}
                onSeatSelect={handleSeatClick}
                selectedSeatId={selectedSeat?.id}
                recommendedSeatId={state.lastRecommendation?.seat.id}
              />
            </div>
          </Card>

          {/* Cabin Comfort Specifications */}
          <Card className="p-5 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-slate-600" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                Cabin Zone Specifications
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <p className="font-semibold text-slate-900">Window Seats (Columns A &amp; D)</p>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  Exterior cloud views with fixed sidewall headrest for restful travel.
                </p>
              </div>

              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <p className="font-semibold text-slate-900">Aisle Seats (Columns B &amp; C)</p>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  Direct central corridor access with unrestricted legroom along walkway.
                </p>
              </div>

              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <p className="font-semibold text-slate-900">Exit Row (Row 10)</p>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  34-inch extended seat pitch adjacent to overwing emergency exit doors.
                </p>
              </div>

              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <p className="font-semibold text-slate-900">Aft Quiet Zone (Rows 15 to 20)</p>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  Quiet aft section behind wing engines for minimal flight disruption.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Flight Summary & Allocation Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Flight Summary Panel */}
          <Card className="p-6 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  Flight Itinerary
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                {selectedFlight.aircraft || 'Airbus A320neo'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase font-mono tracking-wider font-semibold">Airline</span>
                <span className="font-bold text-slate-900">{selectedFlight.airline}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase font-mono tracking-wider font-semibold">Flight Number</span>
                <span className="font-mono font-bold text-aero-950">{selectedFlight.flightNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase font-mono tracking-wider font-semibold">Sector</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  {selectedFlight.from} &rarr; {selectedFlight.to}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase font-mono tracking-wider font-semibold">Departure / Arrival</span>
                <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  {selectedFlight.departure} &rarr; {selectedFlight.arrival} ({selectedFlight.duration})
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <span className="text-slate-500 uppercase font-mono tracking-wider font-semibold">Standard Airfare</span>
                <span className="text-base font-bold font-mono text-aero-950">
                  {formatCurrency(selectedFlight.price)}
                </span>
              </div>
            </div>
          </Card>

          {/* Selected Seat State Panel */}
          <Card className="p-6 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Armchair className="h-4 w-4 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  Selected Seat
                </h3>
              </div>
              {selectedSeat && (
                <Badge variant="success" size="sm" dot>
                  Confirmed
                </Badge>
              )}
            </div>

            {selectedSeat ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 block">
                      Designated Seat
                    </span>
                    <span className="text-3xl font-mono font-extrabold text-aero-950">
                      {selectedSeat.id}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block font-semibold">
                      Cabin Type
                    </span>
                    <span className="capitalize font-bold text-slate-900 text-sm">
                      {selectedSeat.type} Seat
                    </span>
                  </div>
                </div>

                {/* Seat Attributes */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Row {selectedSeat.row}
                  </span>
                  {selectedSeat.hasExtraLegroom && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                      Extra Legroom
                    </span>
                  )}
                  {selectedSeat.isQuietZone && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-medium">
                      Quiet Zone
                    </span>
                  )}
                  {selectedSeat.isFrontRow && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-medium">
                      Front Row
                    </span>
                  )}
                </div>

                {/* Recommendation Match Banner */}
                {state.lastRecommendation?.seat.id === selectedSeat.id && (
                  <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">Preference Allocation Match</p>
                      <p className="text-emerald-700 mt-0.5">
                        This seat satisfies your scoring criteria for cabin comfort.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : isFlightFull ? (
              <div className="p-6 text-center rounded bg-amber-50 border border-amber-200">
                <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-amber-900">Flight is 100% Occupied</p>
                <p className="text-[11px] text-amber-700 mt-1 max-w-xs mx-auto">
                  Click below to join the FIFO Waiting Queue. You will be placed at the rear of the queue and automatically notified upon seat vacancy.
                </p>
                <div className="mt-4">
                  <Button
                    variant="accent"
                    size="sm"
                    loading={isJoiningWaitingList}
                    icon={<UserPlus size={14} />}
                    onClick={handleJoinWaitingList}
                  >
                    Join Waiting List (CO1)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded bg-slate-50 border border-dashed border-slate-300">
                <Armchair className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Seat Selected</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  Click any available white seat from the aircraft cabin map on the left.
                </p>
              </div>
            )}

            {/* Action Controls */}
            <div className="mt-6 space-y-3 pt-4 border-t border-slate-200">
              {!isFlightFull && (
                <>
                  <Button
                    variant="secondary"
                    fullWidth
                    size="md"
                    icon={<SlidersHorizontal className="h-4 w-4" />}
                    onClick={handleGoToAIRecommendation}
                  >
                    Seat Matcher Preferences
                  </Button>

                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    disabled={!selectedSeat}
                    icon={<ArrowRight className="h-4 w-4" />}
                    onClick={handleConfirmSeat}
                  >
                    Continue to Passenger Details
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Waiting List Confirmation Modal */}
      <Modal
        isOpen={Boolean(waitingListSuccess)}
        onClose={() => setWaitingListSuccess(null)}
        title="Enqueued to Waiting List (CO1 FIFO Queue)"
        size="md"
      >
        <div className="space-y-4 pt-2 text-xs font-sans">
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
            <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>{waitingListSuccess}</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-slate-700">
            <div className="flex justify-between font-mono">
              <span className="text-slate-500">Flight Number:</span>
              <span className="font-bold">{selectedFlight.flightNumber}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-500">Queue Data Structure:</span>
              <span className="font-bold text-aero-950">Queue (CO1 FIFO)</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-500">Auto-Promotion Trigger:</span>
              <span className="font-bold text-emerald-700">Seat Cancellation Event</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="primary"
              fullWidth
              size="md"
              icon={<List size={16} />}
              onClick={() => {
                setWaitingListSuccess(null);
                navigate('/dsa/queue');
              }}
            >
              View Live Ticket Queue
            </Button>
            <Button
              variant="secondary"
              fullWidth
              size="md"
              onClick={() => {
                setWaitingListSuccess(null);
                navigate('/flights/search');
              }}
            >
              Search Other Sectors
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
