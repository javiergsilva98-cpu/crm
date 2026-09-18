"use client";

import { useState } from "react";
import { FolderIcon, ExternalLinkIcon } from "@/components/icons";
import { updateDocument, deleteDocument } from "./actions";

const DOC_TYPE_LABELS: Record<string, string> = {
  acta: "Acta",
  normativa: "Normativa",
  contrato: "Contrato",
  otro: "Otro",
};

type DocumentRow = {
  id: string;
  name: string;
  doc_type: string;
  reference_url: string | null;
};

export function DocumentRow({
  doc,
  isLast,
  canManage,
}: {
  doc: DocumentRow;
  isLast: boolean;
  canManage: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: (fd: FormData) => Promise<{ error?: string } | void>, formData: FormData) {
    setPending(true);
    setError(null);
    const result = await action(formData);
    setPending(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
  }

  if (editing && canManage) {
    return (
      <form
        className={`flex flex-wrap items-center gap-2 px-3.5 py-3 ${isLast ? "" : "border-b border-border"}`}
        action={(fd) => run(updateDocument, fd)}
      >
        <input type="hidden" name="id" value={doc.id} />
        <input
          name="name"
          defaultValue={doc.name}
          required
          className="min-w-[9rem] flex-1 rounded-xl border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-accent"
        />
        <select
          name="doc_type"
          defaultValue={doc.doc_type}
          className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-accent"
        >
          {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          name="reference_url"
          type="text"
          placeholder="Enlace (Drive, etc.)"
          defaultValue={doc.reference_url ?? ""}
          className="min-w-[10rem] flex-1 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground disabled:opacity-50"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground"
        >
          Cancelar
        </button>
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </form>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-3.5 py-3 ${isLast ? "" : "border-b border-border"}`}>
      <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-xl bg-accent-soft">
        <FolderIcon className="h-4 w-4 text-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{doc.name}</p>
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
          {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
        </span>
      </div>
      {doc.reference_url && (
        <a
          href={doc.reference_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${doc.name}`}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:text-accent"
        >
          <ExternalLinkIcon className="h-4 w-4" />
        </a>
      )}
      {canManage && (
        <>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground"
          >
            Editar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("id", doc.id);
              run(deleteDocument, fd);
            }}
            className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-warning transition-colors hover:bg-warning-soft disabled:opacity-50"
          >
            Eliminar
          </button>
        </>
      )}
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
