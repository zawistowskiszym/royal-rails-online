import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowLeftRight, Wifi, Bike, Leaf, Clock, Smartphone, Ticket } from "lucide-react";
import hero from "@/assets/hero-train.jpg";
import { StationField, DateTimeField } from "@/components/SearchFields";
import { ManageTicket } from "@/components/ManageTicket";
import { allSkuszawyjiceStations, stations, veloviaRoute } from "@/lib/timetable";
import { basePrice, eur } from "@/lib/fares";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Koleje Królewskie — kup bilet i sprawdź rozkład" },
      { name: "description", content: "Szybkie, punktualne i ekologiczne połączenia kolejowe. Kup bilet online w kilka sekund." },
      { property: "og:title", content: "Koleje Królewskie — kup bilet online" },
      { property: "og:description", content: "Szybkie, punktualne i ekologiczne połączenia kolejowe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const routeDests = ["Bentach Główny", "Bizceń Główny", "Budziszów Główny", "Helonki Centralne"];
const origin = "Skuszawyjice Wschodnie";

const routes = routeDests.flatMap((to) => {
  const r = veloviaRoute(origin, to);
  if (!r) return [];
  return [{
    from: origin,
    to,
    time: `${Math.floor(r.mins / 60)} h ${r.mins % 60} min`,
    price: `od ${eur(basePrice(r.km, "standard") * 0.7)}`,
  }];
});

const features = [
  { icon: Clock, title: "Kursy co 15 minut", text: "W godzinach szczytu na głównych liniach." },
  { icon: Wifi, title: "Darmowe Wi‑Fi", text: "Szybki internet i gniazdka przy każdym fotelu." },
  { icon: Bike, title: "Rower za darmo", text: "Przestronne miejsca na rowery i hulajnogi." },
  { icon: Leaf, title: "100% zielonej energii", text: "Jeździmy na prądzie z odnawialnych źródeł." },
];

function Index() {
  const [from, setFrom] = useState("Skuszawyjice Wschodnie");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => `${String(new Date().getHours()).padStart(2, "0")}:00`);
  const [round, setRound] = useState(false);
  const [retDate, setRetDate] = useState(() => new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10));
  const [retTime, setRetTime] = useState("16:00");
  const [pax, setPax] = useState(1);
  const [cars, setCars] = useState<string[]>(["vv", "ic", "spr"]);
  const [manageOpen, setManageOpen] = useState(false);
  const navigate = useNavigate();
  const carrierOpts = [["vv", "Velovia"], ["ic", "Intercity"], ["spr", "Sprinter"], ["kr", "Krukolej"]] as const;
  const toggleCar = (c: string) => setCars((p) => (p.includes(c) ? (p.length > 1 ? p.filter((x) => x !== c) : p) : [...p, c]));
  const pill = (on: boolean) => `rounded-full border px-3 py-1.5 text-xs font-semibold transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <a href="#" aria-label="Koleje Królewskie — strona główna"><img src="/koleje-krolewskie.png" alt="Koleje Królewskie" className="h-10 w-auto" /></a>
          <nav className="hidden gap-8 text-sm font-medium md:flex">
            <a href="#bilety" className="hover:text-primary">Bilety</a>
            <a href="#trasy" className="hover:text-primary">Trasy</a>
            <a href="#podroz" className="hover:text-primary">Podróż</a>
            <a href="#aplikacja" className="hover:text-primary">Aplikacja</a>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setManageOpen(true)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary">Zarządzaj biletem</button>
            <a href="#bilety" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Kup bilet</a>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-5 pt-6">
        <div className="relative overflow-hidden rounded-3xl">
          <img src={hero} alt="Pociąg Kolei Królewskich" width={1920} height={1088} className="h-[560px] w-full object-cover md:h-[640px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-12">
            <span className="inline-block rounded-full bg-background/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-ink-foreground backdrop-blur">
              Nowy rozkład od 14 grudnia
            </span>
            <h1 className="mt-4 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tight text-ink-foreground md:text-7xl">
              Podróżuj szybciej.<br />Bez korków.
            </h1>
          </div>
        </div>

        <form id="bilety" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/wyniki", search: { from, to, date, time, ret: round ? retDate : "", rtime: retTime, pax, cars: cars.join(",") } }); }} className="relative z-10 mx-auto -mt-10 max-w-5xl rounded-2xl border border-border bg-card p-3 shadow-2xl">
          <div className="flex flex-wrap items-center gap-2 px-1 pb-3">
            <button type="button" onClick={() => setRound(false)} className={pill(!round)}>W jedną stronę</button>
            <button type="button" onClick={() => setRound(true)} className={pill(round)}>Tam i z powrotem</button>
            <span className="mx-2 h-5 w-px bg-border" />
            <span className="text-xs font-semibold text-muted-foreground">Pasażerowie</span>
            <button type="button" aria-label="Mniej pasażerów" onClick={() => setPax((n) => Math.max(1, n - 1))} className="grid h-7 w-7 place-items-center rounded-full bg-secondary font-bold">−</button>
            <span className="w-5 text-center text-sm font-bold">{pax}</span>
            <button type="button" aria-label="Więcej pasażerów" onClick={() => setPax((n) => Math.min(8, n + 1))} className="grid h-7 w-7 place-items-center rounded-full bg-secondary font-bold">+</button>
            <span className="mx-2 h-5 w-px bg-border" />
            {carrierOpts.map(([id, l]) => <button key={id} type="button" onClick={() => toggleCar(id)} className={pill(cars.includes(id))}>{l}</button>)}
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr_200px_auto]">
          <StationField label="Skąd" value={from} onChange={setFrom} placeholder="Stacja początkowa" options={[allSkuszawyjiceStations, ...stations]} />
          <button type="button" onClick={() => { setFrom(to); setTo(from); }} aria-label="Zamień stacje" className="mx-auto grid h-10 w-10 place-items-center self-center rounded-full bg-secondary transition hover:bg-accent hover:text-accent-foreground">
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <StationField label="Dokąd" value={to} onChange={setTo} placeholder="Stacja docelowa" options={[allSkuszawyjiceStations, ...stations]} />
          <DateTimeField date={date} time={time} onDate={setDate} onTime={setTime} />
          <button className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-semibold text-primary-foreground transition hover:opacity-90">
            Szukaj <ArrowRight className="h-4 w-4" />
          </button>
          </div>
          {round && (
            <div className="mt-2 grid gap-2 md:grid-cols-[1fr_200px]">
              <p className="self-center px-3 text-sm font-semibold text-muted-foreground">Powrót: {to || "…"} → {from}</p>
              <DateTimeField date={retDate} time={retTime} onDate={setRetDate} onTime={setRetTime} />
            </div>
          )}
        </form>
      </section>

      {manageOpen && <ManageTicket onClose={() => setManageOpen(false)} />}

      <section id="trasy" className="mx-auto max-w-7xl px-5 py-24">
        <div className="flex items-end justify-between gap-6">
          <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Popularne trasy</h2>
          <a href="#" className="hidden items-center gap-1 text-sm font-semibold text-primary md:flex">Wszystkie połączenia <ArrowRight className="h-4 w-4" /></a>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {routes.map((r) => (
            <a key={r.to} href="#bilety" className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary hover:shadow-xl">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{r.from}</p>
                <p className="mt-1 text-xl font-bold leading-tight">{r.to}</p>
              </div>
              <div className="mt-10 flex items-end justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{r.time}</p>
                  <p className="text-lg font-bold text-primary">{r.price}</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="podroz" className="bg-ink py-24 text-ink-foreground">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
            Komfort, który <span className="text-primary">czujesz</span> od pierwszej stacji.
          </h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-ink-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="bg-ink p-8">
                <f.icon className="h-7 w-7 text-primary" />
                <h3 className="mt-6 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-ink-foreground/60">{f.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 grid grid-cols-3 gap-6 border-t border-ink-foreground/10 pt-10">
            {[["97%", "punktualność"], ["8 mln", "pasażerów rocznie"], ["40+", "stacji"]].map(([n, l]) => (
              <div key={l}>
                <p className="text-4xl font-extrabold md:text-6xl">{n}</p>
                <p className="mt-1 text-sm text-ink-foreground/60">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="aplikacja" className="mx-auto max-w-7xl px-5 py-24">
        <div className="grid items-center gap-10 rounded-3xl bg-primary p-10 text-primary-foreground md:grid-cols-2 md:p-16">
          <div>
            <Smartphone className="h-10 w-10" />
            <h2 className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl">Bilet w telefonie w 10 sekund.</h2>
            <p className="mt-4 max-w-md text-primary-foreground/80">Kupuj, zwracaj i śledź pociąg na żywo. Bez kolejek, bez papieru.</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <a href="#" className="rounded-full bg-ink px-6 py-3 font-semibold text-ink-foreground">App Store</a>
            <a href="#" className="rounded-full bg-ink px-6 py-3 font-semibold text-ink-foreground">Google Play</a>
            <a href="#bilety" className="flex items-center gap-2 rounded-full border border-primary-foreground/40 px-6 py-3 font-semibold"><Ticket className="h-4 w-4" /> Kup online</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-muted-foreground md:flex-row">
          <img src="/koleje-krolewskie.png" alt="Koleje Królewskie" className="h-8 w-auto" />
          <p>© 2026 Koleje Królewskie. Wszystkie prawa zastrzeżone.</p>
        </div>
      </footer>
    </div>
  );
}
