"use client";

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
  UserPlusIcon,
} from "@/components/icons";

const ICON_BY_HREF: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  "/": HomeIcon,
  "/socios": UsersIcon,
  "/consumos": CupIcon,
  "/tesoreria": WalletIcon,
  "/inventario": BoxIcon,
  "/calendario": CalendarIcon,
  "/votaciones": VoteIcon,
  "/usuarios": UserPlusIcon,
};

export function BottomNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+16px)] z-40 flex items-center gap-1 overflow-x-auto rounded-[22px] border border-border bg-card p-2 shadow-[0_12px_28px_-10px_rgba(28,27,31,0.22)] sm:hidden"
      aria-label="Navegación principal"
    >
      {items.map((item) => {
        const Icon = ICON_BY_HREF[item.href] ?? HomeIcon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={`flex w-14 flex-shrink-0 flex-col items-center gap-1 rounded-2xl py-2.5 text-[10px] font-bold transition-colors ${
              active ? "bg-accent text-accent-foreground" : "text-muted"
            }`}
          >
            <Icon className="h-5 w-5" />
            {active && item.label}
          </Link>
        );
      })}
    </nav>
  );
}
