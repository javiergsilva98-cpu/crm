"use client";

import { useRouter } from "next/navigation";
import { DEMO_MEMBER_COOKIE } from "@/lib/demo-role";

export function MemberSwitcher({
  members,
  current,
}: {
  members: { id: string; full_name: string }[];
  current: string;
}) {
  const router = useRouter();

  function handleChange(id: string) {
    document.cookie = `${DEMO_MEMBER_COOKIE}=${id}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-3 pr-2 text-xs">
      <span className="hidden text-muted sm:inline">Actuando como</span>
      <select
        id="demo-member"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-full bg-transparent py-1 text-xs font-semibold text-foreground outline-none"
      >
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.full_name}
          </option>
        ))}
      </select>
    </div>
  );
}
