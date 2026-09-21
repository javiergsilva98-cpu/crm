"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, KeyIcon } from "@/components/icons";

type EventRow = {
  id: string;
  name: string;
  event_date: string;
  end_date: string | null;
  kind: "evento" | "reserva";
  status: "pendiente" | "confirmado" | "rechazado";
  notes: string | null;
  opensName: string | null;
  closesName: string | null;
  isExclusive: boolean;
};

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_LABEL = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Rango de fechas cubiertas por un evento/reserva (event_date -> end_date
// inclusive), para pintarlo en todos los días que ocupa, no solo el primero.
function datesInRange(start: string, end: string | null): string[] {
  const from = new Date(`${start}T00:00:00`);
  const to = end ? new Date(`${end}T00:00:00`) : from;
  const out: string[] = [];
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    out.push(dateKey(d));
  }
  return out;
}

export function CalendarioViews({ events }: { events: EventRow[] }) {
  const [view, setView] = useState<"lista" | "mes">("mes");
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const e of events) {
      for (const key of datesInRange(e.event_date, e.end_date)) {
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(e);
      }
    }
    return map;
  }, [events]);

  const monthCells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    // Lunes = 0 ... Domingo = 6
    const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { date: Date | null; key: string | null }[] = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push({ date: null, key: null });
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      cells.push({ date: d, key: dateKey(d) });
    }
    return cells;
  }, [cursor]);

  const todayKey = dateKey(new Date());
  const selectedEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Próximas fechas</p>
        <div className="flex gap-1 rounded-full border border-border p-0.5">
          <button
            type="button"
            onClick={() => setView("mes")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              view === "mes" ? "bg-accent text-accent-foreground" : "text-muted"
            }`}
          >
            Mes
          </button>
          <button
            type="button"
            onClick={() => setView("lista")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              view === "lista" ? "bg-accent text-accent-foreground" : "text-muted"
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {view === "mes" ? (
        <div className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:text-foreground"
            >
              ←
            </button>
            <p className="text-sm font-bold capitalize text-foreground">{MONTH_LABEL.format(cursor)}</p>
            <button
              type="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:text-foreground"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1 text-[10px] font-bold uppercase text-muted">
                {w}
              </div>
            ))}
            {monthCells.map((cell, idx) => {
              if (!cell.date) return <div key={idx} />;
              const dayEvents = eventsByDate.get(cell.key!) ?? [];
              const isToday = cell.key === todayKey;
              const isSelected = cell.key === selectedDate;
              const hasPending = dayEvents.some((e) => e.status === "pendiente");
              const hasConfirmed = dayEvents.some((e) => e.status !== "pendiente" && e.status !== "rechazado");

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDate(cell.key === selectedDate ? null : cell.key)}
                  className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold transition-colors ${
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : isToday
                        ? "border border-accent text-accent"
                        : "text-foreground hover:bg-card"
                  }`}
                >
                  {cell.date.getDate()}
                  {dayEvents.length > 0 && (
                    <span className="flex gap-0.5">
                      {hasConfirmed && (
                        <span
                          className={`h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-accent"}`}
                        />
                      )}
                      {hasPending && (
                        <span
                          className={`h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-warning"}`}
                        />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="mt-3 overflow-hidden rounded-[18px] border border-border bg-card">
              {selectedEvents.length === 0 ? (
                <p className="px-3.5 py-4 text-center text-sm text-muted">Sin eventos ese día.</p>
              ) : (
                selectedEvents.map((e, idx) => (
                  <EventListItem key={e.id} e={e} isLast={idx === selectedEvents.length - 1} />
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-7 overflow-hidden rounded-[18px] border border-border bg-card">
          {events.map((e, idx) => (
            <EventListItem key={e.id} e={e} isLast={idx === events.length - 1} />
          ))}
          {events.length === 0 && (
            <p className="px-3.5 py-6 text-center text-sm text-muted">Todavía no hay fechas en el calendario.</p>
          )}
        </div>
      )}
    </div>
  );
}

function EventListItem({ e, isLast }: { e: EventRow; isLast: boolean }) {
  return (
    <div className={`flex items-start gap-3 px-3.5 py-3 ${isLast ? "" : "border-b border-border"}`}>
      <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-xl bg-accent-soft">
        <CalendarIcon className="h-4 w-4 text-accent" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{e.name}</p>
          {e.kind === "reserva" && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
              Reserva
            </span>
          )}
          {e.kind === "reserva" && e.isExclusive && e.status === "confirmado" && (
            <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning">
              Exclusiva
            </span>
          )}
          {e.status === "rechazado" && (
            <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning">
              Rechazada
            </span>
          )}
        </div>
        <p className="text-xs text-muted">
          {formatDate(e.event_date)}
          {e.end_date ? ` – ${formatDate(e.end_date)}` : ""}
        </p>
        {(e.opensName || e.closesName) && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <KeyIcon className="h-3.5 w-3.5" />
            Abre: {e.opensName ?? "—"} · Cierra: {e.closesName ?? "—"}
          </p>
        )}
        {e.notes && <p className="mt-1 text-xs text-muted">{e.notes}</p>}
      </div>
    </div>
  );
}
