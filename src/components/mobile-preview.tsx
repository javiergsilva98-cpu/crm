"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PhoneIcon, XIcon } from "@/components/icons";

export function MobilePreviewButton() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Vista previa móvil"
        className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-muted transition-colors hover:text-foreground sm:flex"
      >
        <PhoneIcon className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar vista previa"
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <XIcon className="h-5 w-5" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col rounded-[3rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl"
            style={{ width: "min(390px, 42vh)", aspectRatio: "390 / 844" }}
          >
            <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-7 w-36 -translate-x-1/2 rounded-b-2xl bg-neutral-900" />
            <div className="h-full w-full overflow-hidden rounded-[2.5rem] bg-background">
              <iframe
                key={pathname}
                src={pathname}
                title="Vista previa móvil de CLUB 26"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
