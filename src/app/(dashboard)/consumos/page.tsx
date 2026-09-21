import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { ExportLink } from "@/components/export-link";
import { MenuItemForm } from "./menu-item-form";
import { MenuItemRow } from "./menu-item-row";
import { MarkConsumptionForm } from "./mark-consumption-form";
import { ShareConsumptionForm } from "./share-consumption-form";
import { IncidentButton } from "./incident-button";

const MENU_MANAGE_ROLES = ["admin", "presidente", "tesorero", "bodeguero"];
const EXPORT_ROLES = ["admin", "presidente", "tesorero"];
// El historial completo (todas las consumiciones, sin límite bajo) solo
// lo ve la directiva con acceso a tesorería. El resto de roles ven una
// capa de transparencia acotada (últimas ~20), igual que el socio.
const FULL_HISTORY_ROLES = ["admin", "presidente", "tesorero"];
const TRANSPARENCY_LIMIT = 20;

type MenuItem = { id: string; name: string; category: string; price: number; stock_mode: string };

export default async function ConsumosPage() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();

  const { data: menuItemsData } = await supabase
    .from("menu_items")
    .select("id, name, category, price, stock_mode")
    .eq("active", true)
    .order("category")
    .order("name");
  const menuItems = (menuItemsData ?? []) as MenuItem[];
  const bebidas = menuItems.filter((i) => i.category === "bebida");
  const aperitivos = menuItems.filter((i) => i.category === "aperitivo");

  if (demoRole === "socio") {
    const { data: socios } = await supabase
      .from("members")
      .select("id, full_name")
      .eq("club_role", "socio")
      .eq("status", "activo")
      .order("full_name");
    const list = socios ?? [];
    const cookieId = await getDemoMemberIdCookie();
    const currentId = list.find((m) => m.id === cookieId)?.id ?? list[0]?.id ?? "";

    const [{ data: historyData }, { data: clubHistoryData }] = await Promise.all([
      supabase
        .from("consumptions")
        .select("id, quantity, unit_price, consumed_at, menu_items(name)")
        .eq("member_id", currentId)
        .order("consumed_at", { ascending: false })
        .limit(15),
      supabase
        .from("consumptions")
        .select("id, quantity, unit_price, consumed_at, members(full_name), menu_items(name)")
        .order("consumed_at", { ascending: false })
        .limit(TRANSPARENCY_LIMIT),
    ]);
    const history = (historyData ?? []) as unknown as Array<{
      id: string;
      quantity: number;
      unit_price: number;
      consumed_at: string;
      menu_items: { name: string } | null;
    }>;
    const clubHistory = (clubHistoryData ?? []) as unknown as Array<{
      id: string;
      quantity: number;
      unit_price: number;
      consumed_at: string;
      members: { full_name: string } | null;
      menu_items: { name: string } | null;
    }>;

    return (
      <div>
        <div className="mb-5">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Consumiciones</h1>
          <p className="text-sm text-muted">Toca para pedir lo que tomes</p>
        </div>

        <MenuSection title="Bebidas" items={bebidas} memberId={currentId} members={list} />
        <MenuSection title="Aperitivos" items={aperitivos} memberId={currentId} members={list} />

        <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">Tu historial reciente</p>
        <HistoryTable
          rows={history.map((h) => ({
            id: h.id,
            date: h.consumed_at,
            item: h.menu_items?.name ?? "—",
            quantity: h.quantity,
            total: h.quantity * h.unit_price,
          }))}
          reporterMemberId={currentId}
        />

        <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">Actividad reciente del club</p>
        <p className="mb-3 text-xs text-muted">
          Últimas consumiciones de todos los socios, para que quede claro que todo se apunta.
        </p>
        <HistoryTable
          rows={clubHistory.map((h) => ({
            id: h.id,
            date: h.consumed_at,
            member: h.members?.full_name,
            item: h.menu_items?.name ?? "—",
            quantity: h.quantity,
            total: h.quantity * h.unit_price,
          }))}
          reporterMemberId={currentId}
        />
      </div>
    );
  }

  const isFullHistory = FULL_HISTORY_ROLES.includes(demoRole);
  const [{ data: recentData }, { data: allMenuData }, { data: inventoryItemsData }, { data: membersData }] =
    await Promise.all([
      supabase
        .from("consumptions")
        .select("id, quantity, unit_price, consumed_at, members(full_name), menu_items(name)")
        .order("consumed_at", { ascending: false })
        .limit(isFullHistory ? 30 : TRANSPARENCY_LIMIT),
      supabase
        .from("menu_items")
        .select("id, name, category, price, active, inventory_item_id, stock_mode")
        .order("category")
        .order("name"),
      supabase.from("inventory_items").select("id, name").order("name"),
      supabase.from("members").select("id, full_name").eq("status", "activo").order("full_name"),
    ]);
  const recent = (recentData ?? []) as unknown as Array<{
    id: string;
    quantity: number;
    unit_price: number;
    consumed_at: string;
    members: { full_name: string } | null;
    menu_items: { name: string } | null;
  }>;
  const allMenu = allMenuData ?? [];
  const inventoryItems = inventoryItemsData ?? [];
  const canManageMenu = MENU_MANAGE_ROLES.includes(demoRole);
  const members = membersData ?? [];
  const cookieId = await getDemoMemberIdCookie();
  const reporterMemberId = members.find((m) => m.id === cookieId)?.id ?? members[0]?.id ?? "";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">
          {isFullHistory ? "Consumiciones recientes" : "Actividad reciente"}
        </h1>
        {EXPORT_ROLES.includes(demoRole) && <ExportLink href="/api/export/consumos" label="Exportar" />}
      </div>
      <p className="mb-5 mt-1 text-sm text-muted">
        {isFullHistory
          ? 'Vista de gestión: toda la barra. Cambia a "Socio" para ver el flujo de pedir una consumición.'
          : `Últimas ${TRANSPARENCY_LIMIT} consumiciones de todos los socios, como capa de transparencia.`}
      </p>
      <HistoryTable
        rows={recent.map((h) => ({
          id: h.id,
          date: h.consumed_at,
          member: h.members?.full_name,
          item: h.menu_items?.name ?? "—",
          quantity: h.quantity,
          total: h.quantity * h.unit_price,
        }))}
        reporterMemberId={reporterMemberId}
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

function MenuSection({
  title,
  items,
  memberId,
  members,
}: {
  title: string;
  items: MenuItem[];
  memberId: string;
  members: { id: string; full_name: string }[];
}) {
  return (
    <div className="mb-6">
      <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">{title}</p>
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item) =>
          item.stock_mode === "shared" ? (
            <ShareConsumptionForm
              key={item.id}
              menuItemId={item.id}
              name={item.name}
              price={item.price}
              currentMemberId={memberId}
              members={members}
            />
          ) : (
            <MarkConsumptionForm
              key={item.id}
              memberId={memberId}
              menuItemId={item.id}
              name={item.name}
              price={item.price}
            />
          ),
        )}
        {items.length === 0 && <p className="text-sm text-muted">Sin artículos.</p>}
      </div>
    </div>
  );
}

function HistoryTable({
  rows,
  reporterMemberId,
}: {
  rows: { id: string; date: string; member?: string; item: string; quantity: number; total: number }[];
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
