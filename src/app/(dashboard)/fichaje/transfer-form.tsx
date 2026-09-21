"use client";

import { useState } from "react";
import { transferResponsibility } from "./actions";

type Member = { id: string; full_name: string };

export function TransferForm({
  presentMembers,
  pendingTransfer,
}: {
  presentMembers: Member[];
  pendingTransfer: { toName: string } | null;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("Elige a quién cedérsela.");
      return;
    }
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("to_member_id", selected);
    const result = await transferResponsibility(fd);
    setPending(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    setSelected("");
  }

  return (
    <div className="rounded-[18px] border border-accent/30 bg-accent-soft p-4">
      <p className="text-sm font-bold text-accent">Eres responsable del local ahora mismo</p>
      <p className="mt-0.5 text-xs text-accent/80">
        Cede la responsabilidad a otro socio presente, o cierra el local directamente con el botón de
        arriba.
      </p>

      {pendingTransfer ? (
        <p className="mt-3 rounded-xl bg-white/40 px-3 py-2 text-xs font-semibold text-accent">
          En espera de que {pendingTransfer.toName} acepte la cesión. Sigues siendo responsable mientras
          tanto.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">Elige un socio presente</option>
            {presentMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >
            {pending ? "..." : "Ceder responsabilidad"}
          </button>
        </form>
      )}
      {presentMembers.length === 0 && !pendingTransfer && (
        <p className="mt-2 text-xs text-accent/80">No hay más socios fichados como presentes ahora mismo.</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
