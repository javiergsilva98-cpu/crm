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
    <div className="flex items-center gap-2">
      <label htmlFor="demo-member" className="text-sm text-muted">
        Actuando como socio
      </label>
      <select
        id="demo-member"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-border px-2 py-1 text-sm"
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
