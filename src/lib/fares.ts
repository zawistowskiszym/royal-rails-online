// Cennik Velovia (ceny bazowe w EUR, jedna osoba dorosła, w jedną stronę)
export type TravelClass = "standard" | "premiere" | "business";
export const classes: { id: TravelClass; label: string }[] = [
  { id: "standard", label: "Standard" },
  { id: "premiere", label: "Première" },
  { id: "business", label: "Business Première" },
];

const table: [maxKm: number, standard: number, premiere: number, business: number][] = [
  [150, 19.9, 29.9, 44.9],
  [250, 29.9, 39.9, 54.9],
  [350, 39.9, 54.9, 74.9],
  [450, 49.9, 64.9, 84.9],
  [600, 59.9, 79.9, 104.9],
  [800, 74.9, 94.9, 124.9],
  [1000, 89.9, 114.9, 149.9],
];

export function basePrice(km: number, cls: TravelClass): number {
  const row = table.find((r) => Math.ceil(km) <= r[0]) ?? table[table.length - 1];
  return row[cls === "standard" ? 1 : cls === "premiere" ? 2 : 3];
}

export type FareType = "promo" | "saver" | "standard" | "flex";
export const fareTypes: { id: FareType; label: string; mult: number; change: string; refund: string; promo: boolean }[] = [
  { id: "promo", label: "PROMO", mult: 0.7, change: "Niedostępna", refund: "Niedostępny", promo: true },
  { id: "saver", label: "SAVER", mult: 0.85, change: "Za opłatą", refund: "Za opłatą", promo: true },
  { id: "standard", label: "STANDARD", mult: 1, change: "Bezpłatnie do 7 dni przed odjazdem", refund: "Bezpłatnie do 7 dni przed odjazdem", promo: false },
  { id: "flex", label: "FLEX", mult: 1.2, change: "Bezpłatnie do 30 min przed odjazdem", refund: "Bezpłatnie do 30 min przed odjazdem", promo: false },
];

export type Concession = "none" | "child4" | "child12" | "youth" | "student" | "senior" | "disabled" | "carer";
export const concessions: { id: Concession; label: string; discount: number }[] = [
  { id: "none", label: "Dorosły (bez ulgi)", discount: 0 },
  { id: "child4", label: "Dziecko do 4 lat", discount: 1 },
  { id: "child12", label: "Dziecko 4–12 lat", discount: 0.5 },
  { id: "youth", label: "Młodzież 12–18 lat", discount: 0.3 },
  { id: "student", label: "Student do 26 lat", discount: 0.3 },
  { id: "senior", label: "Senior 65+", discount: 0.2 },
  { id: "disabled", label: "Osoba z niepełnosprawnością", discount: 0.37 },
  { id: "carer", label: "Opiekun osoby z niepełnosprawnością", discount: 0.5 },
];

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Ulgi nie łączą się z PROMO ani innymi promocjami (SAVER). */
export function concessionAllowed(fare: FareType) {
  return !fareTypes.find((f) => f.id === fare)!.promo;
}

export function passengerPrice(km: number, cls: TravelClass, fare: FareType, concession: Concession): number {
  const ticket = basePrice(km, cls) * fareTypes.find((f) => f.id === fare)!.mult;
  const c = concessionAllowed(fare) ? concessions.find((x) => x.id === concession)!.discount : 0;
  return r2(ticket * (1 - c));
}

export const eur = (n: number) => n.toFixed(2).replace(".", ",") + " €";
