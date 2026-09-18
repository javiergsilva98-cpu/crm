import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { NAV_BY_ROLE } from "@/lib/demo-role";
import { RoleSwitcher } from "@/components/role-switcher";
import { MemberSwitcher } from "@/components/member-switcher";
import { BottomNav } from "@/components/bottom-nav";
import { LogOutIcon } from "@/components/icons";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("must_change_password").eq("id", user.id).single();
  if (profile?.must_change_password) {
    redirect("/cambiar-password");
  }

  const demoRole = await getDemoRole();
  const navItems = NAV_BY_ROLE[demoRole];
  const mobileNavItems = [{ href: "/", label: "Panel" }, ...navItems];
  const firstName = (user.email ?? "").split("@")[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  let socios: { id: string; full_name: string }[] = [];
  let currentMemberId = "";
  if (demoRole === "socio") {
    const { data } = await supabase
      .from("members")
      .select("id, full_name")
      .eq("club_role", "socio")
      .eq("status", "activo")
      .order("full_name");
    socios = data ?? [];
    const cookieId = await getDemoMemberIdCookie();
    currentMemberId = socios.find((m) => m.id === cookieId)?.id ?? socios[0]?.id ?? "";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-sm font-extrabold text-accent"
            >
              26
            </Link>
            <div>
              <p className="text-xs font-medium text-muted">Hola, {displayName}</p>
              <p className="text-base font-bold tracking-tight text-foreground">CLUB 26</p>
            </div>
          </div>

          <nav className="hidden gap-x-6 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {demoRole === "socio" && socios.length > 0 && (
              <MemberSwitcher members={socios} current={currentMemberId} />
            )}
            <RoleSwitcher current={demoRole} />
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                aria-label="Salir"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-muted transition-colors hover:text-foreground"
              >
                <LogOutIcon className="h-[18px] w-[18px]" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-28 sm:py-8 sm:pb-8">
        {children}
      </main>
      <BottomNav items={mobileNavItems} />
    </div>
  );
}
