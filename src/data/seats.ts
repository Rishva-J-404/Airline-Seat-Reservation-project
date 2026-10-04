import type { Seat } from '../types';

// Aircraft layout: 20 rows, 4 cols (A B  C D)
// A, D = window | B, C = aisle
// Extra legroom: rows 1, 10, 20
// Quiet zone: rows 15-20
// Front rows: rows 1-5

const LEGROOM_ROWS = new Set([1, 10, 20]);
const QUIET_ROWS_MIN = 15;
const FRONT_ROW_MAX = 5;
const COLS = ['A', 'B', 'C', 'D'] as const;

// Pre-occupied seats for realism
const OCCUPIED_SEATS = new Set([
  '1B','1C','2A','2D','3B','4A','4C','5B','5D',
  '6A','6B','7C','7D','8A','9B','9C','10D',
  '11A','11B','12C','13A','13D','14B','14C',
  '15A','16B','17C','17D','18A','19B','20C',
]);

export function generateSeats(): Seat[] {
  const seats: Seat[] = [];
  for (let row = 1; row <= 20; row++) {
    for (const col of COLS) {
      const id = `${row}${col}`;
      const isWindow = col === 'A' || col === 'D';
      const isOccupied = OCCUPIED_SEATS.has(id);

      seats.push({
        id,
        row,
        col,
        type: isWindow ? 'window' : 'aisle',
        hasExtraLegroom: LEGROOM_ROWS.has(row),
        isQuietZone: row >= QUIET_ROWS_MIN,
        isFrontRow: row <= FRONT_ROW_MAX,
        status: isOccupied ? 'occupied' : 'available',
      });
    }
  }
  return seats;
}

export const DEFAULT_SEATS = generateSeats();
