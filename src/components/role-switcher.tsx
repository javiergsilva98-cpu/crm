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
    <div className="flex items-center gap-2">
      <label htmlFor="demo-role" className="text-sm text-gray-500">
        Viendo como
      </label>
      <select
        id="demo-role"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm"
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
