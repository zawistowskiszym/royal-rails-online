import { useMemo, useState } from "react";
import { ArrowRight, Check, CreditCard, TrainFront, X } from "lucide-react";
import { categoryNames, findConnections, type Conn } from "@/lib/timetable";
import { basePrice, classes, concessionAllowed, concessions, eur, fareTypes, passengerPrice, type Concession, type FareType, type TravelClass } from "@/lib/fares";

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
        if ((x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)) return null;
        return v ? <rect key={i} x={x} y={y} width="1" height="1" className="fill-foreground" /> : null;
      })}
      {([[0, 0], [14, 0], [0, 14]] as const).map(([x, y]) => (
        <g key={`${x}${y}`}>
          <rect x={x} y={y} width="7" height="7" className="fill-foreground" />
          <rect x={x + 1} y={y + 1} width="5" height="5" className="fill-background" />
          <rect x={x + 2} y={y + 2} width="3" height="3" className="fill-foreground" />
        </g>
      ))}
    </svg>
  );
}

export function TicketFlow({ from, to, date, onClose }: { from: string; to: string; date: string; onClose: () => void }) {
  const conns = useMemo(() => findConnections(from, to), [from, to]);
  const [step, setStep] = useState<"list" | "details" | "pay" | "done">("list");
  const [sel, setSel] = useState<Conn | null>(null);
  const [cls, setCls] = useState<TravelClass>("standard");
  const [fare, setFare] = useState<FareType>("standard");
  const [pax, setPax] = useState<Concession[]>(["none"]);
  const [docOk, setDocOk] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paying, setPaying] = useState(false);
  const [code] = useState(() => `KK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);

  const allowed = concessionAllowed(fare);
  const effective = pax.map((p) => (allowed ? p : "none"));
  const needsDoc = effective.some((p) => p !== "none");
  const total = sel ? Math.round(effective.reduce((s, p) => s + passengerPrice(sel.km, cls, fare, p), 0) * 100) / 100 : 0;
  const dateLabel = ((s: string) => s.charAt(0).toUpperCase() + s.slice(1))(new Date(date).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" }));
  const input = "w-full rounded-xl bg-secondary px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-primary";
  const chip = (on: boolean) => `rounded-xl border p-3 text-left text-sm font-semibold ${on ? "border-primary bg-primary/10 text-primary" : "border-border"}`;
  const fareInfo = fareTypes.find((f) => f.id === fare)!;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div role="dialog" aria-label="Zakup biletu" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl md:rounded-3xl md:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {step === "list" ? "Wyniki wyszukiwania" : step === "details" ? "Krok 2 z 3 · Szczegóły" : step === "pay" ? "Krok 3 z 3 · Płatność" : "Gotowe"}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{sel?.from ?? from} → {sel?.to ?? to}</h2>
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
          </div>
          <button onClick={onClose} aria-label="Zamknij" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        {step === "list" && (
          <div className="mt-6 space-y-2">
            {conns.length === 0 && (
              <p className="rounded-xl bg-secondary p-6 text-center text-muted-foreground">Brak bezpośrednich połączeń na tej trasie. Sprawdź nazwy stacji, np. „Skuszawyjice Wschodnie” → „Bentach Główny”.</p>
            )}
            {conns.map((c) => {
              const isVelovia = c.category === "vv";
              return (
                <button key={c.train + c.dep} disabled={!isVelovia} onClick={() => { setSel(c); setStep("details"); }} className={`flex w-full items-center gap-4 rounded-2xl border border-border p-4 text-left transition ${isVelovia ? "hover:border-primary" : "cursor-not-allowed opacity-60"}`}>
                  <div className="text-2xl font-extrabold tabular-nums">{c.dep}</div>
                  <div className="flex flex-1 items-center gap-2 text-muted-foreground"><span className="h-px flex-1 bg-border" /><span className="text-xs">{Math.floor(c.mins / 60)} h {c.mins % 60} min · {Math.round(c.km)} km</span><span className="h-px flex-1 bg-border" /></div>
                  <div className="text-2xl font-extrabold tabular-nums">{c.arr}</div>
                  <div className="hidden text-right sm:block">
                    <div className="text-xs text-muted-foreground">{categoryNames[c.category] ?? c.category} {c.train}</div>
                    {isVelovia
                      ? <div className="font-bold text-primary">od {eur(basePrice(c.km, "standard") * 0.7)}</div>
                      : <div className="text-xs font-semibold text-muted-foreground">Sprzedaż wkrótce</div>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === "details" && sel && (
          <div className="mt-6 space-y-5">
            <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4"><TrainFront className="h-5 w-5 text-primary" /><span className="font-semibold">KDP {sel.train}</span><span className="ml-auto tabular-nums">{sel.dep} → {sel.arr} · {Math.round(sel.km)} km</span></div>
            <div>
              <p className="mb-2 text-sm font-semibold">Klasa</p>
              <div className="grid grid-cols-3 gap-2">
                {classes.map((k) => (
                  <button key={k.id} onClick={() => setCls(k.id)} className={chip(cls === k.id)}>{k.label}<div className="mt-1 text-xs font-normal opacity-70">{eur(basePrice(sel.km, k.id))}</div></button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Wariant taryfowy</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {fareTypes.map((f) => (
                  <button key={f.id} onClick={() => setFare(f.id)} className={chip(fare === f.id)}>{f.label}<div className="mt-1 text-xs font-normal opacity-70">{eur(passengerPrice(sel.km, cls, f.id, "none"))}</div></button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Zmiana: {fareInfo.change} · Zwrot: {fareInfo.refund}</p>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Pasażerowie</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPax(pax.slice(0, -1))} disabled={pax.length < 2} className="h-8 w-8 rounded-full bg-secondary font-bold disabled:opacity-40">−</button>
                  <span className="w-5 text-center font-bold">{pax.length}</span>
                  <button onClick={() => setPax([...pax, "none"])} disabled={pax.length > 8} className="h-8 w-8 rounded-full bg-secondary font-bold disabled:opacity-40">+</button>
                </div>
              </div>
              {!allowed && <p className="mb-2 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">Ulgi nie łączą się z ofertami PROMO i innymi promocjami. Wybierz STANDARD lub FLEX, aby skorzystać z ulgi.</p>}
              <div className="space-y-2">
                {pax.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-muted-foreground">Pasażer {i + 1}</span>
                    <select aria-label={`Ulga pasażera ${i + 1}`} disabled={!allowed} value={allowed ? p : "none"} onChange={(e) => setPax(pax.map((x, j) => (j === i ? (e.target.value as Concession) : x)))} className={`${input} py-2 disabled:opacity-50`}>
                      {concessions.map((c) => <option key={c.id} value={c.id}>{c.label}{c.discount ? ` −${Math.round(c.discount * 100)}%` : ""}</option>)}
                    </select>
                    <span className="w-20 text-right text-sm font-semibold tabular-nums">{eur(passengerPrice(sel.km, cls, fare, effective[i]!))}</span>
                  </div>
                ))}
              </div>
              {needsDoc && (
                <label className="mt-3 flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={docOk} onChange={(e) => setDocOk(e.target.checked)} className="mt-1 accent-primary" />
                  Potwierdzam, że pasażerowie korzystający z ulgi posiadają dokument potwierdzający prawo do ulgi i okażą go podczas kontroli.
                </label>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={input} placeholder="Imię i nazwisko" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={input} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-5">
              <button onClick={() => setStep("list")} className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Wróć</button>
              <button disabled={!name.trim() || !/\S+@\S+\.\S+/.test(email) || (needsDoc && !docOk)} onClick={() => setStep("pay")} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-40">
                Dalej · {eur(total)} <ArrowRight className="h-4 w-4" />
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
                <CreditCard className="h-4 w-4" /> {paying ? "Przetwarzanie…" : `Zapłać ${eur(total)}`}
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
                <div className="text-sm opacity-80">{sel.from} → {sel.to}</div>
                <div className="text-sm opacity-80">{dateLabel}</div>
                <div className="text-sm opacity-80">{name} · {pax.length} os. · {classes.find((c) => c.id === cls)!.label} · {fareInfo.label}</div>
                {needsDoc && <div className="text-xs opacity-70">Bilet z ulgą — ważny z dokumentem uprawniającym.</div>}
                <div className="pt-2 text-xs opacity-60">Nr biletu {code} · {eur(total)}</div>
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
