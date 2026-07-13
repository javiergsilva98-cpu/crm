"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/empresas", label: "Empresas" },
  { href: "/contactos", label: "Contactos" },
  { href: "/oportunidades", label: "Oportunidades" },
  { href: "/canales", label: "Canales" },
  { href: "/tareas", label: "Tareas" },
];

export function Nav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, { href: "/usuarios", label: "Usuarios" }] : LINKS;

  return (
    <>
      <nav className="hidden items-center gap-6 md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm transition-colors hover:text-ink ${
              pathname === link.href ? "text-ink" : "text-ink-soft"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:text-ink md:hidden"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-border bg-raised px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm transition-colors hover:bg-sunken hover:text-ink ${
                  pathname === link.href ? "text-ink" : "text-ink-soft"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
