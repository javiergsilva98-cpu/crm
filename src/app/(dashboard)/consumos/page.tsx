import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { ExportLink } from "@/components/export-link";
import { MenuItemForm } from "./menu-item-form";
import { MenuItemRow } from "./menu-item-row";
import { GuestModeBoard } from "./guest-mode-board";
import { IncidentButton } from "./incident-button";
import { KeyIcon } from "@/components/icons";
import { MENU_MANAGE_ROLES, EXPORT_ROLES, FULL_HISTORY_ROLES } from "@/lib/permissions";

// El historial completo (todas las consumiciones, sin límite bajo) solo
// lo ve la directiva con acceso a tesorería. El resto de roles ven una
// capa de transparencia acotada (últimas ~20), igual que el socio.
const TRANSPARENCY_LIMIT = 20;

type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  guest_price: number;
  current_cost: number;
  needs_price_review: boolean;
  stock_mode: string;
};

export default async function ConsumosPage() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();

  const { data: menuItemsData } = await supabase
    .from("menu_items")
    .select("id, name, category, price, guest_price, current_cost, needs_price_review, stock_mode")
    .eq("active", true)
    .order("category")
    .order("name");
  const menuItems = (menuItemsData ?? []) as MenuItem[];
  const bebidas = menuItems.filter((i) => i.category === "bebida");
  const aperitivos = menuItems.filter((i) => i.category === "aperitivo");

  // Consumiciones funciona igual para todos los roles — cualquiera puede
  // pedir lo que toma, como un socio más — y quien además gestiona la
  // carta o ve el histórico completo (tesorería, presidencia...) tiene
  // esas secciones extra debajo, no en vez de poder pedir.
  const isFullHistory = FULL_HISTORY_ROLES.includes(demoRole);
  const canManageMenu = MENU_MANAGE_ROLES.includes(demoRole);

  const [{ data: activeMembersData }, { data: allMenuData }, { data: inventoryItemsData }] = await Promise.all([
    supabase.from("members").select("id, full_name").eq("status", "activo").order("full_name"),
    canManageMenu
      ? supabase
          .from("menu_items")
          .select(
            "id, name, category, price, guest_price, current_cost, needs_price_review, active, inventory_item_id, stock_mode",
          )
          .order("category")
          .order("name")
      : Promise.resolve({ data: null }),
    canManageMenu ? supabase.from("inventory_items").select("id, name").order("name") : Promise.resolve({ data: null }),
  ]);
  const members = activeMembersData ?? [];
  const cookieId = await getDemoMemberIdCookie();
  const currentId = members.find((m) => m.id === cookieId)?.id ?? members[0]?.id ?? "";
  const allMenu = allMenuData ?? [];
  const inventoryItems = inventoryItemsData ?? [];

  const [{ data: historyData }, { data: clubHistoryData }, { data: activePresence }] = await Promise.all([
    supabase
      .from("consumptions")
      .select("id, quantity, unit_price, is_guest, consumed_at, menu_items(name)")
      .eq("member_id", currentId)
      .order("consumed_at", { ascending: false })
      .limit(15),
    supabase
      .from("consumptions")
      .select("id, quantity, unit_price, is_guest, consumed_at, members(full_name), menu_items(name)")
      .order("consumed_at", { ascending: false })
      .limit(isFullHistory ? 30 : TRANSPARENCY_LIMIT),
    supabase.from("presence").select("id").eq("member_id", currentId).is("checked_out_at", null).maybeSingle(),
  ]);
  // No se puede pedir sin estar fichado en el local (mismo fichaje de
  // "Estoy en el local" de /fichaje) — se aplica también en el servidor
  // (markConsumption) y en la política RLS, esto es solo para no
  // mostrar siquiera el botón de pedir si ya sabemos que va a fallar.
  const isCheckedIn = !!activePresence;
  const history = (historyData ?? []) as unknown as Array<{
    id: string;
    quantity: number;
    unit_price: number;
    is_guest: boolean;
    consumed_at: string;
    menu_items: { name: string } | null;
  }>;
  const clubHistory = (clubHistoryData ?? []) as unknown as Array<{
    id: string;
    quantity: number;
    unit_price: number;
    is_guest: boolean;
    consumed_at: string;
    members: { full_name: string } | null;
    menu_items: { name: string } | null;
  }>;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Consumiciones</h1>
          <p className="text-sm text-muted">Toca para pedir lo que tomes</p>
        </div>
        {EXPORT_ROLES.includes(demoRole) && <ExportLink href="/api/export/consumos" label="Exportar" />}
      </div>

      {isCheckedIn ? (
        <GuestModeBoard bebidas={bebidas} aperitivos={aperitivos} memberId={currentId} members={members} />
      ) : (
        <Link
          href="/fichaje"
          className="mb-5 flex items-center gap-3 rounded-[18px] border border-warning/30 bg-warning-soft p-3.5"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-warning/15">
            <KeyIcon className="h-[18px] w-[18px] text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-warning">No estás fichado en el local</p>
            <p className="text-xs text-warning/80">
              Marca &quot;Estoy en el local&quot; en Fichaje para poder pedir.
            </p>
          </div>
        </Link>
      )}

      <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">Tu historial reciente</p>
      <HistoryTable
        rows={history.map((h) => ({
          id: h.id,
          date: h.consumed_at,
          item: h.menu_items?.name ?? "—",
          quantity: h.quantity,
          total: h.quantity * h.unit_price,
          isGuest: h.is_guest,
        }))}
        reporterMemberId={currentId}
      />

      <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">
        {isFullHistory ? "Consumiciones recientes (toda la barra)" : "Actividad reciente del club"}
      </p>
      <p className="mb-3 text-xs text-muted">
        {isFullHistory
          ? `Últimas ${clubHistory.length} consumiciones de todos los socios.`
          : "Últimas consumiciones de todos los socios, para que quede claro que todo se apunta."}
      </p>
      <HistoryTable
        rows={clubHistory.map((h) => ({
          id: h.id,
          date: h.consumed_at,
          member: h.members?.full_name,
          item: h.menu_items?.name ?? "—",
          quantity: h.quantity,
          total: h.quantity * h.unit_price,
          isGuest: h.is_guest,
        }))}
        reporterMemberId={currentId}
      />

      {canManageMenu && (
        <>
          <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">Carta</p>
          <p className="mb-3 text-xs text-muted">
            Vincula cada artículo a un artículo de bodega para que marcar un consumo descuente stock
            automáticamente. &quot;Compartido&quot; es para lo que se abre y se reparte entre varios
            socios (una botella): se reparte el coste y se descuenta 1 sola unidad.
          </p>
          <div className="mb-3 overflow-hidden rounded-[18px] border border-border bg-card">
            {allMenu.map((item, idx) => (
              <MenuItemRow key={item.id} item={item} isLast={idx === allMenu.length - 1} inventoryItems={inventoryItems} />
            ))}
            {allMenu.length === 0 && (
              <p className="px-3.5 py-6 text-center text-sm text-muted">Todavía no hay artículos en la carta.</p>
            )}
          </div>
          <MenuItemForm inventoryItems={inventoryItems} />
        </>
      )}
    </div>
  );
}

function HistoryTable({
  rows,
  reporterMemberId,
}: {
  rows: {
    id: string;
    date: string;
    member?: string;
    item: string;
    quantity: number;
    total: number;
    isGuest: boolean;
  }[];
  reporterMemberId: string;
}) {
  const showMember = rows.some((r) => r.member !== undefined);
  return (
    <div className="overflow-hidden rounded-[18px] border border-border bg-card">
      {rows.map((r, idx) => (
        <div
          key={r.id}
          className={`flex items-center gap-3 px-3.5 py-3 ${idx !== rows.length - 1 ? "border-b border-border" : ""}`}
        >
          <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-extrabold text-accent">
            {r.quantity}×
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {r.item}
              {showMember && <span className="font-normal text-muted"> · {r.member}</span>}
              {r.isGuest && (
                <span className="ml-1.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent">
                  Invitado
                </span>
              )}
            </p>
            <p className="text-xs text-muted">
              {new Date(r.date).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
            </p>
            {reporterMemberId && (
              <div className="mt-1">
                <IncidentButton consumptionId={r.id} reporterMemberId={reporterMemberId} />
              </div>
            )}
          </div>
          <p className="text-sm font-bold text-foreground">{r.total.toFixed(2)} €</p>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="px-3.5 py-6 text-center text-sm text-muted">Todavía no hay consumiciones.</p>
      )}
    </div>
  );
}
