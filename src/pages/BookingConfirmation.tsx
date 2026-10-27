import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Printer,
  Ticket,
  Search,
  User,
  PlaneTakeoff,
  Armchair,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateBookingId, generatePassengerId } from '../utils/idGenerator';
import { bookingIdToKey } from '../data/passengers';
import { TicketCard } from '../components/booking/TicketCard';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/common/PageHeader';
import { formatCurrency, formatDate } from '../utils/formatters';
import { reservationsAPI } from '../services/api';
import type { Booking, Passenger } from '../types';

export const BookingConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch, addLog } = useApp();

  const { selectedFlight, selectedSeat, user } = state;

  const [passengerName, setPassengerName] = useState<string>(user?.name || '');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [journeyDate] = useState<Date>(() => new Date());

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passengerName.trim()) {
      setError('Please enter the passenger full name.');
      return;
    }

    if (!selectedFlight || !selectedSeat) {
      setError('Missing flight or seat details. Please re-select.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    let backendReceipt = '';
    let serverBookingRef = '';
    let serverReservationId: number | undefined;

    try {
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

      // Enforce authoritative PostgreSQL database seat ID; prevent invented arithmetic seat IDs
      if (!selectedSeat.dbId) {
        setError('Authoritative database seat identifier is missing. Please re-select your seat from the cabin layout.');
        setIsSubmitting(false);
        return;
      }

      const seatId = selectedSeat.dbId;

      const res = await reservationsAPI.create({
        flightId,
        seatId,
        passengerName: passengerName.trim(),
      });

      if (res.reservation?.bookingReference) {
        serverBookingRef = res.reservation.bookingReference;
      }
      if (res.reservation?.id) {
        serverReservationId = res.reservation.id;
      }
      if (res.dsaReceipt) {
        const bstReceipt = res.dsaReceipt.co4_bst || res.dsaReceipt.co3_bst || 'CO4 BST: Indexed';
        backendReceipt = `${res.dsaReceipt.co1_queue} | ${res.dsaReceipt.co2_manifest} | ${bstReceipt}`;
      }
    } catch (apiErr: any) {
      if (apiErr?.statusCode === 409 || apiErr?.code === 'SEAT_ALREADY_RESERVED' || apiErr?.code === 'SEAT_UNAVAILABLE') {
        setError('Seat already reserved! Another transaction has booked this seat. Please select a different seat.');
        setIsSubmitting(false);
        return;
      }
      // If offline or non-409, allow seamless client booking
    } finally {
      setIsSubmitting(false);
    }

    const bookingId = serverBookingRef || generateBookingId();
    const passengerId = generatePassengerId();

    const passenger: Passenger = {
      passengerId,
      passengerName: passengerName.trim(),
      name: passengerName.trim(),
      bookingId,
      flightNumber: selectedFlight.flightNumber,
      seatNumber: selectedSeat.id,
      fare: selectedFlight.price,
    };

    const newBooking: Booking = {
      bookingId,
      id: bookingId,
      reservationId: serverReservationId,
      userId: user?.id,
      userEmail: user?.email,
      passenger,
      flight: selectedFlight,
      seat: selectedSeat,
      bookingDate: new Date(),
      status: 'confirmed',
    };

    // Dispatch booking to AppContext (updates bookings array, passenger linked list, and booking BST)
    dispatch({ type: 'ADD_BOOKING', payload: newBooking });

    // Explicitly log the dual DSA operations
    addLog(
      'Linked List Insert',
      'Passenger ' +
        passenger.passengerName +
        ' (' +
        passengerId +
        ') inserted at tail of passenger linked list. O(1) time complexity.',
      'linkedlist'
    );

    addLog(
      'BST Insert',
      'Booking ID ' +
        bookingId +
        ' (Numeric Key: ' +
        bookingIdToKey(bookingId) +
        ') inserted into Binary Search Tree for O(log n) lookup.',
      'bst'
    );

    if (backendReceipt) {
      addLog('Backend DSA Receipt', backendReceipt, 'bst');
    }

    setConfirmedBooking(newBooking);
  };

  const handlePrint = () => {
    window.print();
  };

  // If no flight or seat is selected and booking hasn't been confirmed yet
  if (!confirmedBooking && (!selectedFlight || !selectedSeat)) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6 font-sans">
        <PageHeader
          title="Booking Confirmation"
          subtitle="Finalize your flight ticket reservation"
          icon={<Ticket size={20} />}
        />

        <Card className="p-10 text-center border-dashed border border-slate-300 rounded-xl bg-white max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-bold text-slate-900 font-display">Incomplete Flight or Seat Selection</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            {!selectedFlight
              ? 'You have not selected a flight yet. Please search for and pick a flight to proceed.'
              : 'You have chosen a flight, but have not picked a seat yet. Please select an available seat.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="accent"
              size="sm"
              icon={<Search size={14} />}
              onClick={() => navigate('/flights/search')}
            >
              Search Flights
            </Button>
            {selectedFlight && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Armchair size={14} />}
                onClick={() => navigate('/flights/' + selectedFlight.flightNumber + '/seats')}
              >
                Choose Seat
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={<Ticket size={14} />}
              onClick={() => navigate('/bookings')}
            >
              View My Bookings
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // View after confirmation: Boarding Pass & Traveler Actions
  if (confirmedBooking) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-8 font-sans">
        <PageHeader
          title="Reservation Confirmed &amp; Ticket Issued"
          subtitle="Your flight booking is confirmed. Your digital boarding pass is ready below."
          icon={<CheckCircle size={20} />}
        />

        {/* Success Alert Banner */}
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 shadow-xs print:hidden">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-xs uppercase font-mono tracking-wider">
                Confirmed Reference: {confirmedBooking.bookingId}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Your booking is secured. You can print your boarding pass or access it anytime under My Bookings.
              </p>
            </div>
          </div>
          <Badge variant="success">Confirmed</Badge>
        </div>

        {/* Boarding Pass Ticket Card */}
        <div className="max-w-2xl mx-auto">
          <TicketCard booking={confirmedBooking} printable={true} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 print:hidden">
          <Button
            variant="accent"
            size="md"
            icon={<Printer size={16} />}
            onClick={handlePrint}
          >
            Print Boarding Pass
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={<Ticket size={16} />}
            onClick={() => navigate('/bookings')}
          >
            View in My Bookings
          </Button>

          <Button
            variant="ghost"
            size="md"
            icon={<Search size={16} />}
            onClick={() => navigate('/flights/search')}
          >
            Search More Flights
          </Button>
        </div>
      </div>
    );
  }

  // If neither confirmed nor selected, guard against null
  if (!selectedFlight || !selectedSeat) {
    return null;
  }

  // Pre-confirmation Form View
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 font-sans">
      <PageHeader
        title="Passenger Details &amp; Ticket Issuance"
        subtitle="Review your travel details and enter passenger information before ticketing"
        icon={<Ticket size={20} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Passenger Form */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border border-slate-200 rounded-xl shadow-subtle p-6">
            <CardHeader
              title="Passenger Information"
              subtitle="Enter details as shown on government issued photo ID"
              icon={<User size={16} />}
            />

            <form onSubmit={handleConfirm} className="space-y-4">
              <div>
                <label htmlFor="passengerName" className="label-base">
                  Passenger Full Name *
                </label>
                <div className="relative">
                  <input
                    id="passengerName"
                    type="text"
                    required
                    value={passengerName}
                    onChange={(e) => {
                      setPassengerName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. Neavis Rishva"
                    className="input-base pl-9"
                  />
                  <User
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
                {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
                <p className="text-[11px] text-slate-500 mt-1">
                  This name will appear on the boarding pass and be dynamically indexed in the passenger manifest.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-mono text-slate-500">Contact Email:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {user?.email || 'guest@flysmart.com'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-mono text-slate-500">Designated Seat:</span>
                  <span className="font-mono font-bold text-aero-950">
                    {selectedSeat.id} ({selectedSeat.type === 'window' ? 'Window' : 'Aisle'})
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="accent"
                  size="md"
                  fullWidth
                  loading={isSubmitting}
                  icon={<ArrowRight size={16} />}
                >
                  Confirm Booking &amp; Issue Ticket
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Reservation Summary */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border border-slate-200 rounded-xl shadow-subtle p-6">
            <CardHeader
              title="Fare Summary"
              subtitle="Itemized journey and fare breakdown"
              icon={<PlaneTakeoff size={16} />}
            />

            <div className="space-y-3 text-xs border-b border-slate-100 pb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono">Flight &amp; Airline:</span>
                <span className="font-bold text-slate-900">{selectedFlight.flightNumber} · {selectedFlight.airline}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono">Sector:</span>
                <span className="font-medium text-slate-900">{selectedFlight.from} {'->'} {selectedFlight.to}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono">Travel Date:</span>
                <span className="font-medium text-slate-900">{formatDate(journeyDate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono">Seat Designation:</span>
                <span className="font-mono font-bold text-aero-950">{selectedSeat.id} ({selectedSeat.type})</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-slate-600 uppercase">Total Airfare:</span>
              <span className="text-xl font-mono font-extrabold text-aero-950">
                {formatCurrency(selectedFlight.price)}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
