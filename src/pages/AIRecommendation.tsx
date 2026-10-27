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
  Columns3,
  Award,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { recommendTopSeats } from '../services/seatRecommendation';
import type { RecommendationResult } from '../services/seatRecommendation';
import { generateSeats } from '../data/seats';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/common/PageHeader';
import { ComplexityPanel } from '../components/common/ComplexityBadge';
import { AlgorithmLog } from '../components/common/AlgorithmLog';
import type { SeatPreferences, Seat } from '../types';

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
    label: 'Forward Cabin',
    description: 'Priority deplaning and rapid cabin service (Rows 1 to 5)',
  },
  {
    key: 'quietArea',
    label: 'Quiet Zone',
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

  const [topSeats, setTopSeats] = useState<RecommendationResult[]>([]);
  const [selectedRankIndex, setSelectedRankIndex] = useState<number>(0);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

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
    const ranked = recommendTopSeats(preferences, seats, 3);
    setTopSeats(ranked);
    setSelectedRankIndex(0);

    if (ranked.length > 0) {
      const topPick = ranked[0];
      dispatch({
        type: 'SET_RECOMMENDATION',
        payload: {
          seat: topPick.seat,
          reasons: topPick.reasons,
        },
      });
      dispatch({ type: 'INCREMENT_AI' });
      addLog(
        'Intelligent Recommendation',
        `Multi-factor greedy heuristic evaluated ${seats.length} cabin seats. Top 3 recommendations: ${ranked
          .map((r, i) => `#${i + 1} Seat ${r.seat.id} (${r.score}/100)`)
          .join(', ')}.`,
        'ai'
      );
    }
  };

  const handleSelectSeat = (seat: Seat) => {
    dispatch({ type: 'SELECT_SEAT', payload: seat });
    addLog(
      'Seat Selected',
      `User accepted recommended seat ${seat.id} for flight ${
        state.selectedFlight?.flightNumber || 'reservation'
      }.`,
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
    setTopSeats([]);
    setSelectedRankIndex(0);
  };

  const activeResult = topSeats[selectedRankIndex] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Header */}
      <PageHeader
        title="Intelligent Multi-Factor Seat Recommendation Engine"
        subtitle="Deterministic weighted scoring algorithm evaluating ergonomic constraints across cabin topology"
        icon={<Armchair size={20} />}
      />

      {/* Sector context banner */}
      {state.selectedFlight ? (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <Plane size={18} className="text-brand-600" />
            <div>
              <span className="font-semibold text-sm text-slate-900">
                Flight {state.selectedFlight.flightNumber} ({state.selectedFlight.airline})
              </span>
              <span className="text-xs font-mono text-slate-500 ml-2">
                {state.selectedFlight.from} &rarr; {state.selectedFlight.to}
              </span>
            </div>
          </div>
          <Badge variant="success">Active Sector</Badge>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-xs text-sm">
          <div className="flex items-center gap-2">
            <Info size={18} className="text-slate-500" />
            <span className="text-slate-600">No specific sector selected. Evaluating baseline aircraft topology.</span>
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
              title="Passenger Preferences"
              subtitle="Configure weighting criteria for multi-factor evaluation"
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
                Compute Top 3 Recommendations
              </Button>
            </div>
          </Card>

          {/* Complexity Details */}
          <ComplexityPanel
            title="Algorithm Specifications"
            items={[
              { label: 'Time Complexity', complexity: 'O(N)', variant: 'good' },
              { label: 'Space Complexity', complexity: 'O(1)', variant: 'good' },
              { label: 'Methodology', complexity: 'Multi-Factor Heuristic', variant: 'good' },
              { label: 'Ranking Criterion', complexity: 'Weighted Feature Sum', variant: 'good' },
            ]}
          />
        </div>

        {/* Recommendation Results (Top 3) */}
        <div className="lg:col-span-7 space-y-6">
          {topSeats.length > 0 && activeResult ? (
            <div className="space-y-6">
              {/* Top 3 Selector Tabs & Compare CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  {topSeats.map((item, idx) => (
                    <button
                      key={item.seat.id}
                      onClick={() => setSelectedRankIndex(idx)}
                      className={[
                        'px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-1.5',
                        selectedRankIndex === idx
                          ? 'bg-aero-950 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                      ].join(' ')}
                    >
                      <Award size={13} className={idx === 0 ? 'text-amber-400' : 'text-slate-400'} />
                      <span>Rank #{idx + 1}: Seat {item.seat.id}</span>
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Columns3 size={14} />}
                  onClick={() => setIsCompareModalOpen(true)}
                >
                  Compare Side-by-Side
                </Button>
              </div>

              {/* Active Recommendation Card */}
              <Card className="border border-slate-200 bg-white rounded-xl shadow-subtle p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedRankIndex === 0 ? 'success' : 'info'}>
                      {selectedRankIndex === 0 ? 'Optimal Match (Rank #1)' : `Rank #${selectedRankIndex + 1} Alternative`}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wide">
                      Heuristic Score
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-mono">Total Points:</span>
                    <span className="text-lg font-bold font-mono text-emerald-600 ml-1.5">
                      {Math.round(activeResult.score)} / 100
                    </span>
                  </div>
                </div>

                {/* Seat Detail */}
                <div className="my-6 p-6 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-aero-950 text-white flex items-center justify-center shadow-sm">
                      <Armchair size={28} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                        Assigned Position
                      </span>
                      <h2 className="text-4xl font-extrabold font-mono text-slate-900 tracking-tight leading-none mt-1">
                        {activeResult.seat.id}
                      </h2>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        Row {activeResult.seat.row}, Column {activeResult.seat.col} (
                        {activeResult.seat.type === 'window' ? 'Window' : 'Aisle'}) &bull; ${state.selectedFlight?.price || 2500}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap md:flex-col gap-1.5 shrink-0">
                    <Badge variant={activeResult.seat.type === 'window' ? 'info' : 'queue'}>
                      {activeResult.seat.type === 'window' ? 'Window Seat' : 'Aisle Seat'}
                    </Badge>
                    {activeResult.seat.hasExtraLegroom && (
                      <Badge variant="warning">Extra Legroom</Badge>
                    )}
                    {activeResult.seat.isFrontRow && (
                      <Badge variant="info">Forward Cabin</Badge>
                    )}
                    {activeResult.seat.isQuietZone && (
                      <Badge variant="default">Quiet Area</Badge>
                    )}
                  </div>
                </div>

                {/* Score Breakdown Section */}
                <div className="mb-6 space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                    Feature-Wise Score Contribution
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-500 text-[11px] block">Window Affinity</span>
                      <span className="font-mono font-bold text-slate-800">+{activeResult.breakdown.windowPoints} pts</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-500 text-[11px] block">Aisle Affinity</span>
                      <span className="font-mono font-bold text-slate-800">+{activeResult.breakdown.aislePoints} pts</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-500 text-[11px] block">Extra Legroom</span>
                      <span className="font-mono font-bold text-slate-800">+{activeResult.breakdown.legroomPoints} pts</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-500 text-[11px] block">Forward Cabin</span>
                      <span className="font-mono font-bold text-slate-800">+{activeResult.breakdown.frontRowPoints} pts</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-500 text-[11px] block">Quiet Zone</span>
                      <span className="font-mono font-bold text-slate-800">+{activeResult.breakdown.quietZonePoints} pts</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-500 text-[11px] block">Baseline Availability</span>
                      <span className="font-mono font-bold text-slate-800">+{activeResult.breakdown.accessibilityBonus} pts</span>
                    </div>
                  </div>
                </div>

                {/* Reasons List */}
                <div className="space-y-2 mb-6">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                    Explainable Matching Rationale
                  </h4>
                  <div className="space-y-1.5">
                    {activeResult.reasons.map((reason, i) => (
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
                    onClick={() => handleSelectSeat(activeResult.seat)}
                  >
                    Select Seat {activeResult.seat.id} (Rank #{selectedRankIndex + 1})
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    icon={<ChevronRight size={16} />}
                    onClick={handleChooseAnother}
                  >
                    Manual Seat Map
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border border-slate-300 rounded-xl bg-white">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
                <Sparkles size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Awaiting Preference Evaluation
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
                Select your desired seating criteria on the left and run the multi-factor heuristic engine to view the Top 3 ranked seats.
              </p>
              <Button
                variant="accent"
                size="sm"
                icon={<Zap size={14} />}
                onClick={handleAnalyze}
              >
                Compute Top 3 Recommendations
              </Button>
            </Card>
          )}

          {/* Activity Log */}
          <Card className="border border-slate-200 rounded-xl p-6">
            <CardHeader
              title="Algorithm Activity Log"
              subtitle="Live execution trace of DSA and heuristic ranking operations"
            />
            <AlgorithmLog />
          </Card>
        </div>
      </div>

      {/* Comparison Modal (Section 18) */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="Side-by-Side Top 3 Seat Comparison"
        size="xl"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            Compare algorithmic weighting and physical cabin attributes across the top 3 recommended candidates.
          </p>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                <tr>
                  <th className="p-3">Attribute</th>
                  {topSeats.map((rec, i) => (
                    <th key={rec.seat.id} className="p-3">
                      Rank #{i + 1} ({rec.seat.id})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="p-3 font-semibold text-slate-600">Total Match Score</td>
                  {topSeats.map((rec) => (
                    <td key={rec.seat.id} className="p-3 font-bold font-mono text-emerald-600">
                      {rec.score}/100
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-600">Cabin Placement</td>
                  {topSeats.map((rec) => (
                    <td key={rec.seat.id} className="p-3">
                      Row {rec.seat.row}, Col {rec.seat.col} ({rec.seat.type.toUpperCase()})
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-600">Extra Legroom</td>
                  {topSeats.map((rec) => (
                    <td key={rec.seat.id} className="p-3">
                      {rec.seat.hasExtraLegroom ? 'Yes (+25 pts)' : 'Standard (0)'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-600">Forward Cabin</td>
                  {topSeats.map((rec) => (
                    <td key={rec.seat.id} className="p-3">
                      {rec.seat.isFrontRow ? 'Yes (+20 pts)' : 'No (0)'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-600">Quiet Zone</td>
                  {topSeats.map((rec) => (
                    <td key={rec.seat.id} className="p-3">
                      {rec.seat.isQuietZone ? 'Yes (+15 pts)' : 'No (0)'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-600">Ticket Fare</td>
                  {topSeats.map((rec) => (
                    <td key={rec.seat.id} className="p-3 font-mono font-medium">
                      ${state.selectedFlight?.price || 2500}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            {topSeats.map((rec, i) => (
              <Button
                key={rec.seat.id}
                size="sm"
                variant={i === 0 ? 'accent' : 'secondary'}
                onClick={() => {
                  setIsCompareModalOpen(false);
                  handleSelectSeat(rec.seat);
                }}
              >
                Choose Seat {rec.seat.id}
              </Button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AIRecommendation;
