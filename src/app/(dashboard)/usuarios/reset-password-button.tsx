"use client";

import { useState } from "react";
import { resetUserPassword } from "./actions";

export function ResetPasswordButton({ profileId, email }: { profileId: string; email: string }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ password?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    setPending(true);
    setResult(null);
    setCopied(false);
    const outcome = await resetUserPassword(profileId);
    setPending(false);
    if ("error" in outcome && outcome.error) {
      setResult({ error: outcome.error });
    } else if ("password" in outcome) {
      setResult({ password: outcome.password });
    }
  }

  async function handleCopy() {
    if (!result?.password) return;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const message = `Tu contraseña de CLUB 26 se ha restablecido.

Entra en ${url} con tu usuario: ${email} y tu contraseña: ${result.password}.

Es una contraseña provisional — tendrás que cambiarla en tu próximo inicio de sesión.`;
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {copied ? "Copiado" : "Copiar mensaje"}
          </button>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground"
          >
            Cerrar
          </button>
        </div>
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
        {pending ? "..." : "Restablecer contraseña"}
      </button>
      {result?.error && <p className="text-[11px] text-red-600">{result.error}</p>}
    </div>
  );
}
