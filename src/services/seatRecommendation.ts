// ============================================================
// seatRecommendation.ts - Intelligent Multi-Factor Seat Recommendation Engine
// Deterministic multi-criteria scoring algorithm (Algorithmic Innovation)
// Evaluates cabin constraints: window, aisle, extra legroom, front row, quiet zone.
// No external API required. Completely reproducible and explainable.
// ============================================================

import type { Seat, SeatPreferences } from '../types';

export interface SeatScoreBreakdown {
  windowPoints: number;
  aislePoints: number;
  legroomPoints: number;
  frontRowPoints: number;
  quietZonePoints: number;
  accessibilityBonus: number;
  totalScore: number;
}

export interface RecommendationResult {
  seat: Seat;
  score: number;
  reasons: string[];
  matchedPreferences: string[];
  breakdown: SeatScoreBreakdown;
}

interface ScoringWeight {
  preference: keyof SeatPreferences;
  label: string;
  weight: number;
  matches: (seat: Seat) => boolean;
}

export const SCORING_WEIGHTS: ScoringWeight[] = [
  {
    preference: 'window',
    label: 'Window Seat',
    weight: 30,
    matches: (s) => s.col === 'A' || s.col === 'D',
  },
  {
    preference: 'aisle',
    label: 'Aisle Seat',
    weight: 30,
    matches: (s) => s.col === 'B' || s.col === 'C',
  },
  {
    preference: 'extraLegroom',
    label: 'Extra Legroom (Bulkhead / Exit Row)',
    weight: 25,
    matches: (s) => s.hasExtraLegroom,
  },
  {
    preference: 'frontRow',
    label: 'Forward Cabin (Rows 1-5)',
    weight: 20,
    matches: (s) => s.isFrontRow,
  },
  {
    preference: 'quietArea',
    label: 'Quiet Zone (Rows 15-20)',
    weight: 15,
    matches: (s) => s.isQuietZone,
  },
];

/**
 * Evaluates available seats and returns top N recommendations ranked by score
 * Generates transparent score breakdown for comparison (Section 20 & 21)
 */
export function recommendTopSeats(
  preferences: SeatPreferences,
  availableSeats: Seat[],
  limit = 3
): RecommendationResult[] {
  const eligible = availableSeats.filter(s => s.status === 'available');
  if (eligible.length === 0) return [];

  const scored: RecommendationResult[] = eligible.map(seat => {
    let windowPoints = 0;
    let aislePoints = 0;
    let legroomPoints = 0;
    let frontRowPoints = 0;
    let quietZonePoints = 0;

    const reasons: string[] = [];
    const matchedPreferences: string[] = [];

    if (preferences.window && (seat.col === 'A' || seat.col === 'D')) {
      windowPoints = 30;
      reasons.push('Panoramic window seat position (Column ' + seat.col + ')');
      matchedPreferences.push('Window Seat');
    }

    if (preferences.aisle && (seat.col === 'B' || seat.col === 'C')) {
      aislePoints = 30;
      reasons.push('Direct aisle access position (Column ' + seat.col + ')');
      matchedPreferences.push('Aisle Seat');
    }

    if (preferences.extraLegroom && seat.hasExtraLegroom) {
      legroomPoints = 25;
      reasons.push('Extra legroom in Row ' + seat.row + ' (exit or bulkhead row)');
      matchedPreferences.push('Extra Legroom');
    }

    if (preferences.frontRow && seat.isFrontRow) {
      frontRowPoints = 20;
      reasons.push('Priority forward cabin positioning (Row ' + seat.row + ')');
      matchedPreferences.push('Forward Cabin');
    }

    if (preferences.quietArea && seat.isQuietZone) {
      quietZonePoints = 15;
      reasons.push('Designated quiet zone cabin sector (Row ' + seat.row + ')');
      matchedPreferences.push('Quiet Zone');
    }

    // Accessibility & egress micro-bonus (rows closer to front exit)
    const accessibilityBonus = Number((Math.max(0, 5 - seat.row * 0.15)).toFixed(1));

    const totalRaw = windowPoints + aislePoints + legroomPoints + frontRowPoints + quietZonePoints + accessibilityBonus;
    // Scale to standard 0-100 rating
    const totalScore = Math.min(100, Math.round(totalRaw));

    if (reasons.length === 0) {
      reasons.push('Standard available seat with clear aisle traversal');
      matchedPreferences.push('Standard Cabin');
    }

    return {
      seat,
      score: totalScore,
      reasons,
      matchedPreferences,
      breakdown: {
        windowPoints,
        aislePoints,
        legroomPoints,
        frontRowPoints,
        quietZonePoints,
        accessibilityBonus,
        totalScore,
      },
    };
  });

  // Sort descending by calculated score
  scored.sort((a, b) => b.score - a.score || a.seat.row - b.seat.row);

  return scored.slice(0, limit);
}

/**
 * Returns single top recommendation (backward compatible)
 */
export function recommendSeat(
  preferences: SeatPreferences,
  availableSeats: Seat[]
): RecommendationResult | null {
  const top = recommendTopSeats(preferences, availableSeats, 1);
  return top.length > 0 ? top[0] : null;
}
