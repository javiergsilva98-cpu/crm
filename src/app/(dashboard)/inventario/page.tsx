import { createClient } from "@/lib/supabase/server";
import { getDemoRole } from "@/lib/demo-context";
import { ExportLink } from "@/components/export-link";
import { RestockForm } from "./restock-form";
import { InventoryItemRow } from "./inventory-item-row";

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
    supabase
      .from("inventory_items")
      .select("id, name, unit, current_stock, low_stock_threshold")
      .order("name"),
    supabase.from("members").select("id, full_name").eq("status", "activo").order("full_name"),
  ]);

  const rows = items ?? [];
  const canRestock = demoRole === "admin" || demoRole === "presidente" || demoRole === "bodeguero";
  const lowStock = rows.filter((item) => item.current_stock <= item.low_stock_threshold);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Inventario</h1>
        {EXPORT_ROLES.includes(demoRole) && <ExportLink href="/api/export/inventario" label="Reposiciones" />}
      </div>

      {lowStock.length > 0 && (
        <div className="mb-5 rounded-[18px] border border-warning-soft bg-warning-soft/40 p-4">
          <p className="text-sm font-bold text-warning">
            Quedan pocas unidades de {lowStock.length} artículo{lowStock.length === 1 ? "" : "s"}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {lowStock.map((i) => `${i.name} (${i.current_stock} ${i.unit})`).join(" · ")}
          </p>
        </div>
      )}

      <div className="mb-7 overflow-hidden rounded-[18px] border border-border bg-card">
        {rows.map((item, idx) => (
          <InventoryItemRow
            key={item.id}
            item={item}
            isLast={idx === rows.length - 1}
            canEditThreshold={canRestock}
          />
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
