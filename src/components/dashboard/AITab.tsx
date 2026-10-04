// components/dashboard/AITab.tsx
// Tab component for the AI Seat Recommendation (Innovation) demo section in DSADashboard

import { Sparkles, CheckCircle2, Cpu, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { SeatPreferences, RecommendationResult } from '../../types';

const PREF_OPTIONS: { key: keyof SeatPreferences; label: string; weight: string; desc: string }[] = [
  { key: 'window',       label: 'Window Seat',   weight: '30 pts', desc: 'Columns A and D' },
  { key: 'aisle',        label: 'Aisle Seat',    weight: '30 pts', desc: 'Columns B and C' },
  { key: 'extraLegroom', label: 'Extra Legroom', weight: '25 pts', desc: 'Rows 1, 10, 20' },
  { key: 'frontRow',     label: 'Front Row',     weight: '20 pts', desc: 'Rows 1 to 5' },
  { key: 'quietArea',    label: 'Quiet Area',    weight: '15 pts', desc: 'Rows 15 to 20' },
];

interface AITabProps {
  preferences:     SeatPreferences;
  recommendation:  RecommendationResult | null;
  onTogglePref:    (key: keyof SeatPreferences) => void;
  onRunAI:         () => void;
}

export function AITab({ preferences, recommendation, onTogglePref, onRunAI }: AITabProps) {
  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
        <h4 className="font-semibold text-slate-800 text-sm">Deterministic Multi-Criteria Seat Recommendation Engine</h4>
        <p className="text-xs text-slate-500 mt-1">
          Evaluates all 80 cabin seats against passenger preferences using a weighted attribute scoring
          algorithm. Window/Aisle: 30 pts each, Legroom: 25 pts, Front Row: 20 pts, Quiet Zone: 15 pts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preferences panel */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Select Passenger Preferences
          </h5>

          <div className="space-y-2" role="group" aria-label="Seat preference options">
            {PREF_OPTIONS.map(opt => {
              const active = preferences[opt.key];
              return (
                <div
                  key={opt.key}
                  onClick={() => onTogglePref(opt.key)}
                  role="checkbox"
                  aria-checked={active}
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onTogglePref(opt.key)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    active
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        active ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                      aria-hidden="true"
                    >
                      {active && <Check size={12} />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="text-xs text-slate-400">{opt.desc}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">{opt.weight}</span>
                </div>
              );
            })}
          </div>

          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={onRunAI}
            icon={<Sparkles size={16} aria-hidden="true" />}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Run Recommendation Engine
          </Button>
        </div>

        {/* Result panel */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Recommendation Decision Output
          </h5>

          {recommendation ? (
            <div className="space-y-4" aria-live="polite">
              {/* Score card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                    Top Ranked Seat
                  </span>
                  <Badge variant="ai" size="md">Score: {Math.round(recommendation.score)}/100</Badge>
                </div>
                <div className="text-3xl font-black font-mono text-emerald-900 mt-2">
                  Seat {recommendation.seat.id}
                </div>
                <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-2">
                  <span>Row {recommendation.seat.row}</span>
                  <span>Col {recommendation.seat.col}</span>
                  <span>Type: {recommendation.seat.type}</span>
                </div>
              </div>

              {/* Reasons */}
              <div>
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">
                  Matched Criteria
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {recommendation.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Time: O(m)</span>
                <span>Evaluated: 80 cabin seats</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400" aria-live="polite">
              <Cpu size={36} className="text-slate-300 mb-2" aria-hidden="true" />
              <p className="text-sm font-medium">No Recommendation Generated Yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Select preferences on the left and click "Run Recommendation Engine".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
