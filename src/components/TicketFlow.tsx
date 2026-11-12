import { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronDown, CreditCard, TrainFront, X } from "lucide-react";
import { categoryCodes, categoryNames, findConnections, findTransfers, trainRoute, type Conn } from "@/lib/timetable";
import { categoryBasePrice, classes, concessionAllowed, concessions, eur, faresFor, passengerPrice, type Concession, type FareType, type TrainCategory, type TravelClass } from "@/lib/fares";

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

export function TicketFlow({ from, to, date, time = "00:00", onClose, page = false, passengers = 1, carriers = ["vv", "ic", "spr"], title }: { from: string; to: string; date: string; time?: string; onClose: () => void; page?: boolean; passengers?: number; carriers?: string[]; title?: string | undefined }) {
  const conns = useMemo(() => [...findConnections(from, to), ...findTransfers(from, to)].filter((c) => c.dep >= time && (c.legs ? c.legs.every((l) => carriers.includes(l.category)) : carriers.includes(c.category))).sort((a, b) => a.dep.localeCompare(b.dep) || a.mins - b.mins), [from, to, time, carriers.join()]);
  const [step, setStep] = useState<"list" | "details" | "pay" | "done">("list");
  const [sel, setSel] = useState<Conn | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cls, setCls] = useState<TravelClass>("standard");
  const [sortBy, setSortBy] = useState<"dep" | "mins" | "price">("dep");
  const [listCls, setListCls] = useState<TravelClass>("standard");
  const [listFare, setListFare] = useState<FareType>("standard");
  const fitFor = (cat: string) => ({
    c: (cat !== "vv" && listCls === "business" ? "premiere" : listCls) as TravelClass,
    f: (faresFor(cat as TrainCategory).some((x) => x.id === listFare) ? listFare : "standard") as FareType,
  });
  const priceOf = (c: Conn): number | null => {
    const parts = c.legs ?? [c];
    if (!parts.every((l) => ["vv", "ic", "spr"].includes(l.category))) return null;
    return Math.round(parts.reduce((sum, l) => { const { c: k, f } = fitFor(l.category); return sum + passengerPrice(l.km, k, f, "none", l.category as TrainCategory); }, 0) * passengers * 100) / 100;
  };
  const sorted = [...conns].sort((a, b) => sortBy === "dep" ? a.dep.localeCompare(b.dep) : sortBy === "mins" ? a.mins - b.mins : (priceOf(a) ?? 1e9) - (priceOf(b) ?? 1e9));
  const [fare, setFare] = useState<FareType>("standard");
  const [pax, setPax] = useState<Concession[]>(() => Array.from({ length: Math.max(1, Math.min(8, passengers)) }, () => "none" as Concession));
  const [docOk, setDocOk] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paying, setPaying] = useState(false);
  const [code] = useState(() => `KK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`);

  const category = (sel?.category ?? "vv") as TrainCategory;
  const availableClasses = classes.filter((k) => category === "vv" || k.id !== "business");
  const availableFares = faresFor(category);
  const classLabel = (id: TravelClass) => category === "ic"
    ? id === "standard" ? "2. klasa" : "1. klasa"
    : classes.find((k) => k.id === id)!.label;
  const allowed = concessionAllowed(fare, category);
  const effective = pax.map((p) => (allowed ? p : "none"));
  const needsDoc = effective.some((p) => p !== "none");
  const total = sel ? Math.round(effective.reduce((s, p) => s + passengerPrice(sel.km, cls, fare, p, category), 0) * 100) / 100 : 0;
  const dateLabel = ((s: string) => s.charAt(0).toUpperCase() + s.slice(1))(new Date(date).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" }));
  const input = "w-full rounded-xl bg-secondary px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-primary";
  const chip = (on: boolean) => `rounded-xl border p-3 text-left text-sm font-semibold ${on ? "border-primary bg-primary/10 text-primary" : "border-border"}`;
  const fareInfo = availableFares.find((f) => f.id === fare) ?? availableFares[0]!;

  return (
    <div className={page ? "mx-auto max-w-6xl px-5 py-10" : "fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm md:items-center"} onClick={page ? undefined : onClose}>
      <div role={page ? "main" : "dialog"} aria-label="Zakup biletu" className={page ? "w-full rounded-3xl border border-border bg-card p-6 md:p-8" : "max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl md:rounded-3xl md:p-8"} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {step === "list" ? (title ?? "Wyniki wyszukiwania") : step === "details" ? "Krok 2 z 3 · Szczegóły" : step === "pay" ? "Krok 3 z 3 · Płatność" : "Gotowe"}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{sel?.from ?? from} → {sel?.to ?? to}</h2>
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
          </div>
          <button onClick={onClose} aria-label="Zamknij" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        {step === "list" && (
          <div className="mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Połączenia</p>
                <p className="mt-1 text-lg font-bold">{conns.length} {conns.length === 1 ? "połączenie" : conns.length > 1 && conns.length < 5 ? "połączenia" : "połączeń"}</p>
              </div>
              <p className="text-sm text-muted-foreground">{passengers} {passengers === 1 ? "pasażer" : "pasażerów"} · ceny łączne w EUR</p>
            </div>
            <div className="mb-4 grid gap-4 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sortuj po</p>
                <div className="flex flex-wrap gap-2">
                  {([["dep", "Godzinie"], ["mins", "Czasie przejazdu"], ["price", "Cenie"]] as const).map(([id, l]) => (
                    <button key={id} onClick={() => setSortBy(id)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${sortBy === id ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">Klasa
                  <select aria-label="Klasa" value={listCls} onChange={(e) => setListCls(e.target.value as TravelClass)} className="min-w-36 rounded-xl bg-secondary px-3 py-2 text-sm text-foreground">
                    {classes.map((k) => <option key={k.id} value={k.id}>{k.id === "standard" ? "2. klasa / Standard" : k.id === "premiere" ? "1. klasa / Première" : k.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">Taryfa
                  <select aria-label="Taryfa" value={listFare} onChange={(e) => setListFare(e.target.value as FareType)} className="min-w-32 rounded-xl bg-secondary px-3 py-2 text-sm text-foreground">
                    {faresFor("vv").map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </label>
              </div>
            </div>
            {conns.length === 0 && (
              <p className="rounded-xl bg-secondary p-6 text-center text-muted-foreground">Brak połączeń na tej trasie (także z przesiadką). Sprawdź nazwy stacji, np. „Skuszawyjice Wschodnie” → „Bentach Główny”.</p>
            )}
            {sorted.map((c) => {
              const isVelovia = c.category === "vv";
              const ticketable = !c.legs && ["vv", "ic", "spr"].includes(c.category);
              const key = `${c.train}-${c.dep}-${c.from}`;
              const isOpen = expanded === key;
              const price = priceOf(c);
              const fit = fitFor(c.legs ? "vv" : c.category);
              const serviceLabel = c.legs
                ? c.legs.map((l) => `${categoryNames[l.category] ?? l.category} ${l.train}`).join(" → ")
                : `${categoryNames[c.category] ?? c.category} ${c.train}`;
              const selectedClassLabel = c.category === "ic"
                ? fit.c === "standard" ? "2. klasa" : "1. klasa"
                : classes.find((k) => k.id === fit.c)!.label;
              return (
                <article key={key} className={`overflow-hidden rounded-2xl border bg-card transition ${isOpen ? "border-primary shadow-md" : "border-border hover:border-primary/50 hover:shadow-sm"}`}>
                  <div className="grid md:grid-cols-[minmax(0,1fr)_190px]">
                    <div className="min-w-0 p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${isVelovia ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>{serviceLabel}</span>
                        <span className="text-xs font-medium text-muted-foreground">{Math.round(c.km)} km</span>
                      </div>
                      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(72px,0.6fr)_minmax(0,1fr)] items-center gap-2 sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-2xl font-extrabold tabular-nums sm:text-3xl">{c.dep}</p>
                          <p className="mt-1 truncate text-sm font-semibold" title={c.from}>{c.from}</p>
                          <p className="text-[11px] text-muted-foreground">Odjazd</p>
                        </div>
                        <div className="min-w-0 text-center">
                          <p className="text-xs font-semibold text-muted-foreground">{Math.floor(c.mins / 60)} h {String(c.mins % 60).padStart(2, "0")} min</p>
                          <div className="relative my-2 flex items-center">
                            <span className="h-2 w-2 rounded-full border-2 border-primary bg-background" />
                            <span className="h-px flex-1 bg-primary/40" />
                            <TrainFront className="mx-1 h-4 w-4 shrink-0 text-primary" />
                            <span className="h-px flex-1 bg-primary/40" />
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <p className="truncate text-[11px] font-semibold text-muted-foreground">{c.legs ? `${c.change} · ${c.wait} min` : "Bez przesiadek"}</p>
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="text-2xl font-extrabold tabular-nums sm:text-3xl">{c.arr}</p>
                          <p className="mt-1 truncate text-sm font-semibold" title={c.to}>{c.to}</p>
                          <p className="text-[11px] text-muted-foreground">Przyjazd</p>
                        </div>
                      </div>
                    </div>
                    <aside className="flex flex-row items-center justify-between gap-3 border-t border-border bg-secondary/40 p-4 md:flex-col md:items-stretch md:justify-center md:border-l md:border-t-0 md:p-5">
                      <div className="min-w-0">
                        {price != null ? <>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Łącznie · {passengers} os.</p>
                          <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-primary">{eur(price)}</p>
                          <p className="truncate text-xs font-medium text-muted-foreground">{selectedClassLabel} · {fit.f.toUpperCase()}{!ticketable && " · 2 bilety"}</p>
                        </> : <p className="text-sm font-semibold text-muted-foreground">{c.category === "kr" ? "Sprzedaż u przewoźnika" : "Sprzedaż wkrótce"}</p>}
                      </div>
                      <button disabled={!ticketable} onClick={() => { setSel(c); const selected = fitFor(c.category); setCls(selected.c); setFare(selected.f); setStep("details"); }} className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground">
                        {ticketable ? "Wybierz" : c.category === "kr" ? "U operatora" : "Niedostępne"}
                      </button>
                    </aside>
                  </div>
                  <button onClick={() => setExpanded(isOpen ? null : key)} aria-label={isOpen ? "Zwiń pełną trasę" : "Pokaż pełną trasę"} aria-expanded={isOpen} className="flex w-full items-center justify-between border-t border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground">
                    <span>{isOpen ? "Zwiń pełną trasę" : "Pokaż pełną trasę"}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="border-t border-border px-4 py-3">
                      {(c.legs ?? [c]).map((L) => (<div key={L.train}><p className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pełna trasa · {categoryNames[L.category] ?? L.category} {L.train}</p>
                      <ol className="space-y-1">
                        {trainRoute(L.train).map((s, i, arr) => {
                          const isFrom = s.station === L.from, isTo = s.station === L.to;
                          const time = s.arr && s.dep ? `${s.arr} / ${s.dep}` : (s.dep ?? s.arr);
                          return (
                            <li key={i} className={`flex items-baseline gap-3 text-sm ${isFrom || isTo ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                              <span className="w-20 shrink-0 tabular-nums">{time}</span>
                              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isFrom || isTo ? "bg-primary" : "bg-border"}`} />
                              <span className="flex-1">{s.station}</span>
                              <span className="text-xs tabular-nums">{s.km.toFixed(1)} km</span>
                              {i === 0 && <span className="text-[10px] uppercase">start</span>}
                              {i === arr.length - 1 && <span className="text-[10px] uppercase">koniec</span>}
                            </li>
                          );
                        })}
                      </ol></div>))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {step === "details" && sel && (
          <div className="mt-6 space-y-5">
            <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4"><TrainFront className="h-5 w-5 text-primary" /><span className="font-semibold">{categoryNames[category] ?? category} {sel.train}{sel.change ? ` · przesiadka ${sel.change}` : ""}</span><span className="ml-auto tabular-nums">{sel.dep} → {sel.arr} · {Math.round(sel.km)} km</span></div>
            <div>
              <p className="mb-2 text-sm font-semibold">Klasa</p>
              <div className={`grid gap-2 ${availableClasses.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {availableClasses.map((k) => (
                  <button key={k.id} onClick={() => setCls(k.id)} className={chip(cls === k.id)}>{classLabel(k.id)}<div className="mt-1 text-xs font-normal opacity-70">{eur(categoryBasePrice(category, sel.km, k.id))}</div></button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Wariant taryfowy</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {availableFares.map((f) => (
                  <button key={f.id} onClick={() => setFare(f.id)} className={chip(fare === f.id)}>{f.label}<div className="mt-1 text-xs font-normal opacity-70">{eur(passengerPrice(sel.km, cls, f.id, "none", category))}</div></button>
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
                    <span className="w-20 text-right text-sm font-semibold tabular-nums">{eur(passengerPrice(sel.km, cls, fare, effective[i]!, category))}</span>
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
          <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); setPaying(true); setTimeout(() => {
            try {
              const saved = JSON.parse(window.localStorage.getItem("kk-demo-tickets") ?? "[]");
              const tickets = Array.isArray(saved) ? saved : [];
              tickets.push({ code, train: sel.train, category: categoryNames[category] ?? category, from: sel.from, to: sel.to, dep: sel.dep, arr: sel.arr, date, passengers: pax.length, travelClass: classLabel(cls), fare: fareInfo.label, total: eur(total), status: "active" });
              window.localStorage.setItem("kk-demo-tickets", JSON.stringify(tickets));
            } catch { /* Demo checkout can still finish if browser storage is unavailable. */ }
            setPaying(false); setStep("done");
          }, 1200); }}>
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
                <div className="flex items-center gap-2"><span className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{categoryCodes[category]}</span><span className="font-semibold">{categoryNames[category] ?? category} {sel.train}</span></div>
                <div className="text-3xl font-extrabold tabular-nums">{sel.dep} → {sel.arr}</div>
                <div className="text-sm opacity-80">{sel.from} → {sel.to}</div>
                <div className="text-sm opacity-80">{dateLabel}</div>
                <div className="text-sm opacity-80">{name} · {pax.length} os. · {classLabel(cls)} · {fareInfo.label}</div>
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
