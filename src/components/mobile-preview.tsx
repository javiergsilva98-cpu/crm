"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PhoneIcon, XIcon } from "@/components/icons";

const LOAD_TIMEOUT_MS = 8000;

export function MobilePreviewButton() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const pathname = usePathname();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleOpen() {
    setLoaded(false);
    setTimedOut(false);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  useEffect(() => {
    if (!open) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [open, pathname]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Vista previa móvil"
        className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-muted transition-colors hover:text-foreground sm:flex"
      >
        <PhoneIcon className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
          onClick={handleClose}
        >
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar vista previa"
            className="fixed right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <XIcon className="h-5 w-5" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative my-6 flex flex-shrink-0 flex-col rounded-[3rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl"
            style={{
              width: "min(390px, 42vh, 88vw)",
              aspectRatio: "390 / 844",
            }}
          >
            <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-neutral-900" />
            <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] bg-background">
              {!loaded && !timedOut && (
                <div className="absolute inset-0 z-[1] flex items-center justify-center bg-background">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-accent" />
                </div>
              )}
              {timedOut && !loaded && (
                <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-background px-6 text-center">
                  <p className="text-sm font-semibold text-foreground">No se pudo cargar la vista previa</p>
                  <p className="text-xs text-muted">
                    Puede que el navegador esté bloqueando la vista en un iframe.
                  </p>
                  <a
                    href={pathname}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground"
                  >
                    Abrir en pestaña nueva
                  </a>
                </div>
              )}
              <iframe
                key={pathname}
                src={pathname}
                title="Vista previa móvil de CLUB 26"
                className="h-full w-full border-0"
                onLoad={() => {
                  setLoaded(true);
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
