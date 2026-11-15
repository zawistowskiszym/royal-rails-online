import { useMemo, useState } from "react";
import { Armchair, TrainFront } from "lucide-react";
import type { TravelClass } from "@/lib/fares";
import { assignSeat, occupiedSeats, seatLabel, seatsInCoach, veloviaCoaches } from "@/lib/seats";

const classNames: Record<TravelClass, string> = {
  standard: "Standard",
  premiere: "Première",
  business: "Business Première",
};

export function VeloviaSeatMap({
  train,
  date,
  travelClass,
  value,
  onChange,
}: {
  train: string;
  date: string;
  travelClass: TravelClass;
  value: readonly (string | null)[];
  onChange: (seats: (string | null)[]) => void;
}) {
  const availableCoaches = veloviaCoaches.filter((coach) => coach.travelClass === travelClass);
  const [coachNumber, setCoachNumber] = useState(availableCoaches[0]!.number);
  const [activePassenger, setActivePassenger] = useState(0);
  const passenger = Math.min(activePassenger, value.length - 1);
  const coach = availableCoaches.find((item) => item.number === coachNumber) ?? availableCoaches[0]!;
  const seats = useMemo(() => seatsInCoach(coach), [coach]);
  const occupied = useMemo(() => occupiedSeats(train, date), [train, date]);
  const selectedCount = value.filter(Boolean).length;

  const chooseSeat = (seatId: string) => {
    if (occupied.has(seatId)) return;
    const assignedTo = value.indexOf(seatId);
    const next = assignSeat(value, passenger, seatId);
    onChange(next);
    if (assignedTo >= 0) {
      setActivePassenger(assignedTo);
      return;
    }
    const nextUnassigned = next.findIndex((seat, index) => index > passenger && !seat);
    const firstUnassigned = next.findIndex((seat) => !seat);
    setActivePassenger(nextUnassigned >= 0 ? nextUnassigned : firstUnassigned >= 0 ? firstUnassigned : passenger);
  };

  return (
    <section aria-label="Wybór miejsca w pociągu Velovia" className="rounded-2xl border border-border p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Wybierz miejsca ze schematu</p>
          <p className="mt-1 text-xs text-muted-foreground">Siemens Velaro · 8 wagonów · {classNames[travelClass]}</p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold" aria-live="polite">
          Wybrano {selectedCount}/{value.length}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Miejsce dla pasażera">
        {value.map((seat, index) => (
          <button
            type="button"
            key={index}
            onClick={() => setActivePassenger(index)}
            aria-pressed={passenger === index}
            className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${passenger === index ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}
          >
            Pasażer {index + 1}
            <span className="mt-0.5 block font-normal text-muted-foreground">{seat ? seatLabel(seat) : "Brak miejsca"}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="flex min-w-[660px] items-stretch gap-1" aria-label="Osiem wagonów składu">
          {veloviaCoaches.map((item) => {
            const available = item.travelClass === travelClass;
            const selected = coach.number === item.number;
            return (
              <button
                type="button"
                key={item.number}
                disabled={!available}
                onClick={() => setCoachNumber(item.number)}
                aria-pressed={selected}
                title={available ? `Wagon ${item.number} · ${classNames[item.travelClass]}` : `${classNames[item.travelClass]} — zmień klasę biletu, aby wybrać ten wagon`}
                className={`flex-1 rounded-lg border px-2 py-2 text-center transition ${selected ? "border-primary bg-primary text-primary-foreground" : available ? "border-border bg-background hover:border-primary" : "cursor-not-allowed border-border bg-secondary text-muted-foreground opacity-45"}`}
              >
                <span className="block text-xs font-bold">Wagon {item.number}</span>
                <span className="mt-0.5 block truncate text-[9px]">{classNames[item.travelClass]}</span>
              </button>
            );
          })}
          <div className="grid w-10 shrink-0 place-items-center text-primary" aria-label="Przód pociągu">
            <TrainFront className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Armchair className="h-4 w-4 text-primary" /> Wagon {coach.number}
            <span className="font-normal text-muted-foreground">· układ {coach.letters.length === 3 ? "2+1" : "2+2"}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Wybierasz miejsce dla pasażera {passenger + 1}. Kolejny wolny fotel przypiszemy do następnego pasażera.</p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-t-md border border-border bg-background" /> Wolne</span>
            <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-t-md bg-primary" /> Wybrane</span>
            <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-t-md bg-secondary" /> Zajęte</span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Schemat i dostępność miejsc są demonstracyjne.</p>
        </div>

        <div className="mx-auto rounded-2xl bg-secondary/60 px-4 py-4">
          <div className="mb-2 flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground">
            <span className="w-6" />
            {coach.letters.map((letter, index) => (
              <span key={letter} className={`w-9 text-center ${index === 2 ? "ml-7" : "ml-1"}`}>{letter}</span>
            ))}
          </div>
          <div className="space-y-1" aria-label={`Miejsca w wagonie ${coach.number}`}>
            {Array.from({ length: coach.rows }, (_, rowIndex) => {
              const row = rowIndex + 1;
              return (
                <div key={row} className="flex items-center gap-1">
                  <span className="w-6 text-right text-[10px] tabular-nums text-muted-foreground">{row}</span>
                  {seats.slice(rowIndex * coach.letters.length, row * coach.letters.length).map((seat, index) => {
                    const assignedTo = value.indexOf(seat.id);
                    const isSelected = assignedTo >= 0;
                    const isOccupied = occupied.has(seat.id);
                    const status = isOccupied ? "zajęte" : isSelected ? `wybrane dla pasażera ${assignedTo + 1}` : "wolne";
                    return (
                      <button
                        type="button"
                        key={seat.id}
                        disabled={isOccupied}
                        onClick={() => chooseSeat(seat.id)}
                        aria-label={`Wagon ${seat.coach}, miejsce ${seat.row}${seat.letter}, ${status}${seat.window ? ", przy oknie" : ""}`}
                        aria-pressed={isSelected}
                        title={`${seatLabel(seat.id)} · ${status}${seat.window ? " · przy oknie" : ""}`}
                        className={`h-8 w-9 rounded-t-lg rounded-b-sm border text-[10px] font-bold transition ${index === 2 ? "ml-7" : ""} ${isSelected ? "border-primary bg-primary text-primary-foreground" : isOccupied ? "cursor-not-allowed border-transparent bg-secondary text-muted-foreground/35 line-through" : "border-border bg-background hover:border-primary hover:bg-accent hover:text-accent-foreground"}`}
                      >
                        {seat.letter}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground">Kierunek jazdy →</p>
        </div>
      </div>
    </section>
  );
}
