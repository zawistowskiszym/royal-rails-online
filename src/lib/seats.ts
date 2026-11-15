import type { TravelClass } from "@/lib/fares";

export type VeloviaCoach = {
  number: number;
  travelClass: TravelClass;
  rows: number;
  letters: readonly string[];
};

/** Demonstracyjny układ ośmioczłonowego składu Siemens Velaro. */
export const veloviaCoaches: readonly VeloviaCoach[] = [
  { number: 1, travelClass: "business", rows: 8, letters: ["A", "B", "C"] },
  { number: 2, travelClass: "premiere", rows: 12, letters: ["A", "B", "C"] },
  { number: 3, travelClass: "premiere", rows: 12, letters: ["A", "B", "C"] },
  ...Array.from({ length: 5 }, (_, index) => ({
    number: index + 4,
    travelClass: "standard" as const,
    rows: 16,
    letters: ["A", "B", "C", "D"] as const,
  })),
];

export type VeloviaSeat = {
  id: string;
  coach: number;
  row: number;
  letter: string;
  travelClass: TravelClass;
  window: boolean;
};

export function seatsInCoach(coach: VeloviaCoach): VeloviaSeat[] {
  return Array.from({ length: coach.rows }, (_, rowIndex) =>
    coach.letters.map((letter, letterIndex) => ({
      id: `${coach.number}-${rowIndex + 1}${letter}`,
      coach: coach.number,
      row: rowIndex + 1,
      letter,
      travelClass: coach.travelClass,
      window: letterIndex === 0 || letterIndex === coach.letters.length - 1,
    })),
  ).flat();
}

function hash(value: string): number {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

/** Stała, symulowana dostępność dla danego pociągu i dnia. */
export function isSeatOccupied(train: string, date: string, seatId: string): boolean {
  return hash(`${train}|${date}|${seatId}`) % 100 < 27;
}

export function occupiedSeats(train: string, date: string): Set<string> {
  return new Set(
    veloviaCoaches
      .flatMap(seatsInCoach)
      .filter((seat) => isSeatOccupied(train, date, seat.id))
      .map((seat) => seat.id),
  );
}

/** Miejsce już przypisane zostaje zwolnione; wolne trafia do wskazanego pasażera. */
export function assignSeat(selections: readonly (string | null)[], passengerIndex: number, seatId: string): (string | null)[] {
  const next = [...selections];
  const assignedTo = next.indexOf(seatId);
  if (assignedTo >= 0) {
    next[assignedTo] = null;
    return next;
  }
  next[passengerIndex] = seatId;
  return next;
}

export function seatLabel(seatId: string): string {
  const separator = seatId.indexOf("-");
  return `wagon ${seatId.slice(0, separator)} · miejsce ${seatId.slice(separator + 1)}`;
}
