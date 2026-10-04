import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlaneTakeoff,
  Ticket,
  Search,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../utils/formatters';
import { isUserBooking } from '../utils/userFilter';
import type { Booking } from '../types';

export const UserDashboard: React.FC = () => {
  const { state, dispatch, addLog } = useApp();
  const navigate = useNavigate();

  // Redirect to /login if no user
  useEffect(() => {
    if (!state.user) {
      navigate('/login', { replace: true });
    }
  }, [state.user, navigate]);

  if (!state.user) {
    return null;
  }

  // Filter bookings strictly for the authenticated passenger
  const userBookings: Booking[] = state.bookings.filter((b) => isUserBooking(b, state.user));
  const activeBookings: Booking[] = userBookings.filter((b) => b.status === 'confirmed');
  const nextFlight: Booking | undefined = activeBookings[0];
  const recentBookings: Booking[] = userBookings.slice(0, 5);

  const handleCancelBooking = (bookingId: string) => {
    dispatch({ type: 'CANCEL_BOOKING', payload: bookingId });
    addLog('Cancel Booking', `Booking ${bookingId} marked as cancelled in BST index and manifest`, 'queue');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase font-semibold">
              Passenger Operations Console
            </span>
            <span className="text-xs text-slate-400 font-mono">PNR Account: {state.user.id || 'FLY-8821'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-aero-950 font-display">
            Welcome back, {state.user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Review your active flight itineraries and monitor algorithmic airline operations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/bookings')}
            icon={<Ticket className="h-4 w-4" />}
          >
            My Reservations
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/flights/search')}
            icon={<Search className="h-4 w-4" />}
          >
            Book Flights
          </Button>
        </div>
      </div>

      {/* Hero: Next Upcoming Flight Card OR Booking Teaser */}
      {nextFlight ? (
        <Card className="border border-slate-300 rounded-lg p-6 bg-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-200 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-aero-950 text-white flex items-center justify-center">
                <PlaneTakeoff className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                  Next Scheduled Journey
                </span>
                <span className="text-base font-bold text-slate-900 font-display">
                  {nextFlight.flight.airline} · Flight {nextFlight.flight.flightNumber}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">
                PNR: {nextFlight.bookingId}
              </span>
              <Badge variant="success" size="sm" dot>
                Confirmed
              </Badge>
            </div>
          </div>

          {/* Timeline Route Display */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Origin */}
            <div className="md:col-span-3 text-left">
              <span className="text-3xl font-extrabold font-mono text-aero-950 block">
                {nextFlight.flight.departure || '08:30'}
              </span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">
                {nextFlight.flight.from}
              </span>
              <span className="text-xs font-mono text-slate-500 block">
                Terminal 2 · Departure
              </span>
            </div>

            {/* Flight Vector */}
            <div className="md:col-span-4 flex flex-col items-center justify-center px-4">
              <div className="flex items-center gap-1 text-slate-500 font-mono text-xs">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{nextFlight.flight.duration} (Non-stop)</span>
              </div>
              <div className="my-2 flex w-full max-w-[180px] items-center gap-1.5">
                <div className="h-px flex-1 bg-slate-300" />
                <PlaneTakeoff className="h-4 w-4 text-slate-600 shrink-0" />
                <div className="h-px flex-1 bg-slate-300" />
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Aircraft: {nextFlight.flight.aircraft || 'Airbus A320neo'}
              </span>
            </div>

            {/* Destination */}
            <div className="md:col-span-3 text-left md:text-right">
              <span className="text-3xl font-extrabold font-mono text-aero-950 block">
                {nextFlight.flight.arrival || '10:45'}
              </span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">
                {nextFlight.flight.to}
              </span>
              <span className="text-xs font-mono text-slate-500 block">
                Terminal 1 · Arrival
              </span>
            </div>

            {/* Action */}
            <div className="md:col-span-2 flex flex-col gap-2 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6">
              <div className="text-left md:text-right">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">Seat</span>
                <span className="text-xl font-mono font-black text-aero-950">{nextFlight.seat.id}</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                icon={<Ticket className="h-3.5 w-3.5" />}
                onClick={() => navigate('/bookings')}
              >
                Boarding Pass
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border border-slate-200 rounded-lg p-6 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <PlaneTakeoff className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Plan Your Next Domestic Flight</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Direct scheduled routes between Coimbatore, Chennai, Mumbai, Delhi, and Bangalore.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={<Search className="h-4 w-4" />}
              onClick={() => navigate('/flights/search')}
            >
              Search Available Routes
            </Button>
          </div>
        </Card>
      )}

      {/* Recent Reservations Table */}
      <Card className="border border-slate-200 rounded-lg p-6 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-200 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">Recent Flight Itineraries</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified passenger manifest bookings tracked in memory.
            </p>
          </div>
          <Link
            to="/bookings"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            <span>View All Bookings ({userBookings.length})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No flight reservations found. Use the Search Flights button above to book a ticket.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 font-mono text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">PNR / Ref</th>
                  <th className="py-2.5 px-3">Passenger</th>
                  <th className="py-2.5 px-3">Flight</th>
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-3">Seat</th>
                  <th className="py-2.5 px-3">Fare</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {recentBookings.map((b) => (
                  <tr key={b.bookingId} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-aero-950">{b.bookingId}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {b.passenger.passengerName || b.passenger.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{b.flight.flightNumber}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {b.flight.from} {'->'} {b.flight.to}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{b.seat.id}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      {formatCurrency(b.flight.price)}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={b.status === 'confirmed' ? 'success' : 'danger'} size="sm">
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {b.status === 'confirmed' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate('/bookings')}
                            className="px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(b.bookingId)}
                            className="px-2 py-1 rounded text-red-600 hover:bg-red-50 text-xs font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Travel Services & Fleet Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-display">FlySmart Commercial Passenger Portal</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Search scheduled domestic sectors, select preferred cabin seating, and access confirmed digital boarding passes.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/flights/search')}
            icon={<Search className="h-4 w-4" />}
          >
            Book Flights
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/bookings')}
            icon={<Ticket className="h-4 w-4" />}
          >
            View All Reservations
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
