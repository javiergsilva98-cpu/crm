"use client";

import { useRouter } from "next/navigation";
import { CLUB_ROLES, CLUB_ROLE_LABELS, DEMO_ROLE_COOKIE, type ClubRole } from "@/lib/demo-role";

export function RoleSwitcher({ current }: { current: ClubRole }) {
  const router = useRouter();

  function handleChange(role: string) {
    document.cookie = `${DEMO_ROLE_COOKIE}=${role}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-3 pr-2 text-xs">
      <span className="hidden text-muted sm:inline">Viendo como</span>
      <select
        id="demo-role"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-full bg-transparent py-1 text-xs font-semibold text-foreground outline-none"
      >
        {CLUB_ROLES.map((role) => (
          <option key={role} value={role}>
            {CLUB_ROLE_LABELS[role]}
          </option>
        ))}
      </select>
    </div>
  );
}
