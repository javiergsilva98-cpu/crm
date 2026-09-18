import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDemoRole } from "@/lib/demo-context";
import { NAV_BY_ROLE } from "@/lib/demo-role";
import { RoleSwitcher } from "@/components/role-switcher";
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

  const demoRole = await getDemoRole();
  const navItems = NAV_BY_ROLE[demoRole];
  const mobileNavItems = [{ href: "/", label: "Panel" }, ...navItems];
  const firstName = (user.email ?? "").split("@")[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

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
