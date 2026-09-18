"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  CupIcon,
  WalletIcon,
  BoxIcon,
  CalendarIcon,
  VoteIcon,
  FolderIcon,
  ShieldIcon,
  UserPlusIcon,
  PlusIcon,
  XIcon,
} from "@/components/icons";

const ICON_BY_HREF: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  "/": HomeIcon,
  "/socios": UsersIcon,
  "/consumos": CupIcon,
  "/tesoreria": WalletIcon,
  "/inventario": BoxIcon,
  "/calendario": CalendarIcon,
  "/votaciones": VoteIcon,
  "/documentos": FolderIcon,
  "/usuarios": UserPlusIcon,
  "/auditoria": ShieldIcon,
};

// Máximo de accesos que caben cómodamente en la píldora antes de agrupar
// el resto bajo "Más" — evita el scroll horizontal cuando un rol (admin,
// presidencia) tiene muchas secciones.
const MAX_VISIBLE = 4;

export function BottomNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const overflowing = items.length > MAX_VISIBLE + 1;
  const visible = overflowing ? items.slice(0, MAX_VISIBLE) : items;
  const overflow = overflowing ? items.slice(MAX_VISIBLE) : [];
  const overflowActive = overflow.some((item) => item.href === pathname);

  return (
    <>
      <nav
        className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+16px)] z-40 flex items-center justify-between gap-1 rounded-[22px] border border-border bg-card p-2 shadow-[0_12px_28px_-10px_rgba(28,27,31,0.22)] sm:hidden"
        aria-label="Navegación principal"
      >
        {visible.map((item) => {
          const Icon = ICON_BY_HREF[item.href] ?? HomeIcon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`flex w-14 flex-shrink-0 items-center justify-center rounded-2xl py-2.5 transition-colors ${
                active ? "bg-accent text-accent-foreground" : "text-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
        {overflowing && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="Más secciones"
            className={`flex w-14 flex-shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl py-2.5 transition-colors ${
              overflowActive ? "bg-accent text-accent-foreground" : "text-muted"
            }`}
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        )}
      </nav>

      {moreOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-[26px] bg-card p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Más secciones</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-foreground"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {overflow.map((item) => {
                const Icon = ICON_BY_HREF[item.href] ?? HomeIcon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        active ? "bg-accent text-accent-foreground" : "bg-accent-soft text-accent"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-center text-[11px] text-muted">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
