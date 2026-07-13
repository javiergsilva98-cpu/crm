import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold text-gray-900">
              CRM
            </Link>
            <Link href="/empresas" className="text-sm text-gray-600 hover:text-gray-900">
              Empresas
            </Link>
            <Link href="/contactos" className="text-sm text-gray-600 hover:text-gray-900">
              Contactos
            </Link>
            <Link href="/oportunidades" className="text-sm text-gray-600 hover:text-gray-900">
              Oportunidades
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="text-sm text-gray-600 underline" type="submit">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
