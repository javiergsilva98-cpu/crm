"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function UserMenu({
  companyName,
  userEmail,
  isAdmin,
}: {
  companyName: string;
  userEmail: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-sunken"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-calm text-xs font-semibold text-base">
          {companyName.charAt(0).toUpperCase() || "?"}
        </span>
        <span className="max-w-[10rem] truncate">{companyName}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-mute">
          <path d="M3 4.5 6 7.5 9 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 z-30 mt-1 w-56 rounded-lg border border-border bg-raised py-1 shadow-lg shadow-black/10">
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium text-ink">{companyName}</p>
            <p className="truncate text-xs text-ink-mute">{userEmail}</p>
          </div>
          <div className="py-1">
            {isAdmin && (
              <Link
                href="/configuracion?tab=usuarios"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
              >
                Usuarios
              </Link>
            )}
            <Link
              href="/configuracion?tab=empresa"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
            >
              Perfil de empresa
            </Link>
          </div>
          <div className="border-t border-border pt-1">
            <form action="/auth/signout" method="post">
              <button type="submit" className="block w-full px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-sunken">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
