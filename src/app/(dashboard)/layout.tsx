import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";

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

  const profile = await getCurrentProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              CRM
            </Link>
            <Link href="/empresas" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              Empresas
            </Link>
            <Link href="/contactos" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              Contactos
            </Link>
            <Link href="/oportunidades" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              Oportunidades
            </Link>
            <Link href="/tareas" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              Tareas
            </Link>
            {profile?.role === "admin" && (
              <Link href="/usuarios" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Usuarios
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-500">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="text-sm text-gray-600 dark:text-gray-400 underline" type="submit">
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
