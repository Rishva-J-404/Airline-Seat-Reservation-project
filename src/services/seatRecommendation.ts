// ============================================================
// seatRecommendation.ts - Deterministic AI seat recommendation
// Scoring engine - no external API required.
// Structured so an actual LLM call can be plugged in later.
// ============================================================

import type { Seat, SeatPreferences, RecommendationResult } from '../types';

interface ScoringWeight {
  preference: keyof SeatPreferences;
  label: string;
  weight: number;
  matches: (seat: Seat) => boolean;
}

const SCORING_WEIGHTS: ScoringWeight[] = [
  {
    preference: 'window',
    label: 'Window seat',
    weight: 30,
    matches: (s) => s.col === 'A' || s.col === 'D',
  },
  {
    preference: 'aisle',
    label: 'Aisle seat',
    weight: 30,
    matches: (s) => s.col === 'B' || s.col === 'C',
  },
  {
    preference: 'extraLegroom',
    label: 'Extra legroom',
    weight: 25,
    matches: (s) => s.hasExtraLegroom,
  },
  {
    preference: 'frontRow',
    label: 'Front row',
    weight: 20,
    matches: (s) => s.isFrontRow,
  },
  {
    preference: 'quietArea',
    label: 'Quiet area',
    weight: 15,
    matches: (s) => s.isQuietZone,
  },
];

export function recommendSeat(
  preferences: SeatPreferences,
  availableSeats: Seat[]
): RecommendationResult | null {
  const eligible = availableSeats.filter(s => s.status === 'available');
  if (eligible.length === 0) return null;

  // Score each available seat
  const scored = eligible.map(seat => {
    let score = 0;
    const reasons: string[] = [];
    const matchedPreferences: string[] = [];

    for (const criterion of SCORING_WEIGHTS) {
      if (preferences[criterion.preference] && criterion.matches(seat)) {
        score += criterion.weight;
        reasons.push(`Matches your ${criterion.label.toLowerCase()} preference`);
        matchedPreferences.push(criterion.label);
      }
    }

    // Slight bonus for lower row numbers within aisle preference (accessibility)
    score += Math.max(0, 5 - seat.row * 0.1);

    return { seat, score, reasons, matchedPreferences };
  });

  // Sort by score descending, pick best
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  if (best.reasons.length === 0) {
    best.reasons.push('Best available seat based on current availability');
    best.matchedPreferences.push('General availability');
  }

  return {
    seat: best.seat,
    score: best.score,
    reasons: best.reasons,
    matchedPreferences: best.matchedPreferences,
  };
}

/*
 * FUTURE EXTENSION: Connect to an LLM API
 * Uncomment and configure when an API key is available.
 *
 * export async function recommendSeatAI(
 *   preferences: SeatPreferences,
 *   availableSeats: Seat[],
 *   apiKey: string
 * ): Promise<RecommendationResult | null> {
 *   const prompt = buildPrompt(preferences, availableSeats);
 *   const response = await fetch('https://api.openai.com/v1/chat/completions', {
 *     method: 'POST',
 *     headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ model: 'gpt-4', messages: [{ role: 'user', content: prompt }] }),
 *   });
 *   const data = await response.json();
 *   return parseLLMResponse(data, availableSeats);
 * }
 */
