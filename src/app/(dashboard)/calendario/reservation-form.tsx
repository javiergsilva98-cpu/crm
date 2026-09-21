"use client";

import { useRef, useState } from "react";
import { requestReservation } from "./actions";

export function ReservationForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-3 rounded-[18px] border border-border bg-card p-4"
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await requestReservation(formData);
        setPending(false);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        formRef.current?.reset();
        setSent(true);
        setTimeout(() => setSent(false), 4000);
      }}
    >
      <div>
        <label className="mb-1 block text-xs text-muted">Motivo</label>
        <input
          name="name"
          required
          placeholder="Ej. Cumpleaños familiar"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-muted">Fecha</label>
          <input
            name="event_date"
            type="date"
            required
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-muted">Hasta (opcional)</label>
          <input
            name="end_date"
            type="date"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Notas (opcional)</label>
        <textarea
          name="notes"
          rows={2}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input name="is_exclusive" type="checkbox" defaultChecked className="h-4 w-4 accent-accent" />
        Reserva en exclusiva (uso exclusivo del local esa fecha)
      </label>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Solicitar reserva"}
      </button>
      {sent && <p className="text-sm text-success">Solicitud enviada, a la espera de aprobación.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
