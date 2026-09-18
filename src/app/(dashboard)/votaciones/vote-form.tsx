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
