"use client";

import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <svg width="36" height="36" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-danger">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6.5v4M10 13.2v.2" strokeLinecap="round" />
      </svg>
      <div>
        <p className="font-heading text-xl font-semibold text-ink">No se pudo cargar esta página</p>
        <p className="mt-1 max-w-sm text-sm text-ink-mute">
          Puede que la conexión con el servidor haya fallado un momento. Prueba a reintentar — si vuelve a pasar, dilo con la hora exacta.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover"
      >
        Reintentar
      </button>
    </div>
  );
}
