import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDemoRole } from "@/lib/demo-context";
import { ExportLink } from "@/components/export-link";
import { RestockForm } from "./restock-form";
import { InventoryItemRow } from "./inventory-item-row";
import { MarginSettingsForm } from "./margin-settings-form";

const EXPORT_ROLES = ["admin", "presidente", "vicepresidente", "tesorero"];
// Vista completa (stock + coste + precio de venta): solo gestión, el
// bodeguero no la necesita, usa el formulario de reposición de abajo.
const INVENTORY_VIEW_ROLES = ["admin", "presidente", "vicepresidente", "tesorero"];
const RESTOCK_ROLES = ["admin", "presidente", "vicepresidente", "tesorero", "bodeguero"];
const CREATE_NEW_ROLES = ["admin", "presidente", "vicepresidente", "bodeguero"];
const COUNT_ROLES = ["admin", "presidente", "vicepresidente", "bodeguero"];

type RawItem = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  low_stock_threshold: number;
  current_cost: number;
  menu_items: { name: string; price: number; needs_price_review: boolean }[] | null;
};

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

  const [{ data: itemsData }, { data: members }, { data: settingsData }, { data: reviewData }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, unit, current_stock, low_stock_threshold, current_cost, menu_items(name, price, needs_price_review)")
      .order("name"),
    supabase.from("members").select("id, full_name").eq("status", "activo").order("full_name"),
    supabase.from("club_settings").select("sale_margin_pct, guest_margin_pct, min_margin_pct").eq("id", true).maybeSingle(),
    supabase.from("menu_items").select("id, name, price, current_cost").eq("needs_price_review", true).eq("active", true),
  ]);

  const raw = (itemsData ?? []) as unknown as RawItem[];
  const rows = raw.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    current_stock: item.current_stock,
    low_stock_threshold: item.low_stock_threshold,
    current_cost: item.current_cost,
    sale_price: item.menu_items && item.menu_items.length > 0 ? item.menu_items[0].price : null,
    needsPriceReview: item.menu_items?.some((mi) => mi.needs_price_review) ?? false,
  }));

  const canRestock = RESTOCK_ROLES.includes(demoRole);
  const canCreateNew = CREATE_NEW_ROLES.includes(demoRole);
  const canSeeFullView = INVENTORY_VIEW_ROLES.includes(demoRole);
  const lowStock = rows.filter((item) => item.current_stock <= item.low_stock_threshold);
  const saleMarginPct = settingsData?.sale_margin_pct ?? 30;
  const guestMarginPct = settingsData?.guest_margin_pct ?? 50;
  const minMarginPct = settingsData?.min_margin_pct ?? 15;
  const needsReview = reviewData ?? [];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Inventario</h1>
        <div className="flex items-center gap-3">
          {COUNT_ROLES.includes(demoRole) && (
            <Link href="/inventario/conteo" className="text-xs font-semibold text-accent">
              Conteo físico →
            </Link>
          )}
          {canSeeFullView && EXPORT_ROLES.includes(demoRole) && (
            <ExportLink href="/api/export/inventario" label="Reposiciones" />
          )}
        </div>
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

      {canSeeFullView ? (
        <>
          {needsReview.length > 0 && (
            <div className="mb-5 rounded-[18px] border border-warning-soft bg-warning-soft/40 p-4">
              <p className="text-sm font-bold text-warning">
                {needsReview.length} artículo{needsReview.length === 1 ? "" : "s"} pendiente
                {needsReview.length === 1 ? "" : "s"} de revisión de precio
              </p>
              <p className="mt-0.5 text-xs text-muted">
                El margen configurado no llega al mínimo de seguridad para el coste actual de{" "}
                {needsReview.map((i) => i.name).join(", ")}. El precio no se ha tocado solo; resolverlo
                puede pasar por una votación express (Fase 5) o ajustar el margen.
              </p>
            </div>
          )}

          <div className="mb-7 overflow-hidden rounded-[18px] border border-border bg-card">
            {rows.map((item, idx) => (
              <InventoryItemRow
                key={item.id}
                item={item}
                isLast={idx === rows.length - 1}
                canEditThreshold={demoRole === "admin" || demoRole === "presidente" || demoRole === "vicepresidente" || demoRole === "bodeguero"}
              />
            ))}
            {rows.length === 0 && (
              <p className="px-3.5 py-6 text-center text-sm text-muted">No hay artículos de ejemplo todavía.</p>
            )}
          </div>

          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">
            Margen de venta (calcula el precio de la carta a partir del coste)
          </p>
          <div className="mb-7">
            <MarginSettingsForm saleMarginPct={saleMarginPct} guestMarginPct={guestMarginPct} minMarginPct={minMarginPct} />
          </div>
        </>
      ) : (
        <p className="mb-5 text-sm text-muted">
          Como bodeguero registras reposiciones y el conteo físico. El detalle de coste y precio de
          venta lo consulta gestión (presidencia, vicepresidencia o tesorería).
        </p>
      )}

      {canRestock ? (
        <>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Registrar reposición</p>
          <RestockForm items={rows} members={members ?? []} canCreateNew={canCreateNew} />
        </>
      ) : (
        <p className="text-sm text-muted">
          Consultas el inventario, pero registrar reposiciones es cosa de tesorería y bodega.
        </p>
      )}
    </div>
  );
}
