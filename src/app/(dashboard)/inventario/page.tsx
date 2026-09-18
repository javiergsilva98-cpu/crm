import { createClient } from "@/lib/supabase/server";
import { getDemoRole } from "@/lib/demo-context";
import { RestockForm } from "./restock-form";

export default async function InventarioPage() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();

  if (demoRole === "secretario" || demoRole === "socio") {
    return (
      <p className="text-sm text-muted">
        El inventario no forma parte de tu rol en esta demo. Cambia a Presidente, Tesorero o
        Bodeguero arriba a la derecha para verlo.
      </p>
    );
  }

  const [{ data: items }, { data: members }] = await Promise.all([
    supabase.from("inventory_items").select("id, name, unit, current_stock").order("name"),
    supabase.from("members").select("id, full_name").eq("status", "activo").order("full_name"),
  ]);

  const rows = items ?? [];
  const canRestock = demoRole === "presidente" || demoRole === "bodeguero";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Inventario</h1>

      <div className="mb-8 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted/70">
              <th className="px-4 py-3">Artículo</th>
              <th className="px-4 py-3">Stock actual</th>
              <th className="px-4 py-3">Unidad</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                <td className="px-4 py-3 text-muted">{item.current_stock}</td>
                <td className="px-4 py-3 text-muted">{item.unit}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted/70">
                  No hay artículos de ejemplo todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canRestock ? (
        <>
          <h2 className="mb-3 text-lg font-semibold">Registrar reposición</h2>
          <RestockForm items={rows} members={members ?? []} />
        </>
      ) : (
        <p className="text-sm text-muted">
          Como tesorero puedes consultar el inventario, pero registrar reposiciones es cosa del
          bodeguero.
        </p>
      )}
    </div>
  );
}
