import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Armchair,
  ArrowRight,
  RotateCcw,
  Info,
  Plane,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { recommendSeat } from '../services/seatRecommendation';
import { generateSeats } from '../data/seats';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/common/PageHeader';
import { ComplexityPanel } from '../components/common/ComplexityBadge';
import { AlgorithmLog } from '../components/common/AlgorithmLog';
import type { SeatPreferences, RecommendationResult } from '../types';

interface PreferenceOption {
  key: keyof SeatPreferences;
  label: string;
  description: string;
}

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    key: 'window',
    label: 'Window Seat',
    description: 'Scenic views and comfortable headrest against the cabin wall (Col A or D)',
  },
  {
    key: 'aisle',
    label: 'Aisle Seat',
    description: 'Quick access to aisle and easy movement during flight (Col B or C)',
  },
  {
    key: 'extraLegroom',
    label: 'Extra Legroom',
    description: 'Spacious legroom in emergency exit rows and bulkhead (Rows 1, 10, 20)',
  },
  {
    key: 'frontRow',
    label: 'Front Row',
    description: 'Priority deplaning and rapid cabin service (Rows 1 to 5)',
  },
  {
    key: 'quietArea',
    label: 'Quiet Area',
    description: 'Peaceful rear cabin section away from galleys (Rows 15 to 20)',
  },
];

export const AIRecommendation: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch, addLog } = useApp();

  const [preferences, setPreferences] = useState<SeatPreferences>(
    state.preferences || {
      window: true,
      aisle: false,
      extraLegroom: false,
      frontRow: false,
      quietArea: false,
    }
  );

  const [result, setResult] = useState<RecommendationResult | null>(
    state.lastRecommendation
      ? {
          seat: state.lastRecommendation.seat,
          reasons: state.lastRecommendation.reasons,
          matchedPreferences: [],
          score: 85,
        }
      : null
  );

  const handleToggle = (key: keyof SeatPreferences) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      // Window and aisle are mutually exclusive for single selection
      if (key === 'window' && updated.window) {
        updated.aisle = false;
      } else if (key === 'aisle' && updated.aisle) {
        updated.window = false;
      }
      dispatch({ type: 'SET_PREFERENCES', payload: updated });
      return updated;
    });
  };

  const handleAnalyze = () => {
    const seats = generateSeats();
    const recommendation = recommendSeat(preferences, seats);

    if (recommendation) {
      setResult(recommendation);
      dispatch({
        type: 'SET_RECOMMENDATION',
        payload: {
          seat: recommendation.seat,
          reasons: recommendation.reasons,
        },
      });
      dispatch({ type: 'INCREMENT_AI' });
      addLog(
        'AI Seat Recommendation',
        'Greedy heuristic algorithm evaluated cabin seats. Recommended seat ' +
          recommendation.seat.id +
          ' with score ' +
          Math.round(recommendation.score) +
          '/100.',
        'ai'
      );
    }
  };

  const handleAcceptSeat = () => {
    if (!result) return;
    dispatch({ type: 'SELECT_SEAT', payload: result.seat });
    addLog(
      'Seat Selected',
      'User accepted recommended seat ' +
        result.seat.id +
        ' for flight ' +
        (state.selectedFlight?.flightNumber || 'reservation') +
        '.',
      'ai'
    );
    navigate('/booking/confirm');
  };

  const handleChooseAnother = () => {
    if (state.selectedFlight) {
      navigate('/flights/' + state.selectedFlight.flightNumber + '/seats');
    } else {
      navigate('/flights/search');
    }
  };

  const handleReset = () => {
    const defaultPrefs: SeatPreferences = {
      window: true,
      aisle: false,
      extraLegroom: false,
      frontRow: false,
      quietArea: false,
    };
    setPreferences(defaultPrefs);
    dispatch({ type: 'SET_PREFERENCES', payload: defaultPrefs });
    setResult(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Header */}
      <PageHeader
        title="Cabin Comfort Seat Matcher"
        subtitle="Deterministic preference scoring engine matching travel preferences to available cabin seats"
        icon={<Armchair size={20} />}
      />

      {/* Flight context banner if flight is selected */}
      {state.selectedFlight ? (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <Plane size={18} className="text-brand-600" />
            <div>
              <span className="font-semibold text-sm text-slate-900">
                Flight {state.selectedFlight.flightNumber} ({state.selectedFlight.airline})
              </span>
              <span className="text-xs font-mono text-slate-500 ml-2">
                {state.selectedFlight.from} {'->'} {state.selectedFlight.to}
              </span>
            </div>
          </div>
          <Badge variant="success">Active Sector</Badge>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-xs text-sm">
          <div className="flex items-center gap-2">
            <Info size={18} className="text-slate-500" />
            <span className="text-slate-600">No specific flight selected. Evaluating default cabin topology.</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/flights/search')}
          >
            Select Sector
          </Button>
        </div>
      )}

      {/* Grid: Preferences Form & Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Preference Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-slate-200 rounded-xl shadow-subtle p-6">
            <CardHeader
              title="Cabin Preferences"
              subtitle="Select criteria for heuristic scoring"
              action={
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<RotateCcw size={14} />}
                  onClick={handleReset}
                >
                  Reset
                </Button>
              }
            />

            <div className="space-y-2.5 mt-4">
              {PREFERENCE_OPTIONS.map((opt) => {
                const checked = preferences[opt.key];
                return (
                  <label
                    key={opt.key}
                    className={[
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150 select-none',
                      checked
                        ? 'bg-slate-50 border-brand-600 ring-1 ring-brand-600'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggle(opt.key)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Button
                variant="accent"
                fullWidth
                size="md"
                icon={<Sparkles size={16} />}
                onClick={handleAnalyze}
              >
                Analyse Preferences
              </Button>
            </div>
          </Card>

          {/* Complexity Details */}
          <ComplexityPanel
            title="Algorithm Specifications"
            items={[
              { label: 'Time Complexity', complexity: 'O(N)', variant: 'good' },
              { label: 'Space Complexity', complexity: 'O(1)', variant: 'good' },
              { label: 'Heuristic', complexity: 'Weighted Greedy', variant: 'good' },
            ]}
          />
        </div>

        {/* Recommendation Result */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <Card className="border border-slate-200 bg-white rounded-xl shadow-subtle p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Badge variant="success">AI Optimal Match</Badge>
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wide">
                    Cabin Allocation
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-mono">Match Score:</span>
                  <span className="text-base font-bold font-mono text-emerald-600 ml-1.5">
                    {Math.round(result.score)} / 100
                  </span>
                </div>
              </div>

              {/* Main Seat Display */}
              <div className="my-6 p-6 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-aero-950 text-white flex items-center justify-center shadow-sm">
                    <Armchair size={28} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                      Recommended Cabin Seat
                    </span>
                    <h2 className="text-4xl font-extrabold font-mono text-slate-900 tracking-tight leading-none mt-1">
                      {result.seat.id}
                    </h2>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      Row {result.seat.row}, Column {result.seat.col} ({result.seat.type === 'window' ? 'Window' : 'Aisle'})
                    </p>
                  </div>
                </div>

                {/* Badges for seat attributes */}
                <div className="flex flex-wrap md:flex-col gap-1.5 shrink-0">
                  <Badge variant={result.seat.type === 'window' ? 'info' : 'queue'}>
                    {result.seat.type === 'window' ? 'Window Seat' : 'Aisle Seat'}
                  </Badge>
                  {result.seat.hasExtraLegroom && (
                    <Badge variant="warning">Extra Legroom</Badge>
                  )}
                  {result.seat.isFrontRow && (
                    <Badge variant="info">Front Row</Badge>
                  )}
                  {result.seat.isQuietZone && (
                    <Badge variant="default">Quiet Area</Badge>
                  )}
                </div>
              </div>

              {/* Matched Preferences */}
              <div className="space-y-2 mb-6">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Satisfied Preference Criteria
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.matchedPreferences && result.matchedPreferences.length > 0 ? (
                    result.matchedPreferences.map((pref, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-emerald-50 text-emerald-900 border border-emerald-200"
                      >
                        <Check size={13} className="text-emerald-600" />
                        {pref}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-emerald-50 text-emerald-900 border border-emerald-200">
                      <Check size={13} className="text-emerald-600" />
                      Cabin Availability Match
                    </span>
                  )}
                </div>
              </div>

              {/* Reasons List */}
              <div className="space-y-2 mb-6">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Heuristic Scoring Trace
                </h4>
                <div className="space-y-1.5">
                  {result.reasons.map((reason, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                    >
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  variant="accent"
                  size="md"
                  fullWidth
                  icon={<ArrowRight size={16} />}
                  onClick={handleAcceptSeat}
                >
                  Accept Assigned Seat
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  icon={<ChevronRight size={16} />}
                  onClick={handleChooseAnother}
                >
                  Choose Another Seat
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border border-slate-300 rounded-xl bg-white">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
                <Sparkles size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Awaiting Preference Evaluation
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
                Select your desired seat options on the left and click &apos;Analyse Preferences&apos; to run the greedy scoring engine.
              </p>
              <Button
                variant="accent"
                size="sm"
                icon={<Sparkles size={14} />}
                onClick={handleAnalyze}
              >
                Analyse Default Preferences
              </Button>
            </Card>
          )}

          {/* Activity Log */}
          <Card className="border border-slate-200 rounded-xl p-6">
            <CardHeader
              title="Algorithm Activity Log"
              subtitle="Live execution trace of DSA and AI heuristic operations"
            />
            <AlgorithmLog />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendation;
