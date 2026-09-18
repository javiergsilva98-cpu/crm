"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="mb-1 text-lg font-semibold tracking-tight text-foreground">Algo ha ido mal</h1>
        <p className="mb-6 text-sm text-muted">
          Ha ocurrido un error inesperado. Puedes intentarlo de nuevo o volver al panel.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent"
          >
            Ir al panel
          </Link>
        </div>
      </div>
    </div>
  );
}
