import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "./nav";
import { UserMenu } from "./user-menu";

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

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("business_settings").select("legal_name").eq("owner_id", user.id).maybeSingle(),
  ]);
  const isAdmin = profile?.role === "admin";
  const companyName = settings?.legal_name || user.email || "Mi empresa";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative border-b border-border bg-raised print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              aria-label="Inicio"
              title="Inicio"
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 9.5 10 3l7 6.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4.5 8.5V16a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V8.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 17v-4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V17" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Nav />
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/ayuda"
              aria-label="Ayuda"
              title="Ayuda"
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="10" cy="10" r="8" />
                <path d="M7.5 7.8a2.5 2.5 0 1 1 3.3 2.4c-.6.3-1 .8-1 1.4v.4" strokeLinecap="round" />
                <circle cx="10" cy="14" r="0.75" fill="currentColor" stroke="none" />
              </svg>
            </Link>
            <Link
              href="/configuracion"
              aria-label="Configuración"
              title="Configuración"
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="10" cy="10" r="2.5" />
                <path
                  d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3L4.9 4.9"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
            <UserMenu companyName={companyName} userEmail={user.email ?? ""} isAdmin={isAdmin} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
