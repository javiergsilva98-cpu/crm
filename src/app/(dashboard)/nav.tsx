"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS = [
  {
    label: "CRM",
    links: [
      { href: "/empresas", label: "Empresas" },
      { href: "/contactos", label: "Contactos" },
    ],
  },
  {
    label: "Ventas",
    links: [
      { href: "/oportunidades", label: "Oportunidades" },
      { href: "/facturas", label: "Facturas" },
      { href: "/gastos", label: "Gastos" },
    ],
  },
  {
    label: "Marketing",
    links: [
      { href: "/canales", label: "Canales" },
      { href: "/informes", label: "Informes" },
    ],
  },
  {
    label: "Equipo",
    links: [{ href: "/tareas", label: "Tareas" }],
  },
];

function GroupDropdown({ group, pathname }: { group: (typeof GROUPS)[number]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const isActive = group.links.some((l) => l.href === pathname);

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-sm transition-colors hover:text-ink ${
          isActive ? "text-ink" : "text-ink-soft"
        }`}
      >
        {group.label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 3.5L5 6.5L8 3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 z-10 min-w-36 rounded-md border border-border bg-raised py-1 shadow-lg shadow-black/10">
          {group.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-1.5 text-sm transition-colors hover:bg-sunken hover:text-ink ${
                pathname === link.href ? "text-ink" : "text-ink-soft"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden items-center gap-6 md:flex">
        {GROUPS.map((group) => (
          <GroupDropdown key={group.label} group={group} pathname={pathname} />
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
        <div className="absolute inset-x-0 top-full max-h-[calc(100vh-3.5rem)] overflow-y-auto border-b border-border bg-raised px-4 py-3 md:hidden">
          {GROUPS.map((group) => (
            <div key={group.label} className="mb-3 last:mb-0">
              <p className="mb-1 px-3 text-xs font-semibold tracking-wide text-ink-mute uppercase">{group.label}</p>
              <nav className="flex flex-col gap-1">
                {group.links.map((link) => (
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
          ))}
        </div>
      )}
    </>
  );
}
