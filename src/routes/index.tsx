import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowLeftRight, Calendar, Wifi, Bike, Leaf, Clock, Smartphone, Ticket, TrainFront, Zap } from "lucide-react";
import logo from "@/assets/logo.png.asset.json";
import hero from "@/assets/hero-train.jpg";

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

const routes = [
  { from: "Skuszawyjice Wschodnie", to: "Bentach Główny", time: "1 h 54 min", price: "od 24 zł" },
  { from: "Skuszawyjice Wschodnie", to: "Bizceń Główny", time: "2 h 16 min", price: "od 27 zł" },
  { from: "Skuszawyjice Wschodnie", to: "Budziszów Główny", time: "55 min", price: "od 15 zł" },
  { from: "Skuszawyjice Wschodnie", to: "Helonki Centralne", time: "41 min", price: "od 12 zł" },
];

// Rozkład KDP Velovia — odjazdy ze Skuszawyjic Wschodnich (wszystkie dni)
type Departure = { time: string; train: string; to: string; via: string; arrival: string };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const departures: Departure[] = (() => {
  const rows: Departure[] = [];
  for (let h = 6; h <= 22; h++) {
    if (h <= 22) {
      rows.push({
        time: `${pad(h)}:08`,
        train: `VV ${pad3(1 + 2 * (h - 6))}`,
        to: "Bentach Główny",
        via: `Utroch ${pad(h + 1)}:50`,
        arrival: `${pad(h + 1)}:02`,
      });
    }
    if (h >= 7) {
      rows.push({
        time: `${pad(h)}:12`,
        train: `VV ${pad3(103 + 4 * (h - 7))}`,
        to: "Budziszów Główny",
        via: `Selbert ${pad(h)}:39 · Helonki Centralne ${pad(h)}:53`,
        arrival: `${pad(h + 1)}:07`,
      });
    }
    if (h <= 21) {
      rows.push({
        time: `${pad(h)}:38`,
        train: `VV ${pad3(69 + 2 * (h - 6))}`,
        to: "Bizceń Główny",
        via: `Utroch ${pad(h + 1)}:20 · Bizceń Centralny ${pad(h + 1)}:53`,
        arrival: `${pad(h + 1)}:54`,
      });
    }
    rows.push({
      time: `${pad(h)}:42`,
      train: `VV ${pad3(101 + 4 * (h - 6))}`,
      to: "Budziszów Główny",
      via: `Selbert ${pad(h + 1)}:09 · Helonki Centralne ${pad(h + 1)}:23`,
      arrival: `${pad(h + 1)}:37`,
    });
  }
  return rows.sort((a, b) => a.time.localeCompare(b.time));
})();

function pad3(n: number) {
  return String(n).padStart(3, "0");
}

const destinations = ["Wszystkie", "Bentach Główny", "Bizceń Główny", "Budziszów Główny"];

const features = [
  { icon: Clock, title: "Kursy co 15 minut", text: "W godzinach szczytu na głównych liniach." },
  { icon: Wifi, title: "Darmowe Wi‑Fi", text: "Szybki internet i gniazdka przy każdym fotelu." },
  { icon: Bike, title: "Rower za darmo", text: "Przestronne miejsca na rowery i hulajnogi." },
  { icon: Leaf, title: "100% zielonej energii", text: "Jeździmy na prądzie z odnawialnych źródeł." },
];

function Index() {
  const [from, setFrom] = useState("Skuszawyjice Wschodnie");
  const [to, setTo] = useState("");
  const [dest, setDest] = useState("Wszystkie");

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <img src={logo.url} alt="Koleje Królewskie" className="h-9 w-auto" />
          <nav className="hidden gap-8 text-sm font-medium md:flex">
            <a href="#bilety" className="hover:text-primary">Bilety</a>
            <a href="#rozklad" className="hover:text-primary">Rozkład</a>
            <a href="#trasy" className="hover:text-primary">Trasy</a>
            <a href="#podroz" className="hover:text-primary">Podróż</a>
            <a href="#aplikacja" className="hover:text-primary">Aplikacja</a>
          </nav>
          <a href="#bilety" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
            Kup bilet
          </a>
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

        <form id="bilety" onSubmit={(e) => e.preventDefault()} className="relative z-10 mx-auto -mt-10 grid max-w-5xl gap-2 rounded-2xl border border-border bg-card p-3 shadow-2xl md:grid-cols-[1fr_auto_1fr_200px_auto]">
          <Field label="Skąd" value={from} onChange={setFrom} placeholder="Stacja początkowa" />
          <button type="button" onClick={() => { setFrom(to); setTo(from); }} aria-label="Zamień stacje" className="mx-auto grid h-10 w-10 place-items-center self-center rounded-full bg-secondary transition hover:bg-accent hover:text-accent-foreground">
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <Field label="Dokąd" value={to} onChange={setTo} placeholder="Stacja docelowa" />
          <label className="flex flex-col rounded-xl bg-secondary px-4 py-2.5">
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><Calendar className="h-3 w-3" /> Kiedy</span>
            <input type="date" className="bg-transparent font-semibold outline-none" defaultValue={new Date().toISOString().slice(0, 10)} />
          </label>
          <button className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-semibold text-primary-foreground transition hover:opacity-90">
            Szukaj <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </section>

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
          <img src={logo.url} alt="Koleje Królewskie" className="h-8 w-auto" />
          <p>© 2026 Koleje Królewskie. Wszystkie prawa zastrzeżone.</p>
        </div>
      </footer>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-col rounded-xl bg-secondary px-4 py-2.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-transparent font-semibold outline-none placeholder:text-muted-foreground/60" />
    </label>
  );
}
