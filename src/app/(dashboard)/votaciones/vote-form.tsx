"use client";

import { useRef, useState } from "react";
import { createVote } from "./actions";

export function VoteForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-3 rounded-[18px] border border-border bg-card p-4"
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await createVote(formData);
        setPending(false);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        formRef.current?.reset();
      }}
    >
      <div>
        <label className="mb-1 block text-xs text-muted">Pregunta</label>
        <input
          name="question"
          required
          placeholder="Ej. ¿Aprobamos el presupuesto de la matanza?"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Descripción (opcional)</label>
        <textarea
          name="description"
          rows={2}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <input
            key={n}
            name={`option_${n}`}
            placeholder={`Opción ${n}${n <= 2 ? " (obligatoria)" : " (opcional)"}`}
            required={n <= 2}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-muted">Fecha límite (opcional)</label>
          <input
            name="deadline"
            type="datetime-local"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
          <p className="mt-1 text-[11px] text-muted">
            Sin fecha, la votación queda abierta hasta que alguien la cierre a mano.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Tipo</label>
          <select
            name="category"
            defaultValue="normal"
            title="Express: para decisiones urgentes que se quieren resolver en poco tiempo. Es el mismo sistema, solo cambia la etiqueta."
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="normal">Normal</option>
            <option value="express">Express (urgente)</option>
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input name="is_anonymous" type="checkbox" className="h-4 w-4 accent-accent" />
        Votación anónima (no se mostrará quién votó qué)
      </label>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Creando..." : "Crear votación"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
