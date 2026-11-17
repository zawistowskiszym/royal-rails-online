import { useState, type FormEvent } from "react";
import { Printer, X } from "lucide-react";

type DemoTicket = {
  code: string;
  train: string;
  category: string;
  from: string;
  to: string;
  dep: string;
  arr: string;
  date: string;
  passengers: number;
  travelClass: string;
  fare: string;
  seats?: string[];
  paymentMethod?: string;
  total: string;
  status: "active" | "cancelled";
};

const storageKey = "kk-demo-tickets";

function readTickets(): DemoTicket[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(value) ? value as DemoTicket[] : [];
  } catch {
    return [];
  }
}

export function ManageTicket({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const [tickets, setTickets] = useState<DemoTicket[]>(() => readTickets());
  const [ticket, setTicket] = useState<DemoTicket | null>(null);
  const [searched, setSearched] = useState(false);

  const search = (event: FormEvent) => {
    event.preventDefault();
    const saved = readTickets();
    setTickets(saved);
    setTicket(saved.find((item) => item.code === code.trim().toUpperCase()) ?? null);
    setSearched(true);
  };

  const cancel = () => {
    if (!ticket) return;
    const updated = readTickets().map((item) => item.code === ticket.code ? { ...item, status: "cancelled" as const } : item);
    window.localStorage.setItem(storageKey, JSON.stringify(updated));
    setTickets(updated);
    setTicket({ ...ticket, status: "cancelled" });
  };

  const input = "w-full rounded-xl bg-secondary px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Zarządzaj biletem" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl md:rounded-3xl md:p-8" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Rezerwacje</p>
            <h2 className="mt-1 text-2xl font-extrabold">Zarządzaj biletem</h2>
            <p className="mt-2 text-sm text-muted-foreground">Wybierz zapisany bilet albo wyszukaj go po numerze.</p>
          </div>
          <button onClick={onClose} aria-label="Zamknij" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={search} className="mt-6 flex gap-2">
          <input autoComplete="off" className={input} placeholder="Np. KK-AB12CD34" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} required />
          <button className="shrink-0 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">Szukaj</button>
        </form>

        {tickets.length > 0 && (
          <section className="mt-5 space-y-2" aria-label="Zapisane bilety">
            <h3 className="text-sm font-bold">Zapisane bilety</h3>
            {[...tickets].reverse().map((item) => (
              <button type="button" key={item.code} onClick={() => { setTicket(item); setSearched(false); }} className={`w-full rounded-xl border p-3 text-left transition ${ticket?.code === item.code ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                <span className="flex items-center justify-between gap-3"><span className="font-mono text-xs font-bold">{item.code}</span><span className={item.status === "active" ? "text-xs font-semibold text-primary" : "text-xs text-muted-foreground"}>{item.status === "active" ? "Aktywny" : "Anulowany"}</span></span>
                <span className="mt-1 block text-sm font-semibold">{item.from} → {item.to}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{item.date} · {item.dep} → {item.arr}</span>
              </button>
            ))}
          </section>
        )}
        {searched && !ticket && <p role="status" className="mt-4 rounded-xl bg-secondary p-4 text-sm">Nie znaleziono biletu o podanym numerze.</p>}
        {ticket && (
          <div data-print-ticket className="mt-5 rounded-2xl border border-border p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ticket.category} · {ticket.train}</p><p className="mt-1 text-xl font-extrabold">{ticket.from} → {ticket.to}</p></div>
              <span className={ticket.status === "active" ? "rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary" : "rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground"}>
                {ticket.status === "active" ? "Aktywny" : "Anulowany"}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Data</dt><dd className="font-semibold">{new Date(`${ticket.date}T12:00:00`).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</dd></div>
              <div><dt className="text-muted-foreground">Odjazd · przyjazd</dt><dd className="font-semibold tabular-nums">{ticket.dep} · {ticket.arr}</dd></div>
              <div><dt className="text-muted-foreground">Pasażerowie</dt><dd className="font-semibold">{ticket.passengers}</dd></div>
              <div><dt className="text-muted-foreground">Klasa · taryfa</dt><dd className="font-semibold">{ticket.travelClass} · {ticket.fare}</dd></div>
              {ticket.paymentMethod && <div><dt className="text-muted-foreground">Płatność</dt><dd className="font-semibold">{ticket.paymentMethod === "card" ? "Karta płatnicza" : ticket.paymentMethod === "blik" ? "BLIK" : "Szybki przelew"}</dd></div>}
              {ticket.seats && ticket.seats.length > 0 && <div className="col-span-2"><dt className="text-muted-foreground">Miejsca</dt><dd className="font-semibold">{ticket.seats.join(" · ")}</dd></div>}
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Nr {ticket.code}</span>
              <span className="font-extrabold">{ticket.total}</span>
            </div>
            <div data-print-hide className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button onClick={() => window.print()} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold"><Printer className="h-4 w-4" /> Drukuj / Zapisz PDF</button>
              {ticket.status === "active" && <button onClick={cancel} className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:border-destructive hover:text-destructive">Anuluj bilet</button>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
