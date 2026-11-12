import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { TicketFlow } from "@/components/TicketFlow";
import { ManageTicket } from "@/components/ManageTicket";

type Search = { from: string; to: string; date: string; time: string; ret: string; rtime: string; pax: number; cars: string };

export const Route = createFileRoute("/wyniki")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    from: String(s["from"] ?? ""),
    to: String(s["to"] ?? ""),
    date: String(s["date"] ?? new Date().toISOString().slice(0, 10)),
    time: String(s["time"] ?? "00:00"),
    ret: String(s["ret"] ?? ""),
    rtime: String(s["rtime"] ?? "00:00"),
    pax: Math.max(1, Math.min(8, Number(s["pax"]) || 1)),
    cars: String(s["cars"] ?? "vv,ic,spr"),
  }),
  head: () => ({
    meta: [
      { title: "Wyniki wyszukiwania — Koleje Królewskie" },
      { name: "description", content: "Połączenia kolejowe i zakup biletu online." },
      { property: "og:title", content: "Wyniki wyszukiwania — Koleje Królewskie" },
      { property: "og:description", content: "Połączenia kolejowe i zakup biletu online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Results,
});

function Results() {
  const [manageOpen, setManageOpen] = useState(false);
  const { from, to, date, time, ret, rtime, pax, cars } = Route.useSearch();
  const carriers = cars.split(",").filter(Boolean);
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link to="/" aria-label="Koleje Królewskie — strona główna"><img src="/koleje-krolewskie.png" alt="Koleje Królewskie" className="h-10 w-auto" /></Link>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setManageOpen(true)} className="text-sm font-semibold hover:text-primary">Zarządzaj biletem</button>
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold hover:text-primary"><ArrowLeft className="h-4 w-4" /> Nowe wyszukiwanie</Link>
          </div>
        </div>
      </header>
      {manageOpen && <ManageTicket onClose={() => setManageOpen(false)} />}
      <TicketFlow key={`o|${from}|${to}|${date}|${time}|${pax}|${cars}`} page title={ret ? "Tam" : undefined} passengers={pax} carriers={carriers} from={from} to={to} date={date} time={time} onClose={() => navigate({ to: "/" })} />
      {ret && <div className="-mt-6"><TicketFlow key={`r|${ret}|${rtime}|${pax}|${cars}`} page title="Powrót" passengers={pax} carriers={carriers} from={to} to={from} date={ret} time={rtime} onClose={() => navigate({ to: "/" })} /></div>}
    </div>
  );
}
