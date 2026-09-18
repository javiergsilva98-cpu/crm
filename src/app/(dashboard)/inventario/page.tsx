import { createClient } from "@/lib/supabase/server";
import { getDemoRole } from "@/lib/demo-context";
import { BoxIcon } from "@/components/icons";
import { ExportLink } from "@/components/export-link";
import { RestockForm } from "./restock-form";

const EXPORT_ROLES = ["admin", "presidente", "tesorero"];

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
  const canRestock = demoRole === "admin" || demoRole === "presidente" || demoRole === "bodeguero";

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Inventario</h1>
        {EXPORT_ROLES.includes(demoRole) && <ExportLink href="/api/export/inventario" label="Reposiciones" />}
      </div>

      <div className="mb-7 overflow-hidden rounded-[18px] border border-border bg-card">
        {rows.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-3.5 py-3 ${idx !== rows.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-xl bg-accent-soft">
              <BoxIcon className="h-4 w-4 text-accent" />
            </div>
            <p className="flex-1 text-sm font-semibold text-foreground">{item.name}</p>
            <p className="text-sm font-bold text-foreground">
              {item.current_stock} <span className="font-normal text-muted">{item.unit}</span>
            </p>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="px-3.5 py-6 text-center text-sm text-muted">No hay artículos de ejemplo todavía.</p>
        )}
      </div>

      {canRestock ? (
        <>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Registrar reposición</p>
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
