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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
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
