import { useMemo, useState } from "react";
import { ArrowRight, Check, CreditCard, TrainFront, X } from "lucide-react";

export type Dep = { time: string; train: string; to: string; via: string; arrival: string };
type Conn = { train: string; dep: string; arr: string; to: string; mins: number; price: number };

const ORIGIN = "Skuszawyjice Wschodnie";
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

function findConnections(deps: Dep[], from: string, to: string): Conn[] {
  if (from && !norm(ORIGIN).includes(norm(from))) return [];
  const q = norm(to);
  const out: Conn[] = [];
  for (const d of deps) {
    const stops = [
      ...d.via.split(" · ").map((s) => { const i = s.lastIndexOf(" "); return { name: s.slice(0, i), time: s.slice(i + 1) }; }),
      { name: d.to, time: d.arrival },
    ];
    const stop = q ? stops.find((s) => norm(s.name).includes(q)) : stops[stops.length - 1];
    if (!stop) continue;
    const mins = (toMin(stop.time) - toMin(d.time) + 1440) % 1440;
    out.push({ train: d.train, dep: d.time, arr: stop.time, to: stop.name, mins, price: Math.round(6 + mins * 0.17) });
  }
  return out.sort((a, b) => a.dep.localeCompare(b.dep));
}

const fares = [
  { id: "normal", label: "Normalny", factor: 1 },
  { id: "student", label: "Studencki −51%", factor: 0.49 },
  { id: "senior", label: "Senior −30%", factor: 0.7 },
];

function FakeQR({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return Array.from({ length: 441 }, () => { h = (h * 1103515245 + 12345) >>> 0; return (h >> 16) & 1; });
  }, [seed]);
  return (
    <svg viewBox="0 0 21 21" className="h-40 w-40" shapeRendering="crispEdges">
      <rect width="21" height="21" className="fill-background" />
      {cells.map((v, i) => {
        const x = i % 21, y = Math.floor(i / 21);
        const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
        if (finder) return null;
        return v ? <rect key={i} x={x} y={y} width="1" height="1" className="fill-foreground" /> : null;
      })}
      {[[0, 0], [14, 0], [0, 14]].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <rect x={x} y={y} width="7" height="7" className="fill-foreground" />
          <rect x={x + 1} y={y + 1} width="5" height="5" className="fill-background" />
          <rect x={x + 2} y={y + 2} width="3" height="3" className="fill-foreground" />
        </g>
      ))}
    </svg>
  );
}

export function TicketFlow({ deps, from, to, date, onClose }: { deps: Dep[]; from: string; to: string; date: string; onClose: () => void }) {
  const conns = useMemo(() => findConnections(deps, from, to), [deps, from, to]);
  const [step, setStep] = useState<"list" | "details" | "pay" | "done">("list");
  const [sel, setSel] = useState<Conn | null>(null);
  const [cls, setCls] = useState<1 | 2>(2);
  const [fare, setFare] = useState("normal");
  const [count, setCount] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paying, setPaying] = useState(false);
  const [code] = useState(() => `KK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);

  const total = sel ? Math.round(sel.price * (cls === 1 ? 1.5 : 1) * (fares.find((f) => f.id === fare)!.factor) * count * 100) / 100 : 0;
  const zl = (n: number) => n.toFixed(2).replace(".", ",") + " zł";
  const dateLabel = ((s: string) => s[0].toUpperCase() + s.slice(1))(new Date(date).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" }));
  const input = "w-full rounded-xl bg-secondary px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div role="dialog" aria-label="Zakup biletu" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl md:rounded-3xl md:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {step === "list" ? "Wyniki wyszukiwania" : step === "details" ? "Krok 2 z 3 · Szczegóły" : step === "pay" ? "Krok 3 z 3 · Płatność" : "Gotowe"}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{ORIGIN} → {sel?.to ?? (to || "wszystkie kierunki")}</h2>
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
          </div>
          <button onClick={onClose} aria-label="Zamknij" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        {step === "list" && (
          <div className="mt-6 space-y-2">
            {conns.length === 0 && (
              <p className="rounded-xl bg-secondary p-6 text-center text-muted-foreground">Brak połączeń. Odjazdy prowadzą ze stacji {ORIGIN} — spróbuj np. „Bentach”, „Utroch” lub „Helonki”.</p>
            )}
            {conns.map((c) => (
              <button key={c.train + c.dep} onClick={() => { setSel(c); setStep("details"); }} className="flex w-full items-center gap-4 rounded-2xl border border-border p-4 text-left transition hover:border-primary">
                <div className="text-2xl font-extrabold tabular-nums">{c.dep}</div>
                <div className="flex flex-1 items-center gap-2 text-muted-foreground"><span className="h-px flex-1 bg-border" /><span className="text-xs">{Math.floor(c.mins / 60)} h {c.mins % 60} min</span><span className="h-px flex-1 bg-border" /></div>
                <div className="text-2xl font-extrabold tabular-nums">{c.arr}</div>
                <div className="hidden text-right sm:block"><div className="text-xs text-muted-foreground">KDP {c.train}</div><div className="font-bold text-primary">{zl(c.price)}</div></div>
              </button>
            ))}
          </div>
        )}

        {step === "details" && sel && (
          <div className="mt-6 space-y-5">
            <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4"><TrainFront className="h-5 w-5 text-primary" /><span className="font-semibold">KDP {sel.train}</span><span className="ml-auto tabular-nums">{sel.dep} → {sel.arr}</span></div>
            <div>
              <p className="mb-2 text-sm font-semibold">Klasa</p>
              <div className="grid grid-cols-2 gap-2">
                {([2, 1] as const).map((k) => (
                  <button key={k} onClick={() => setCls(k)} className={`rounded-xl border p-3 font-semibold ${cls === k ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>Klasa {k}{k === 1 && " (+50%)"}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Taryfa</p>
              <div className="grid grid-cols-3 gap-2">
                {fares.map((f) => (
                  <button key={f.id} onClick={() => setFare(f.id)} className={`rounded-xl border p-3 text-sm font-semibold ${fare === f.id ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{f.label}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Liczba pasażerów</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setCount(Math.max(1, count - 1))} className="h-9 w-9 rounded-full bg-secondary font-bold">−</button>
                <span className="w-6 text-center font-bold">{count}</span>
                <button onClick={() => setCount(Math.min(9, count + 1))} className="h-9 w-9 rounded-full bg-secondary font-bold">+</button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={input} placeholder="Imię i nazwisko" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={input} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-5">
              <button onClick={() => setStep("list")} className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Wróć</button>
              <button disabled={!name.trim() || !/\S+@\S+\.\S+/.test(email)} onClick={() => setStep("pay")} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-40">
                Dalej · {zl(total)} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === "pay" && sel && (
          <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); setPaying(true); setTimeout(() => { setPaying(false); setStep("done"); }, 1200); }}>
            <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">Płatność pokazowa — żadne pieniądze nie zostaną pobrane.</p>
            <input className={input} placeholder="Numer karty" defaultValue="4242 4242 4242 4242" required />
            <div className="grid grid-cols-2 gap-2">
              <input className={input} placeholder="MM/RR" defaultValue="12/29" required />
              <input className={input} placeholder="CVC" defaultValue="123" required />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-5">
              <button type="button" onClick={() => setStep("details")} className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Wróć</button>
              <button disabled={paying} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-60">
                <CreditCard className="h-4 w-4" /> {paying ? "Przetwarzanie…" : `Zapłać ${zl(total)}`}
              </button>
            </div>
          </form>
        )}

        {step === "done" && sel && (
          <div className="mt-6">
            <div className="flex items-center gap-2 font-semibold text-primary"><Check className="h-5 w-5" /> Bilet kupiony</div>
            <div className="mt-4 grid gap-6 rounded-2xl bg-ink p-6 text-ink-foreground sm:grid-cols-[1fr_auto]">
              <div className="space-y-3">
                <div className="flex items-center gap-2"><span className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">KDP</span><span className="font-semibold">Velovia {sel.train}</span></div>
                <div className="text-3xl font-extrabold tabular-nums">{sel.dep} → {sel.arr}</div>
                <div className="text-sm opacity-80">{ORIGIN} → {sel.to}</div>
                <div className="text-sm opacity-80">{dateLabel}</div>
                <div className="text-sm opacity-80">{name} · {count} os. · klasa {cls} · {fares.find((f) => f.id === fare)!.label}</div>
                <div className="pt-2 text-xs opacity-60">Nr biletu {code} · {zl(total)}</div>
              </div>
              <div className="rounded-xl bg-background p-2"><FakeQR seed={code} /></div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Bilet pokazowy — w prawdziwej wersji trafiłby na {email}.</p>
            <button onClick={onClose} className="mt-5 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">Zamknij</button>
          </div>
        )}
      </div>
    </div>
  );
}
