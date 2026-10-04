import React from 'react';
import { Clock, PlaneTakeoff, ArrowRight } from 'lucide-react';
import type { Flight } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';

interface FlightCardProps {
  flight: Flight;
  onSelect: (f: Flight) => void;
  selected?: boolean;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, onSelect, selected = false }) => {
  const lowSeats = flight.availableSeats <= 5;
  const departureStr = flight.departure || (flight as any).departureTime || '';
  const arrivalStr = flight.arrival || (flight as any).arrivalTime || '';
  const originStr = flight.from || (flight as any).origin || '';
  const destinationStr = flight.to || (flight as any).destination || '';

  return (
    <Card
      padding={false}
      className={`overflow-hidden transition-all duration-200 border ${
        selected
          ? 'border-brand-600 ring-2 ring-brand-100 shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-subtle'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 text-white">
        <div className="flex items-center gap-2">
          <PlaneTakeoff className="h-4 w-4 text-slate-300" />
          <span className="text-xs font-mono font-bold tracking-wide">
            {flight.flightNumber}
          </span>
          <span className="text-xs text-slate-300 font-sans">
            · {flight.airline}
          </span>
        </div>
        <Badge variant={lowSeats ? 'warning' : 'success'}>
          {flight.availableSeats} seat{flight.availableSeats !== 1 ? 's' : ''} left
        </Badge>
      </div>

      {/* Flight timeline content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4">
        {/* Origin */}
        <div className="flex items-center sm:flex-col sm:items-start gap-3 sm:gap-0.5">
          <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {departureStr}
          </span>
          <span className="text-xs font-medium text-slate-600">
            {originStr}
          </span>
        </div>

        {/* Flight duration and flight path vector */}
        <div className="flex flex-col items-center justify-center flex-1 px-2">
          <div className="flex items-center gap-1 text-slate-500 font-mono text-xs">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>{flight.duration}</span>
          </div>
          <div className="my-1.5 flex w-full max-w-[140px] items-center gap-1">
            <div className="h-px flex-1 bg-slate-300" />
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <div className="h-px flex-1 bg-slate-300" />
          </div>
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Non-stop</span>
        </div>

        {/* Destination */}
        <div className="flex items-center sm:flex-col sm:items-end gap-3 sm:gap-0.5">
          <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {arrivalStr}
          </span>
          <span className="text-xs font-medium text-slate-600">
            {destinationStr}
          </span>
        </div>

        {/* Fare + CTA */}
        <div className="pt-3 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-slate-200 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 block">Total Fare</span>
            <span className="text-xl font-bold font-mono text-aero-950">
              {formatCurrency(flight.price)}
            </span>
          </div>
          <Button
            variant={selected ? 'secondary' : 'accent'}
            size="sm"
            onClick={() => onSelect(flight)}
          >
            {selected ? 'Selected' : 'Select Flight'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
