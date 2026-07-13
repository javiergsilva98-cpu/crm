import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "./nav";

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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative border-b border-border bg-raised">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold text-ink">
              CRM
            </Link>
            <Nav />
          </div>
          <div className="flex items-center gap-4">
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
            <form action="/auth/signout" method="post">
              <button className="text-sm text-ink-soft underline" type="submit">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
