import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Search,
  RotateCcw,
  Eye,
  AlertTriangle,
  Plane,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { bookingIdToKey } from '../data/passengers';
import type { SearchResult } from '../algorithms/BST';
import { TicketCard } from '../components/booking/TicketCard';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/common/PageHeader';
import { formatCurrency, formatDate } from '../utils/formatters';
import { isUserBooking } from '../utils/userFilter';
import { reservationsAPI } from '../services/api';
import type { Booking } from '../types';

export const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch, addLog, bst } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchedKey, setSearchedKey] = useState<number | null>(null);
  const [searchedBooking, setSearchedBooking] = useState<Booking | null>(null);
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string>('');

  // Filter reservations strictly for the authenticated passenger
  const userBookings = state.bookings.filter((b) => isUserBooking(b, state.user));

  // Modal states
  const [viewTicketBooking, setViewTicketBooking] = useState<Booking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const clean = searchTerm.trim();
    if (!clean) {
      setSearchError('Please enter a booking ID (e.g. B1001 or 1001).');
      return;
    }

    const key = bookingIdToKey(clean);
    if (isNaN(key)) {
      setSearchError('Invalid booking ID format. Enter B1001 or numeric 1001.');
      return;
    }

    setSearchError('');
    const result = bst.search(key);
    setSearchResult(result);
    setSearchedKey(key);

    if (result.found) {
      const match = state.bookings.find(
        (b) => bookingIdToKey(b.bookingId) === key
      );
      setSearchedBooking(match || null);
      setHighlightedBookingId(match ? match.bookingId : null);
    } else {
      setSearchedBooking(null);
      setHighlightedBookingId(null);
    }

    addLog(
      'BST Search',
      'Searched BST for booking key ' +
        key +
        '. Found: ' +
        result.found +
        ', Comparisons: ' +
        result.comparisons +
        ', Traversal Path: ' +
        (result.path.length > 0 ? result.path.join(' -> ') : 'none') +
        '.',
      'bst'
    );
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResult(null);
    setSearchedKey(null);
    setSearchedBooking(null);
    setHighlightedBookingId(null);
    setSearchError('');
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;

    setIsCancelling(true);
    setCancelError(null);

    const bookingRef = cancellingBooking.bookingId;
    // Prefer authoritative PostgreSQL numeric reservation ID if known, else booking reference
    const cancelTarget = cancellingBooking.reservationId || bookingRef;

    try {
      const res = await reservationsAPI.cancel(cancelTarget);

      // Successfully cancelled on server; now update client state
      dispatch({ type: 'CANCEL_BOOKING', payload: bookingRef });

      if (res && (res as any).promotedPassenger) {
        addLog(
          'Waiting List Promotion (CO1 Queue)',
          `Seat ${cancellingBooking.seat.id} automatically reallocated to waiting passenger ${(res as any).promotedPassenger.passengerName} via FIFO queue.`,
          'queue'
        );
      }

      addLog(
        'Booking Cancellation',
        'Booking ' +
          bookingRef +
          ' marked as cancelled. Removed passenger record for ' +
          cancellingBooking.passenger.passengerName +
          ' from Linked List (O(n) search + O(1) unlinking). Seat released.',
        'linkedlist'
      );

      setCancellingBooking(null);
    } catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || err?.statusCode === 0) {
        // Standalone / offline demo fallback
        dispatch({ type: 'CANCEL_BOOKING', payload: bookingRef });
        addLog(
          'Booking Cancellation (Standalone)',
          'Booking ' +
            bookingRef +
            ' marked as cancelled locally (server unreachable).',
          'linkedlist'
        );
        setCancellingBooking(null);
      } else {
        setCancelError(err?.message || 'Failed to cancel reservation on server.');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Page Header */}
      <PageHeader
        title="Manage Flight Bookings"
        subtitle="View, manage, and download your confirmed flight bookings and e-tickets"
        icon={<Ticket size={20} />}
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<Plane size={15} />}
            onClick={() => navigate('/flights/search')}
          >
            Book New Flight
          </Button>
        }
      />

      {/* Booking Search Bar Section */}
      <Card className="border border-slate-200 rounded-xl shadow-subtle p-6">
        <CardHeader
          title="Find Your Booking"
          subtitle="Search reservations by booking reference or ticket ID (e.g. B1001)"
        />

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (searchError) setSearchError('');
              }}
              placeholder="Enter Booking ID (e.g. B1001, B1002 or 1001)"
              className="input-base pl-9"
            />
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="accent"
              size="md"
              icon={<Search size={15} />}
            >
              Search Booking
            </Button>
            {(searchResult || searchTerm) && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                icon={<RotateCcw size={14} />}
                onClick={handleClearSearch}
              >
                Clear
              </Button>
            )}
          </div>
        </form>

        {searchError && (
          <p className="text-xs text-rose-600 font-medium mt-2">{searchError}</p>
        )}

        {/* Search Result Feedback */}
        {searchResult && searchedKey !== null && (
          <div
            className={[
              'mt-4 p-4 rounded-lg border text-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
              searchResult.found
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900',
            ].join(' ')}
          >
            <div className="flex items-center gap-2">
              <Badge variant={searchResult.found ? 'success' : 'warning'}>
                {searchResult.found ? 'Booking Found' : 'Not Found'}
              </Badge>
              <span className="font-medium">
                {searchResult.found
                  ? `Reservation identified for booking reference ${searchTerm.toUpperCase()}. Record verified in airline BST index.`
                  : `No active reservation found matching reference "${searchTerm}". Please verify your ticket reference.`}
              </span>
            </div>
            {searchResult.found && (
              <div className="flex items-center gap-2">
                {searchedBooking && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setViewTicketBooking(searchedBooking)}
                  >
                    View E-Ticket
                  </Button>
                )}
                <span className="text-[11px] font-mono text-emerald-700 bg-white/70 px-2 py-0.5 rounded border border-emerald-200">
                  Verified
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Bookings Table / Empty State */}
      <Card padding={false} className="border border-slate-200 rounded-xl shadow-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">Reservation Roster</h3>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
              Total reservations: {userBookings.length}
            </p>
          </div>
          <Badge variant="info">
            {userBookings.filter((b) => b.status === 'confirmed').length} Active
          </Badge>
        </div>

        {userBookings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Ticket size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 font-display">No Bookings Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              You have not booked any flights yet. Query domestic schedules to create your first reservation.
            </p>
            <Button
              variant="accent"
              size="sm"
              icon={<Search size={14} />}
              onClick={() => navigate('/flights/search')}
            >
              Search Flights
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Passenger</th>
                  <th className="px-4 py-3">Flight ID</th>
                  <th className="px-4 py-3">Sector</th>
                  <th className="px-4 py-3">Seat</th>
                  <th className="px-4 py-3 text-right">Fare</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userBookings.map((booking) => {
                  const isHighlighted = highlightedBookingId === booking.bookingId;
                  const isCancelled = booking.status === 'cancelled';

                  return (
                    <tr
                      key={booking.bookingId}
                      className={[
                        'transition-colors',
                        isHighlighted
                          ? 'bg-amber-50 ring-2 ring-amber-400 font-medium'
                          : 'hover:bg-slate-50/80',
                        isCancelled ? 'opacity-50 bg-slate-50/50' : '',
                      ].join(' ')}
                    >
                      {/* Booking ID */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {booking.bookingId}
                          {isHighlighted && (
                            <Badge variant="warning" size="sm">BST Match</Badge>
                          )}
                        </span>
                      </td>

                      {/* Passenger */}
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {booking.passenger.passengerName || booking.passenger.name || 'Passenger'}
                      </td>

                      {/* Flight */}
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900">
                          {booking.flight.flightNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1.5 font-mono">
                          {booking.flight.airline}
                        </span>
                      </td>

                      {/* Route */}
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono">
                        <span>{booking.flight.from}</span>
                        <span className="text-slate-400 mx-1">{'->'}</span>
                        <span>{booking.flight.to}</span>
                      </td>

                      {/* Seat */}
                      <td className="px-4 py-3 font-mono font-bold text-brand-600 whitespace-nowrap">
                        {booking.seat.id}
                      </td>

                      {/* Fare */}
                      <td className="px-4 py-3 text-slate-900 font-mono font-semibold whitespace-nowrap text-right">
                        {formatCurrency(booking.flight.price)}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(booking.bookingDate)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant={isCancelled ? 'danger' : 'success'}
                          dot={true}
                        >
                          {isCancelled ? 'Cancelled' : 'Confirmed'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Eye size={13} />}
                            onClick={() => setViewTicketBooking(booking)}
                          >
                            Ticket
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={isCancelled}
                            onClick={() => {
                              setCancelError(null);
                              setCancellingBooking(booking);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Ticket Modal */}
      {viewTicketBooking && (
        <Modal
          isOpen={true}
          onClose={() => setViewTicketBooking(null)}
          title="Boarding Pass Voucher"
          size="lg"
        >
          <div className="py-2">
            <TicketCard booking={viewTicketBooking} />
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingBooking && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isCancelling) {
              setCancellingBooking(null);
              setCancelError(null);
            }
          }}
          title="Confirm Ticket Cancellation"
          size="sm"
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
              <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Irreversible Action</p>
                <p className="text-[11px] mt-0.5 text-rose-700">
                  This will cancel booking {cancellingBooking.bookingId} and unlink passenger from the active manifest.
                </p>
              </div>
            </div>

            {cancelError && (
              <div className="p-3 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 font-medium">
                {cancelError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isCancelling}
                onClick={() => {
                  setCancellingBooking(null);
                  setCancelError(null);
                }}
              >
                Keep Ticket
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={isCancelling}
                onClick={handleConfirmCancel}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyBookings;
