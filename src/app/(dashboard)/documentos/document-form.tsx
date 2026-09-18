"use client";

import { useRef, useState } from "react";
import { createDocument } from "./actions";

const DOC_TYPES = [
  { value: "acta", label: "Acta" },
  { value: "normativa", label: "Normativa" },
  { value: "contrato", label: "Contrato" },
  { value: "otro", label: "Otro" },
];

export function DocumentForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-3 rounded-[18px] border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await createDocument(formData);
        setPending(false);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        formRef.current?.reset();
      }}
    >
      <div>
        <label className="mb-1 block text-xs text-muted">Nombre</label>
        <input
          name="name"
          required
          placeholder="Estatutos del club"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Tipo</label>
        <select
          name="doc_type"
          defaultValue="otro"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Enlace (opcional)</label>
        <input
          name="reference_url"
          type="text"
          placeholder="Carpeta o archivo de Drive"
          className="min-w-[14rem] rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Añadiendo..." : "Añadir documento"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
