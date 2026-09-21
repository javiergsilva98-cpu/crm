"use client";

import { useState } from "react";
import { UserPlusIcon } from "@/components/icons";
import { acceptResponsibility, rejectResponsibility } from "./actions";

export function IncomingTransferBanner({ transferId, fromName }: { transferId: string; fromName: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function respond(accept: boolean) {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("transfer_id", transferId);
    const result = accept ? await acceptResponsibility(fd) : await rejectResponsibility(fd);
    setPending(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (done) return null;

  return (
    <div className="mb-4 rounded-[18px] border border-accent/30 bg-accent-soft p-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent/15">
          <UserPlusIcon className="h-[18px] w-[18px] text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-accent">{fromName} te cede la responsabilidad del local</p>
          <p className="text-xs text-accent/80">Mientras no respondas, sigue siendo responsable quien la cede.</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => respond(true)}
          className="flex-1 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          Aceptar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => respond(false)}
          className="flex-1 rounded-xl border border-accent/40 px-3 py-2 text-sm font-semibold text-accent disabled:opacity-50"
        >
          Rechazar
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
