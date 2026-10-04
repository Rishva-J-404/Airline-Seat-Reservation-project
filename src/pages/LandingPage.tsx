import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlaneTakeoff,
  ArrowRight,
  List,
  Network,
  ArrowDownUp,
  GitBranch,
  ChevronRight,
  ShieldCheck,
  Activity,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Aviation Navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-aero-950 flex items-center justify-center text-white shadow-2xs">
              <PlaneTakeoff size={18} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-aero-950 tracking-tight font-display">
                FlySmart Airlines
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                OPERATIONAL FLIGHT DISPATCH
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#booking" className="hover:text-aero-950 transition-colors">
              Flight Booking
            </a>
            <a href="#architecture" className="hover:text-aero-950 transition-colors">
              Passenger Services
            </a>
            <a href="#pipeline" className="hover:text-aero-950 transition-colors">
              Booking Flow
            </a>
            <Link to="/login" className="hover:text-aero-950 transition-colors">
              Passenger Portal
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-700 hover:text-aero-950 px-3 py-1.5 transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/login')}
              icon={<ArrowRight size={14} />}
            >
              Access Portal
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            {/* Aviation System Eyebrow */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 text-xs font-mono font-semibold mb-6">
              <Activity size={13} className="text-slate-800" />
              <span>COMMERCIAL AVIATION PASSENGER BOOKING PORTAL</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl font-extrabold text-aero-950 tracking-tight leading-[1.1] font-display">
              Commercial Airline Seat Reservation Engine
            </h1>

            {/* Subtext */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Book domestic scheduled flights, choose your preferred aircraft cabin seats with real-time availability, and obtain instant digital boarding passes across major Indian metro sectors.
            </p>

            {/* Dual CTAs */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                size="md"
                variant="primary"
                onClick={() => navigate('/login')}
                icon={<PlaneTakeoff size={16} />}
              >
                Book Flight Reservation
              </Button>
              <Button
                size="md"
                variant="secondary"
                onClick={() => navigate('/login')}
                icon={<ArrowRight size={15} />}
              >
                Open Operations Center
              </Button>
            </div>
          </div>

          {/* Direct Flight Search Teaser Widget */}
          <div id="booking" className="mt-12 p-5 rounded-lg border border-slate-300 bg-slate-50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-3/4">
                <div className="p-3 bg-white border border-slate-200 rounded flex items-center gap-2 text-xs">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">From Airport</span>
                    <span className="font-bold text-slate-900">Coimbatore (CJB)</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded flex items-center gap-2 text-xs">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">To Airport</span>
                    <span className="font-bold text-slate-900">Chennai (MAA)</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded flex items-center gap-2 text-xs">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Departure</span>
                    <span className="font-bold text-slate-900">Tomorrow · 1 Adult</span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => navigate('/login')}
                  icon={<PlaneTakeoff size={16} />}
                >
                  Check Schedules
                </Button>
              </div>
            </div>
          </div>

          {/* Operational Architecture Badges */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 rounded bg-white border border-slate-200">
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Active Sectors</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono">5 Major Air Hubs</p>
            </div>
            <div className="p-3 rounded bg-white border border-slate-200">
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Fleet Layout</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono">20-Row Aircraft Cabin</p>
            </div>
            <div className="p-3 rounded bg-white border border-slate-200">
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Seat Comfort</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono">Smart Preference Filter</p>
            </div>
            <div className="p-3 rounded bg-white border border-slate-200">
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Ticketing</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono">Instant Digital Pass</p>
            </div>
          </div>
        </div>
      </section>

      {/* Commercial Services Grid Section */}
      <section id="architecture" className="py-16 md:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-aero-950 tracking-tight font-display">
              Commercial Passenger Services &amp; Features
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              Engineered for seamless domestic flight booking, interactive seat reservation, and instant ticketing.
            </p>
          </div>

          {/* Matrix of Commercial Services */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Cell 1: Flight Booking */}
            <div className="rounded-lg bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                    <List size={18} />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    FLIGHT DISPATCH
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Real-Time Flight Schedules
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Browse scheduled flights across Coimbatore, Chennai, Bangalore, Mumbai, and Delhi with transparent airfares.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
                <span>Multi-Sector</span>
                <span>Direct Flights</span>
              </div>
            </div>

            {/* Cell 2: Seat Allocation */}
            <div className="rounded-lg bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                    <Network size={18} />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    CABIN SELECTION
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Interactive Cabin Layout
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Explore full 20-row aircraft cabin matrices. Choose window seats, aisle access, or extra legroom with live availability.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
                <span>20 Rows</span>
                <span>4-Abreast (A-D)</span>
              </div>
            </div>

            {/* Cell 3: Fare Sorting */}
            <div className="rounded-lg bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                    <ArrowDownUp size={18} />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    FARE FILTERING
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Lowest Fare Ranking
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Sort flights by lowest ticket price or departure timing to find optimal travel options for your schedule.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
                <span>Price: Low to High</span>
                <span>Best Value</span>
              </div>
            </div>

            {/* Cell 4: Reservation Management */}
            <div className="rounded-lg bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                    <GitBranch size={18} />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    E-TICKETING
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Instant Boarding Pass
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Access digital boarding passes with booking references, seat allocation, passenger manifest, and print-ready vouchers.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
                <span>Printable Pass</span>
                <span>Instant Retrieval</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reservation Pipeline Flow */}
      <section id="pipeline" className="py-16 md:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-aero-950 tracking-tight font-display">
              Airline Reservation Lifecycle
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              How a flight reservation traverses algorithmic data structures from search to boarding pass generation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-xs font-mono font-bold text-slate-500">STAGE 01</span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Route Search &amp; Price Sort</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Query city pairs and step through in-place Selection Sort passes to rank flights by price.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-xs font-mono font-bold text-slate-500">STAGE 02</span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Queue Buffering</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Enqueue the ticket reservation into a linear FIFO linked chain ensuring deterministic ordering.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-xs font-mono font-bold text-slate-500">STAGE 03</span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Cabin Seat Allocation</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Interactive 20-row aircraft seat map with heuristic recommendations based on comfort criteria.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-xs font-mono font-bold text-slate-500">STAGE 04</span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Manifest &amp; Tree Index</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Append confirmed passenger to the live Linked List and index booking code into the Binary Search Tree.
              </p>
            </div>
          </div>

          {/* Action Box */}
          <div className="mt-12 p-8 rounded-lg bg-aero-950 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold font-display">Experience the Live Reservation System</h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
                Ready to search flights, reserve cabin seats, and observe algorithmic operations in the live console?
              </p>
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/login')}
              icon={<ChevronRight size={18} />}
            >
              Enter Passenger Portal
            </Button>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="py-8 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-slate-400" />
            <span>FlySmart Aviation Commercial Flight Operations &amp; Algorithmic Dispatch</span>
          </div>
          <div>
            Built with React, TypeScript, and Tailwind CSS
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
