import type { TravelClass } from "@/lib/fares";

/** Slots run from one window, across the aisle, to the opposite window. */
export type SeatColumn = { numbers: readonly (number | null)[]; tableBefore?: boolean };
export type VeloviaCoach = {
  number: number;
  travelClass: TravelClass;
  layout: "2+1" | "2+2";
  columns: readonly SeatColumn[];
  facilities: readonly ("cab" | "wc" | "bistro" | "accessible" | "bikes" | "luggage")[];
};
const column = (numbers: readonly (number | null)[], tableBefore = false): SeatColumn => ({ numbers, tableBefore });
const firstClass = (cab = false): SeatColumn[] => [
  column([13, 12, null, 11]), column([16, 15, null, 14], true),
  column([23, 22, null, 21]), column([26, 25, null, 24], true),
  column([33, 32, null, 31]), column([36, 35, null, 34], true),
  column([43, 42, null, 41]), column([53, 52, null, 51], true),
  column([56, 55, null, 54]), column([63, 62, null, 61], true),
  ...(!cab ? [column([66, 65, null, 64])] : []),
  column([73, 72, null, 71]), column([76, 75, null, 74], true),
  column([83, 82, null, 81]), column([86, 85, null, 84], true),
  column([93, 92, null, 91]), column([96, 95, null, 94], true),
];
const standard: SeatColumn[] = [
  column([14, 13, 12, 11]), column([18, 17, 16, 15]),
  column([24, 23, 22, 21]), column([28, 27, 26, 25], true),
  column([34, 33, 32, 31]), column([38, 37, 36, 35]),
  column([44, 43, 42, 41], true), column([48, 47, 46, 45]),
  column([54, 53, 52, 51]), column([58, 57, 56, 55]),
  column([null, null, 62, 61]), column([68, 67, 66, 65]),
  column([74, 73, 72, 71]), column([78, 77, 76, 75]),
  column([84, 83, 82, 81]), column([88, 87, 86, 85], true),
  column([94, 93, 92, 91]), column([98, 97, 96, 95]),
  column([104, 103, 102, 101]), column([null, null, 106, 105]),
];
/** Simplified reference layouts; repeated intermediate Standard coaches complete the eight-car train. */
export const veloviaCoaches: readonly VeloviaCoach[] = [
  { number: 1, travelClass: "business", layout: "2+1", columns: firstClass(true), facilities: ["cab", "luggage"] },
  { number: 2, travelClass: "premiere", layout: "2+1", columns: firstClass(), facilities: ["wc", "luggage"] },
  { number: 3, travelClass: "premiere", layout: "2+2", columns: [
    column([14, 13, 12, 11]), column([24, 23, 22, 21], true),
    column([28, 27, 26, 25]), column([34, 33, 32, 31], true),
    column([38, 37, 36, 35]), column([44, 43, null, 41]),
  ], facilities: ["wc", "bistro"] },
  { number: 4, travelClass: "standard", layout: "2+2", columns: [
    column([15, 14, null, null]), column([13, 12, 11, null], true),
    column([34, 33, null, 31]), column([38, 37, null, null]),
    column([44, 43, 42, 41]), column([48, 47, 46, 45]),
    column([54, 53, 52, 51]), column([64, 63, 62, 61], true),
    column([68, 67, 66, 65]), column([74, 73, 72, 71], true),
    column([78, 77, 76, 75], true),
  ], facilities: ["accessible", "wc", "luggage"] },
  ...[5, 6, 7].map((number): VeloviaCoach => ({ number, travelClass: "standard", layout: "2+2", columns: standard, facilities: ["wc", "luggage"] })),
  { number: 8, travelClass: "standard", layout: "2+2", columns: [
    column([14, null, 12, 11]), column([24, 23, 22, 21]),
    column([28, 27, 26, 25], true), column([34, 33, 32, 31]),
    column([44, 43, 42, 41]), column([48, 47, 46, 45]),
    column([54, 53, 52, 51]), column([58, 57, 56, 55]),
    column([64, 63, 62, 61]), column([68, 67, 66, 65]),
    column([74, 73, 72, 71]), column([78, 77, 76, 75]),
    column([84, 83, 82, 81]),
  ], facilities: ["cab", "bikes", "luggage"] },
];

export type VeloviaSeat = {
  id: string;
  coach: number;
  number: number;
  column: number;
  slot: number;
  travelClass: TravelClass;
  window: boolean;
  table: boolean;
};
export function seatsInCoach(coach: VeloviaCoach): VeloviaSeat[] {
  return coach.columns.flatMap((item, columnIndex) => item.numbers.flatMap((number, slot) => {
    if (number === null) return [];
    return [{ id: `${coach.number}-${number}`, coach: coach.number, number, column: columnIndex, slot,
      travelClass: coach.travelClass, window: slot === 0 || slot === 3,
      table: Boolean(item.tableBefore || coach.columns[columnIndex + 1]?.tableBefore) }];
  }));
}
function hash(value: string): number {
  let result = 2166136261;
  for (const character of value) { result ^= character.charCodeAt(0); result = Math.imul(result, 16777619); }
  return result >>> 0;
}
/** Demonstration only: no live inventory or reservation is implied. */
export function isSeatOccupied(train: string, date: string, seatId: string): boolean {
  return hash(`${train}|${date}|${seatId}`) % 100 < 27;
}
export function occupiedSeats(train: string, date: string): Set<string> {
  const occupied = new Set(veloviaCoaches.flatMap(seatsInCoach).filter((seat) => isSeatOccupied(train, date, seat.id)).map((seat) => seat.id));
  if (typeof window === "undefined") return occupied;
  try {
    const records: unknown = JSON.parse(window.localStorage.getItem("kk-demo-tickets") ?? "[]");
    if (!Array.isArray(records)) return occupied;
    for (const record of records) {
      if (!record || typeof record !== "object") continue;
      const ticket = record as { train?: unknown; date?: unknown; status?: unknown; seatIds?: unknown };
      if (ticket.train !== train || ticket.date !== date || ticket.status !== "active" || !Array.isArray(ticket.seatIds)) continue;
      for (const seatId of ticket.seatIds) if (typeof seatId === "string") occupied.add(seatId);
    }
  } catch { /* Stored reservations are optional in the demo. */ }
  return occupied;
}
export function assignSeat(selections: readonly (string | null)[], passengerIndex: number, seatId: string): (string | null)[] {
  const next = [...selections];
  if (passengerIndex < 0 || passengerIndex >= next.length) return next;
  const assignedTo = next.indexOf(seatId);
  if (assignedTo >= 0) { next[assignedTo] = null; return next; }
  next[passengerIndex] = seatId;
  return next;
}
export function seatLabel(seatId: string): string {
  const separator = seatId.indexOf("-");
  return `wagon ${seatId.slice(0, separator)} · miejsce ${seatId.slice(separator + 1)}`;
}
