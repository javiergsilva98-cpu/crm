"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, UsersIcon, CupIcon, WalletIcon, BoxIcon } from "@/components/icons";

const ICON_BY_HREF: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  "/": HomeIcon,
  "/socios": UsersIcon,
  "/consumos": CupIcon,
  "/tesoreria": WalletIcon,
  "/inventario": BoxIcon,
};

export function BottomNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] sm:hidden">
      {items.map((item) => {
        const Icon = ICON_BY_HREF[item.href] ?? HomeIcon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
