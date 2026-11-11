import { useMemo, useRef, useState } from "react";
import { Calendar as CalIcon, MapPin, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { norm } from "@/lib/timetable";
import { cn } from "@/lib/utils";

export function StationField({ label, value, onChange, placeholder, options }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; options: string[] }) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const list = useMemo(() => {
    const q = norm(value);
    const m = q ? options.filter((o) => norm(o).includes(q)) : options;
    return m.sort((a, b) => Number(!norm(a).startsWith(q)) - Number(!norm(b).startsWith(q))).slice(0, 8);
  }, [value, options]);
  const pick = (s: string) => { onChange(s); setOpen(false); ref.current?.blur(); };
  return (
    <div className="relative flex flex-col rounded-xl bg-secondary px-4 py-2.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input ref={ref} value={value} placeholder={placeholder} autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHi(0); }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!open || !list.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => (h + 1) % list.length); }
          if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => (h - 1 + list.length) % list.length); }
          if (e.key === "Enter") { e.preventDefault(); pick(list[hi]!); }
          if (e.key === "Escape") setOpen(false);
        }}
        className="bg-transparent font-semibold outline-none placeholder:text-muted-foreground/60" />
      {open && list.length > 0 && (
        <ul className="absolute left-0 top-full z-40 mt-2 w-full min-w-64 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-2xl">
          {list.map((s, i) => (
            <li key={s}>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); pick(s); }} onMouseEnter={() => setHi(i)}
                className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium", i === hi && "bg-primary/10 text-primary")}>
                <MapPin className="h-4 w-4 shrink-0 opacity-60" />{s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const hours = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);
const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function DateTimeField({ date, time, onDate, onTime }: { date: string; time: string; onDate: (v: string) => void; onTime: (v: string) => void }) {
  const d = new Date(date + "T00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const label = d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="flex flex-col rounded-xl bg-secondary px-4 py-2.5 text-left">
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><CalIcon className="h-3 w-3" /> Kiedy</span>
          <span className="font-semibold">{label}, od {time}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto rounded-2xl p-0">
        <div className="flex flex-col sm:flex-row">
          <Calendar mode="single" selected={d} onSelect={(v) => v && onDate(toIso(v))} disabled={(v) => v < today} className="p-3 pointer-events-auto" />
          <div className="border-t border-border p-3 sm:w-40 sm:border-l sm:border-t-0">
            <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground"><Clock className="h-3 w-3" /> Odjazd od</p>
            <div className="grid max-h-64 grid-cols-4 gap-1 overflow-y-auto sm:grid-cols-2">
              {hours.map((h) => (
                <button key={h} type="button" onClick={() => onTime(h)}
                  className={cn("rounded-lg px-2 py-1.5 text-sm font-semibold tabular-nums", h === time ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>{h}</button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
