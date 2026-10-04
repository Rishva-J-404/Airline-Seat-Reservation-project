import React from 'react';
import { PlaneTakeoff } from 'lucide-react';
import type { Booking } from '../../types';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';

interface TicketCardProps {
  booking: Booking;
  printable?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({ booking, printable = false }) => {
  const passengerName = booking.passenger.passengerName || booking.passenger.name || 'Passenger';
  const bookingId = booking.bookingId || booking.id || '';
  const flightNumber = booking.flight.flightNumber;
  const origin = booking.flight.from || booking.flight.origin || '';
  const destination = booking.flight.to || booking.flight.destination || '';
  const depTime = booking.flight.departure || (booking.flight.departureTime ? formatTime(new Date(booking.flight.departureTime)) : '10:00');

  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-300 bg-white shadow-subtle font-sans max-w-2xl mx-auto ${
        printable ? 'print:shadow-none print:border-slate-800' : ''
      }`}
    >
      {/* Boarding Pass Header */}
      <div className="bg-aero-950 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <PlaneTakeoff className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              FlySmart Commercial Aviation
            </p>
            <h2 className="text-sm font-bold tracking-wider text-white uppercase font-display">
              Electronic Boarding Pass
            </h2>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Flight ID</p>
          <p className="text-xl font-mono font-bold tracking-tight text-white">
            {flightNumber}
          </p>
        </div>
      </div>

      {/* Main Boarding Pass Body */}
      <div className="p-6">
        {/* Route Banner */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-2xl font-black font-mono text-slate-900 tracking-tight">{origin}</span>
            <span className="block text-[11px] font-mono text-slate-500 uppercase">Departure Airport</span>
          </div>
          <div className="flex flex-col items-center px-4">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Non-stop Sector</span>
            <div className="flex items-center gap-1 my-1">
              <div className="w-8 h-px bg-slate-300" />
              <PlaneTakeoff className="h-3.5 w-3.5 text-slate-400" />
              <div className="w-8 h-px bg-slate-300" />
            </div>
            <span className="text-[10px] font-mono text-slate-500">{booking.flight.duration}</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-mono text-slate-900 tracking-tight">{destination}</span>
            <span className="block text-[11px] font-mono text-slate-500 uppercase">Arrival Airport</span>
          </div>
        </div>

        {/* 4-Column Flight Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-100 text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Passenger Name
            </span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
              {passengerName}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Departure Time
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
              {depTime}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Gate / Terminal
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
              Gate 04 · T2
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Cabin Seat
            </span>
            <span className="font-mono font-black text-flight-azure text-lg mt-0.5 block">
              {booking.seat.id}
            </span>
          </div>
        </div>

        {/* Supplementary Booking Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs text-slate-600 font-mono">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Booking Reference</span>
            <span className="font-bold text-slate-800">{bookingId}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Date of Travel</span>
            <span className="font-medium text-slate-800">{booking.bookingDate ? formatDate(booking.bookingDate) : 'Confirmed'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Ticket Status</span>
            <span className="font-bold text-emerald-600 uppercase">Confirmed / Issued</span>
          </div>
        </div>
      </div>

      {/* Perforated Tear Notch Divider */}
      <div className="relative flex items-center">
        <div className="w-5 h-7 -ml-2.5 rounded-r-full bg-slate-100 border-r border-y border-slate-300" />
        <div className="flex-1 border-t-2 border-dashed border-slate-300 mx-2" />
        <div className="w-5 h-7 -mr-2.5 rounded-l-full bg-slate-100 border-l border-y border-slate-300" />
      </div>

      {/* Boarding Pass Stub & Barcode */}
      <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Fare Paid</span>
          <span className="text-base font-bold font-mono text-aero-950">
            {formatCurrency(booking.flight.price)}
          </span>
        </div>

        {/* QR Token & Monospace Barcode Simulation */}
        <div className="flex items-center gap-4">
          {/* Simulated 2D Aztec Token */}
          <div className="w-10 h-10 border-2 border-slate-900 bg-white p-1 rounded flex flex-col justify-between items-center shrink-0">
            <div className="w-full flex justify-between">
              <div className="w-2 h-2 bg-slate-900" />
              <div className="w-2 h-2 bg-slate-900" />
            </div>
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-xs" />
            <div className="w-full flex justify-between">
              <div className="w-2 h-2 bg-slate-900" />
              <div className="w-1 h-1 bg-slate-900" />
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-xs tracking-[0.28em] text-slate-800 font-bold select-none">
              ||| | |||| | ||| || |||| | || | ||| || ||||
            </div>
            <span className="text-[9px] text-slate-400 tracking-wider block mt-0.5">
              ETKT: {bookingId}-IATA-0982-DSA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
