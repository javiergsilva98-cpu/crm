import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDemoRole } from "@/lib/demo-context";
import { NAV_BY_ROLE } from "@/lib/demo-role";
import { RoleSwitcher } from "@/components/role-switcher";
import { BottomNav } from "@/components/bottom-nav";

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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
              CLUB 26
            </Link>
            <div className="hidden gap-x-6 sm:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <RoleSwitcher current={demoRole} />
            <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button
                className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
                type="submit"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 sm:py-8 sm:pb-8">
        {children}
      </main>
      <BottomNav items={mobileNavItems} />
    </div>
  );
}
