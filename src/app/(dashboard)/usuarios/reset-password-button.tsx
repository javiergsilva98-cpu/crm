"use client";

import { useState } from "react";
import { resetUserPassword } from "./actions";

export function ResetPasswordButton({ profileId }: { profileId: string }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ password?: string; error?: string } | null>(null);

  async function handleClick() {
    setPending(true);
    setResult(null);
    const outcome = await resetUserPassword(profileId);
    setPending(false);
    if ("error" in outcome && outcome.error) {
      setResult({ error: outcome.error });
    } else if ("password" in outcome) {
      setResult({ password: outcome.password });
    }
  }

  if (result?.password) {
    return (
      <div className="w-full rounded-xl border border-success-soft bg-success-soft/40 p-2.5 text-xs">
        <p className="font-semibold text-foreground">
          Nueva contraseña: <span className="font-mono">{result.password}</span>
        </p>
        <p className="mt-0.5 text-muted">
          Entrégasela a la persona ahora — no se volverá a mostrar. Le pedirá cambiarla al entrar.
        </p>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="mt-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground disabled:opacity-50"
      >
        {pending ? "..." : "Recuperar contraseña"}
      </button>
      {result?.error && <p className="text-[11px] text-red-600">{result.error}</p>}
    </div>
  );
}
