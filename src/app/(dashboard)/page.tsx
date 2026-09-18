import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDemoRole } from "@/lib/demo-context";
import { CLUB_ROLE_LABELS, NAV_BY_ROLE } from "@/lib/demo-role";

export default async function DashboardHome() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();
  const navItems = NAV_BY_ROLE[demoRole];

  const [{ count: members }, { count: pendingEvents }] = await Promise.all([
    supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "activo"),
    supabase.from("events").select("*", { count: "exact", head: true }).neq("charge_status", "cobrado"),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Panel de CLUB 26</h1>
      <p className="mb-6 text-sm text-gray-500">
        Viendo la demo como <strong>{CLUB_ROLE_LABELS[demoRole]}</strong>. Cambia de rol arriba a la
        derecha para ver qué ve cada uno.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Socios activos</p>
          <p className="mt-2 text-3xl font-semibold">{members ?? 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Eventos sin cobrar del todo</p>
          <p className="mt-2 text-3xl font-semibold">{pendingEvents ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-gray-400"
          >
            <p className="text-base font-medium text-gray-900">{item.label}</p>
            <p className="mt-1 text-sm text-gray-500">Ir a {item.label.toLowerCase()} →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
