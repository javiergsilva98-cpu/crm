"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center text-neutral-900">
        <div>
          <p className="text-xl font-semibold">Algo falló</p>
          <p className="mt-1 max-w-sm text-sm text-neutral-500">
            Hubo un problema al cargar el CRM. Prueba a reintentar en unos segundos.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
