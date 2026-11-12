import raw from "@/data/timetable.json";

type Stop = [string, number, string | null, string | null];
export type Train = { n: string; c: string; s: Stop[] };
export const trains = raw as Train[];

export const categoryNames: Record<string, string> = { vv: "Velovia", ic: "Intercity", kr: "Krukolej", spr: "Sprinter" };
export const categoryCodes: Record<string, string> = { vv: "VV", ic: "IC", kr: "KR", spr: "SPR" };

export const stations = Array.from(new Set(trains.flatMap((t) => t.s.map((s) => s[0])))).sort((a, b) => a.localeCompare(b, "pl"));
export const allSkuszawyjiceStations = "Skuszawyjice — wszystkie stacje";

export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").trim();
const toMin = (t: string) => { const [h = 0, m = 0] = t.split(":").map(Number); return h * 60 + m; };

export type Conn = { train: string; category: string; from: string; to: string; dep: string; arr: string; mins: number; km: number; legs?: Conn[]; change?: string; wait?: number };

const match = (name: string, q: string) => norm(q) === norm(allSkuszawyjiceStations) ? norm(name).startsWith(norm("Skuszawyjice ")) : norm(name) === norm(q) || norm(name).includes(norm(q));

export function findConnections(from: string, to: string): Conn[] {
  if (!from.trim() || !to.trim()) return [];
  const searchAllSkuszawyjiceStations = norm(from) === norm(allSkuszawyjiceStations);
  const skuszawyjicePrefix = norm("Skuszawyjice ");
  const out: Conn[] = [];
  for (const t of trains) {
    const i = t.s.findIndex((s) => s[3] && (searchAllSkuszawyjiceStations
      ? norm(s[0]).startsWith(skuszawyjicePrefix)
      : match(s[0], from)));
    if (i < 0) continue;
    const j = t.s.findIndex((s, k) => k > i && s[2] && match(s[0], to));
    if (j < 0) continue;
    const a = t.s[i]!, b = t.s[j]!;
    out.push({
      train: t.n, category: t.c, from: a[0], to: b[0], dep: a[3]!, arr: b[2]!,
      mins: (toMin(b[2]!) - toMin(a[3]!) + 1440) % 1440,
      km: Math.round((b[1] - a[1]) * 10) / 10,
    });
  }
  return out.sort((x, y) => x.dep.localeCompare(y.dep));
}

/** Połączenia z jedną przesiadką (min. 5 min, maks. 3 h oczekiwania). */
export function findTransfers(from: string, to: string, minChange = 5, maxWait = 180): Conn[] {
  if (!from.trim() || !to.trim()) return [];
  const all = norm(from) === norm(allSkuszawyjiceStations);
  const isFrom = (n: string) => (all ? norm(n).startsWith(norm("Skuszawyjice ")) : match(n, from));
  // pociągi dojeżdżające do celu: stacja przesiadki -> [pociąg, idx stacji, idx celu]
  const toDest = new Map<string, [Train, number, number][]>();
  for (const u of trains) {
    const j = u.s.findIndex((s) => s[2] && match(s[0], to));
    if (j < 0) continue;
    for (let p = 0; p < j; p++) if (u.s[p]![3]) {
      const k = u.s[p]![0];
      if (!toDest.has(k)) toDest.set(k, []);
      toDest.get(k)!.push([u, p, j]);
    }
  }
  const best = new Map<string, Conn>();
  for (const t of trains) {
    const i = t.s.findIndex((s) => s[3] && isFrom(s[0]));
    if (i < 0 || t.s.some((s, k) => k > i && match(s[0], to))) continue;
    for (let k = i + 1; k < t.s.length; k++) {
      const x = t.s[k]!;
      if (!x[2]) continue;
      for (const [u, p, j] of toDest.get(x[0]) ?? []) {
        if (u.n === t.n || isFrom(u.s[p]![0])) continue;
        const wait = toMin(u.s[p]![3]!) - toMin(x[2]);
        if (wait < minChange || wait > maxWait) continue;
        const a = t.s[i]!, b = u.s[j]!, y = u.s[p]!;
        const leg1: Conn = { train: t.n, category: t.c, from: a[0], to: x[0], dep: a[3]!, arr: x[2], mins: toMin(x[2]) - toMin(a[3]!), km: Math.round((x[1] - a[1]) * 10) / 10 };
        const leg2: Conn = { train: u.n, category: u.c, from: y[0], to: b[0], dep: y[3]!, arr: b[2]!, mins: toMin(b[2]!) - toMin(y[3]!), km: Math.round((b[1] - y[1]) * 10) / 10 };
        const c: Conn = {
          train: `${t.n} + ${u.n}`, category: t.c === "vv" && u.c === "vv" ? "vv" : t.c === u.c ? t.c : "mix",
          from: a[0], to: b[0], dep: a[3]!, arr: b[2]!, mins: toMin(b[2]!) - toMin(a[3]!),
          km: Math.round((leg1.km + leg2.km) * 10) / 10, legs: [leg1, leg2], change: x[0], wait,
        };
        if (c.mins <= 0) continue;
        const key = t.n + "|" + u.n;
        const prev = best.get(key);
        if (!prev || c.mins < prev.mins) best.set(key, c);
      }
    }
  }
  // odrzuć warianty gorsze: ten sam odjazd, a później przyjazd
  const list = [...best.values()].sort((x, y) => x.dep.localeCompare(y.dep) || x.arr.localeCompare(y.arr));
  return list.filter((c, idx) => !list.some((o, oi) => oi !== idx && o.dep >= c.dep && o.arr <= c.arr && (o.dep > c.dep || o.arr < c.arr)));
}

export type BoardRow = { time: string; train: string; category: string; to: string; via: string };

export type StopInfo = { station: string; km: number; arr: string | null; dep: string | null };

/** Pełna trasa pociągu — wszystkie stacje z godzinami przyjazdu/odjazdu. */
export function trainRoute(trainName: string): StopInfo[] {
  const t = trains.find((x) => x.n === trainName);
  if (!t) return [];
  return t.s.map((s) => ({ station: s[0], km: s[1], arr: s[2], dep: s[3] }));
}

/** Najszybsze i najkrótsze połączenie Velovia między stacjami (do kart tras). */
export function veloviaRoute(from: string, to: string): { km: number; mins: number } | null {
  const cs = findConnections(from, to).filter((c) => c.category === "vv");
  if (!cs.length) return null;
  return { km: Math.min(...cs.map((c) => c.km)), mins: Math.min(...cs.map((c) => c.mins)) };
}

export function departuresFrom(station: string): BoardRow[] {
  const rows: BoardRow[] = [];
  for (const t of trains) {
    const i = t.s.findIndex((s) => s[0] === station);
    const here = t.s[i];
    if (!here || !here[3] || i === t.s.length - 1) continue;
    const rest = t.s.slice(i + 1);
    const mid = rest.slice(0, -1);
    const pick = (mid.length > 3 ? [mid[0], mid[Math.floor(mid.length / 2)], mid[mid.length - 1]] : mid).filter((s): s is Stop => !!s);
    rows.push({ time: here[3], train: t.n, category: t.c, to: rest[rest.length - 1]![0], via: pick.map((s) => `${s[0]} ${s[2]}`).join(" · ") });
  }
  return rows.sort((a, b) => a.time.localeCompare(b.time));
}
