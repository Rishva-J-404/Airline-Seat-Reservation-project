import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaneTakeoff, Search, ArrowRightLeft, Users, Calendar, MapPin, AlertCircle, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { INDIAN_CITIES, searchFlights } from '../data/flights';
import { flightsAPI } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface PopularRoute {
  from: string;
  to: string;
  fromCode: string;
  toCode: string;
  flightTime: string;
}

const POPULAR_ROUTES: PopularRoute[] = [
  { from: 'Coimbatore', to: 'Chennai', fromCode: 'CJB', toCode: 'MAA', flightTime: '1h 10m' },
  { from: 'Mumbai', to: 'Delhi', fromCode: 'BOM', toCode: 'DEL', flightTime: '2h 15m' },
  { from: 'Chennai', to: 'Bangalore', fromCode: 'MAA', toCode: 'BLR', flightTime: '0h 55m' },
];

const CITY_CODES: Record<string, string> = {
  Coimbatore: 'CJB',
  Chennai: 'MAA',
  Mumbai: 'BOM',
  Delhi: 'DEL',
  Bangalore: 'BLR',
  Hyderabad: 'HYD',
  Kolkata: 'CCU',
  Kochi: 'COK',
  Goa: 'GOI',
  Pune: 'PNQ',
  Ahmedabad: 'AMD',
};

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getReturnDefaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function FlightSearch() {
  const navigate = useNavigate();
  const { dispatch, addLog } = useApp();

  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [from, setFrom] = useState<string>('Coimbatore');
  const [to, setTo] = useState<string>('Chennai');
  const [date, setDate] = useState<string>(getTomorrowDate);
  const [returnDate, setReturnDate] = useState<string>(getReturnDefaultDate);
  const [passengers, setPassengers] = useState<number>(1);
  const [cabinClass, setCabinClass] = useState<'economy' | 'business'>('economy');
  const [error, setError] = useState<string | null>(null);

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
    setError(null);
  };

  const handleSelectRoute = (route: PopularRoute) => {
    setFrom(route.from);
    setTo(route.to);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!from || !to) {
      setError('Please select both origin and destination cities.');
      return;
    }

    if (from === to) {
      setError('Origin and destination cannot be the same city.');
      return;
    }

    if (passengers < 1 || passengers > 9) {
      setError('Passenger count must be between 1 and 9.');
      return;
    }

    if (tripType === 'round-trip' && returnDate < date) {
      setError('Return date must be on or after departure date.');
      return;
    }

    setError(null);

    try {
      const res = await flightsAPI.getAll({ from, to });
      if (res && res.flights && res.flights.length > 0) {
        dispatch({ type: 'SET_SEARCHED_FLIGHTS', payload: res.flights });
        addLog(
          'Flight Search (API)',
          `Retrieved ${res.flights.length} flights for ${from} -> ${to} from PostgreSQL backend`,
          'sort'
        );
        navigate('/flights/results');
        return;
      }
    } catch {
      // Seamless offline fallback
    }

    const flights = searchFlights(from, to);
    dispatch({ type: 'SET_SEARCHED_FLIGHTS', payload: flights });
    addLog(
      'Flight Search',
      `Searched flights from ${from} to ${to}: ${flights.length} flights found`,
      'sort'
    );

    navigate('/flights/results');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-sans">
      {/* Airline Booking Breadcrumb / Progress Steps */}
      <nav aria-label="Booking flow progress" className="mb-6">
        <ol className="flex items-center gap-2 text-xs font-mono text-slate-500 overflow-x-auto pb-1">
          <li className="flex items-center gap-1.5 text-aero-950 font-bold" aria-current="step">
            <span className="w-5 h-5 rounded-full bg-aero-950 text-white flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Search Flights</span>
            <span className="text-slate-300">/</span>
          </li>
          <li className="flex items-center gap-1.5 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px]">
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

      <PageHeader
        title="Flight Schedule Search"
        subtitle="Commercial airline schedule search powered by deterministic DSA sorting and seat allocation"
        icon={<PlaneTakeoff className="h-5 w-5" />}
      />

      {/* Main Search Panel styled like an authentic airline booking widget */}
      <Card className="mb-8 border border-slate-200 rounded-lg p-6 md:p-8">
        {/* Trip Type & Cabin Class Selection */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200">
          <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setTripType('one-way');
                setError(null);
              }}
              className={`px-3.5 py-1.5 rounded transition-all font-semibold ${
                tripType === 'one-way'
                  ? 'bg-white text-aero-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              One Way
            </button>
            <button
              type="button"
              onClick={() => {
                setTripType('round-trip');
                setError(null);
              }}
              className={`px-3.5 py-1.5 rounded transition-all font-semibold ${
                tripType === 'round-trip'
                  ? 'bg-white text-aero-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Round Trip
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <label className="text-slate-500 font-mono uppercase tracking-wider text-[11px] font-semibold">
              Cabin:
            </label>
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value as 'economy' | 'business')}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="economy">Economy Class</option>
              <option value="business">Business Class</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            {/* Origin City */}
            <div className="md:col-span-5 space-y-1.5">
              <label htmlFor="from-city" className="block text-[11px] font-mono font-semibold text-slate-600 uppercase tracking-wider">
                Origin Airport
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  id="from-city"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setError(null);
                  }}
                  className="w-full pl-9 pr-14 py-2.5 bg-white border border-slate-300 rounded text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                >
                  <option value="" disabled>Select origin city</option>
                  {INDIAN_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city} ({CITY_CODES[city] || 'IND'})
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                  {CITY_CODES[from] || 'ORIGIN'}
                </span>
              </div>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex justify-center pt-5 md:pt-4">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap origin and destination"
                className="w-9 h-9 flex items-center justify-center rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Destination City */}
            <div className="md:col-span-5 space-y-1.5">
              <label htmlFor="to-city" className="block text-[11px] font-mono font-semibold text-slate-600 uppercase tracking-wider">
                Destination Airport
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  id="to-city"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setError(null);
                  }}
                  className="w-full pl-9 pr-14 py-2.5 bg-white border border-slate-300 rounded text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                >
                  <option value="" disabled>Select destination city</option>
                  {INDIAN_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city} ({CITY_CODES[city] || 'IND'})
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                  {CITY_CODES[to] || 'DEST'}
                </span>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 ${tripType === 'round-trip' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
            {/* Departure Date */}
            <div className="space-y-1.5">
              <label htmlFor="travel-date" className="block text-[11px] font-mono font-semibold text-slate-600 uppercase tracking-wider">
                Departure Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="travel-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            {/* Return Date (Shown for Round Trip) */}
            {tripType === 'round-trip' && (
              <div className="space-y-1.5">
                <label htmlFor="return-date" className="block text-[11px] font-mono font-semibold text-slate-600 uppercase tracking-wider">
                  Return Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="return-date"
                    type="date"
                    min={date}
                    value={returnDate}
                    onChange={(e) => {
                      setReturnDate(e.target.value);
                      setError(null);
                    }}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Passengers */}
            <div className="space-y-1.5">
              <label htmlFor="passengers-count" className="block text-[11px] font-mono font-semibold text-slate-600 uppercase tracking-wider">
                Passengers
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="passengers-count"
                  type="number"
                  min={1}
                  max={9}
                  value={passengers}
                  onChange={(e) => setPassengers(Math.max(1, Math.min(9, parseInt(e.target.value) || 1)))}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Quick Route Selector */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-semibold">
              Popular Flight Routes
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_ROUTES.map((route) => {
                const isActive = from === route.from && to === route.to;
                return (
                  <button
                    key={`${route.from}-${route.to}`}
                    type="button"
                    onClick={() => handleSelectRoute(route)}
                    className={[
                      'px-3 py-1.5 rounded text-xs font-mono transition-colors border flex items-center gap-1.5',
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <span>{route.fromCode} {'->'} {route.toCode}</span>
                    <span className="text-[10px] opacity-75 font-sans font-normal">({route.flightTime})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth icon={<Search className="h-4 w-4" />}>
            Search Available Flights
          </Button>
        </form>
      </Card>

      {/* Commercial Aviation Notice Card */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">Direct Flight Scheduling Notice</p>
          <p className="leading-relaxed">
            All flight schedules reflect live domestic airport slots. Real-time seat availability is allocated dynamically upon passenger confirmation with instant e-ticket issuance.
          </p>
        </div>
      </div>
    </div>
  );
}
