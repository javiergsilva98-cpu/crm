import { cookies } from "next/headers";
import {
  DEMO_ROLE_COOKIE,
  DEMO_MEMBER_COOKIE,
  DEFAULT_DEMO_ROLE,
  isClubRole,
  type ClubRole,
} from "@/lib/demo-role";

export async function getDemoRole(): Promise<ClubRole> {
  const cookieStore = await cookies();
  const value = cookieStore.get(DEMO_ROLE_COOKIE)?.value;
  return isClubRole(value) ? value : DEFAULT_DEMO_ROLE;
}

export async function getDemoMemberIdCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_MEMBER_COOKIE)?.value ?? null;
}
