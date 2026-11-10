import raw from "@/data/timetable.json";

type Stop = [string, number, string | null, string | null];
export type Train = { n: string; c: string; s: Stop[] };
export const trains = raw as Train[];

export const categoryNames: Record<string, string> = { vv: "Velovia", ic: "Intercity", kr: "Krukolej", spr: "Sprinter" };
export const categoryCodes: Record<string, string> = { vv: "VV", ic: "IC", kr: "KR", spr: "SPR" };

export const stations = Array.from(new Set(trains.flatMap((t) => t.s.map((s) => s[0])))).sort((a, b) => a.localeCompare(b, "pl"));

export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").trim();
const toMin = (t: string) => { const [h = 0, m = 0] = t.split(":").map(Number); return h * 60 + m; };

export type Conn = { train: string; category: string; from: string; to: string; dep: string; arr: string; mins: number; km: number };

const match = (name: string, q: string) => norm(name) === norm(q) || norm(name).includes(norm(q));

export function findConnections(from: string, to: string): Conn[] {
  if (!from.trim() || !to.trim()) return [];
  const out: Conn[] = [];
  for (const t of trains) {
    const i = t.s.findIndex((s) => s[3] && match(s[0], from));
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

export type BoardRow = { time: string; train: string; category: string; to: string; via: string };

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
