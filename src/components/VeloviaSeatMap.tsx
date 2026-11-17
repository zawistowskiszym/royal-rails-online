import { useMemo, useState } from "react";
import { Armchair, Bike, Check, Coffee, Accessibility, Luggage, TrainFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TravelClass } from "@/lib/fares";
import { assignSeat, occupiedSeats, seatLabel, seatsInCoach, veloviaCoaches } from "@/lib/seats";

const classNames: Record<TravelClass, string> = { standard: "Standard", premiere: "Première", business: "Business Première" };
const facilityNames = { cab: "Kabina", wc: "WC", bistro: "Bistro", accessible: "Miejsca na wózki", bikes: "Rowery", luggage: "Bagaż" };

export function VeloviaSeatMap({ train, date, travelClass, value, onChange }: {
  train: string; date: string; travelClass: TravelClass; value: readonly (string | null)[];
  onChange: (seats: (string | null)[]) => void;
}) {
  const availableCoaches = veloviaCoaches.filter((coach) => coach.travelClass === travelClass);
  const [coachNumber, setCoachNumber] = useState(availableCoaches[0]?.number ?? 1);
  const [activePassenger, setActivePassenger] = useState(0);
  const passenger = Math.max(0, Math.min(activePassenger, value.length - 1));
  const coach = availableCoaches.find((item) => item.number === coachNumber) ?? availableCoaches[0];
  const seats = useMemo(() => coach ? seatsInCoach(coach) : [], [coach]);
  const occupied = useMemo(() => occupiedSeats(train, date), [train, date]);
  if (!coach) return null;
  const chooseSeat = (seatId: string) => {
    if (occupied.has(seatId) || !value.length) return;
    const assignedTo = value.indexOf(seatId);
    const next = assignSeat(value, passenger, seatId);
    onChange(next);
    if (assignedTo >= 0) { setActivePassenger(assignedTo); return; }
    const nextUnassigned = next.findIndex((seat, index) => index > passenger && !seat);
    const firstUnassigned = next.findIndex((seat) => !seat);
    setActivePassenger(nextUnassigned >= 0 ? nextUnassigned : firstUnassigned >= 0 ? firstUnassigned : passenger);
  };
  return (
    <section aria-label="Wybór miejsca w pociągu Velovia" className="min-w-0 border-y border-border py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="flex items-center gap-2 text-base font-bold"><Armchair className="h-5 w-5 text-primary" /> Wybór miejsc</h3>
          <p className="mt-1 text-xs text-muted-foreground">Siemens Velaro · 8 wagonów · {classNames[travelClass]}</p></div>
        <span className="text-sm font-semibold text-primary" aria-live="polite">Wybrano {value.filter(Boolean).length}/{value.length}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Miejsce dla pasażera">
        {value.map((seat, index) => <Button type="button" key={index} variant={passenger === index ? "default" : "outline"}
          onClick={() => setActivePassenger(index)} aria-pressed={passenger === index}
          className="h-auto min-h-12 flex-col items-start gap-1 whitespace-normal px-3 py-2 text-left text-xs">
          <span>Pasażer {index + 1}</span><span className="font-normal">{seat ? seatLabel(seat) : "Brak miejsca"}</span>
        </Button>)}
      </div>
      <div className="mt-5 grid grid-cols-4 gap-1.5 sm:grid-cols-8" aria-label="Osiem wagonów składu">
        {veloviaCoaches.map((item) => <Button type="button" key={item.number} disabled={item.travelClass !== travelClass}
          variant={coach.number === item.number ? "default" : "outline"} onClick={() => setCoachNumber(item.number)}
          aria-pressed={coach.number === item.number}
          title={`Wagon ${item.number} · ${classNames[item.travelClass]}${item.travelClass !== travelClass ? " — inna klasa" : ""}`}
          className="h-auto min-h-14 flex-col gap-1 whitespace-normal px-1 py-2 text-center">
          <span className="text-xs font-bold">Wagon {item.number}</span><span className="text-[9px] leading-tight">{classNames[item.travelClass]}</span>
        </Button>)}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold">Wagon {coach.number} <span className="font-normal text-muted-foreground">· {coach.layout} · {seats.length} miejsc</span></p>
        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-border bg-background" /> Wolne</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-primary" /> Wybrane</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-secondary" /> Zajęte</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 border-x-2 border-border bg-muted" /> Stolik</span>
        </div>
      </div>
      <div className="velaro-scroll mt-4 overflow-x-auto pb-3" role="region" aria-label={`Miejsca w wagonie ${coach.number}`} tabIndex={0}>
        <div className="velaro-body">
          <div className="velaro-facilities">
            {coach.facilities.map((facility) => <span key={facility} className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-muted-foreground" title={facilityNames[facility]}>
              {facility === "cab" ? <TrainFront className="h-4 w-4" /> : facility === "bistro" ? <Coffee className="h-4 w-4" /> : facility === "accessible" ? <Accessibility className="h-4 w-4" /> : facility === "bikes" ? <Bike className="h-4 w-4" /> : facility === "luggage" ? <Luggage className="h-4 w-4" /> : null}
              {facilityNames[facility]}
            </span>)}
          </div>
          {coach.columns.map((column, columnIndex) => <div key={columnIndex} className="velaro-group">
            {column.tableBefore && <div className="velaro-table" aria-label="Stolik"><span /><span /></div>}
            <div className="velaro-column">
              {column.numbers.map((number, slot) => {
                const seat = seats.find((item) => item.column === columnIndex && item.slot === slot);
                if (!seat || number === null) return <span key={slot} className={`velaro-empty velaro-slot-${slot}`} />;
                const assignedTo = value.indexOf(seat.id);
                const isSelected = assignedTo >= 0;
                const isOccupied = occupied.has(seat.id);
                const status = isOccupied ? "zajęte" : isSelected ? `wybrane dla pasażera ${assignedTo + 1}` : "wolne";
                const label = `Wagon ${seat.coach}, miejsce ${seat.number}, ${status}${seat.window ? ", przy oknie" : ", przy korytarzu"}${seat.table ? ", przy stoliku" : ""}`;
                return <Button type="button" key={slot} disabled={isOccupied} onClick={() => chooseSeat(seat.id)} aria-label={label}
                  aria-pressed={isSelected} title={label} variant={isSelected ? "default" : isOccupied ? "secondary" : "outline"}
                  className={`velaro-seat velaro-slot-${slot} ${columnIndex % 2 ? "velaro-facing-back" : ""} ${isOccupied ? "line-through" : ""}`}>
                  <span>{seat.number}</span>{isSelected && <Check className="absolute right-0.5 top-0.5 !h-2.5 !w-2.5" />}
                </Button>;
              })}
              <span className="velaro-aisle" aria-hidden="true">·</span>
            </div>
          </div>)}
          <div className="velaro-exit"><span>Drzwi</span></div>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Uproszczony schemat na podstawie przesłanych planów. Dostępność miejsc jest demonstracyjna.</p>
    </section>
  );
}
