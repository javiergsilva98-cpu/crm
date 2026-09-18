import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { CupIcon, PlusIcon } from "@/components/icons";
import { markConsumption, toggleMenuItemActive } from "./actions";
import { MenuItemForm } from "./menu-item-form";

const MENU_MANAGE_ROLES = ["admin", "presidente", "tesorero", "bodeguero"];

type MenuItem = { id: string; name: string; category: string; price: number };

export default async function ConsumosPage() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();

  const { data: menuItemsData } = await supabase
    .from("menu_items")
    .select("id, name, category, price")
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
      .order("full_name");
    const list = socios ?? [];
    const cookieId = await getDemoMemberIdCookie();
    const currentId = list.find((m) => m.id === cookieId)?.id ?? list[0]?.id ?? "";

    const { data: historyData } = await supabase
      .from("consumptions")
      .select("id, quantity, unit_price, consumed_at, menu_items(name)")
      .eq("member_id", currentId)
      .order("consumed_at", { ascending: false })
      .limit(15);
    const history = (historyData ?? []) as unknown as Array<{
      id: string;
      quantity: number;
      unit_price: number;
      consumed_at: string;
      menu_items: { name: string } | null;
    }>;

    return (
      <div>
        <div className="mb-5">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Consumos</h1>
          <p className="text-sm text-muted">Toca para marcar lo que tomes</p>
        </div>

        <MenuSection title="Bebidas" items={bebidas} memberId={currentId} />
        <MenuSection title="Aperitivos" items={aperitivos} memberId={currentId} />

        <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">Tu historial reciente</p>
        <HistoryTable
          rows={history.map((h) => ({
            date: h.consumed_at,
            item: h.menu_items?.name ?? "—",
            quantity: h.quantity,
            total: h.quantity * h.unit_price,
          }))}
        />
      </div>
    );
  }

  const [{ data: recentData }, { data: allMenuData }] = await Promise.all([
    supabase
      .from("consumptions")
      .select("id, quantity, unit_price, consumed_at, members(full_name), menu_items(name)")
      .order("consumed_at", { ascending: false })
      .limit(30),
    supabase.from("menu_items").select("id, name, category, price, active").order("category").order("name"),
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
  const canManageMenu = MENU_MANAGE_ROLES.includes(demoRole);

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight text-foreground">Consumos recientes</h1>
      <p className="mb-5 mt-1 text-sm text-muted">
        Vista de gestión: toda la barra. Cambia a &quot;Socio&quot; para ver el flujo de marcar un consumo.
      </p>
      <HistoryTable
        rows={recent.map((h) => ({
          date: h.consumed_at,
          member: h.members?.full_name,
          item: h.menu_items?.name ?? "—",
          quantity: h.quantity,
          total: h.quantity * h.unit_price,
        }))}
      />

      {canManageMenu && (
        <>
          <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">Carta</p>
          <div className="mb-3 overflow-hidden rounded-[18px] border border-border bg-card">
            {allMenu.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-3.5 py-3 ${idx !== allMenu.length - 1 ? "border-b border-border" : ""}`}
              >
                <p className={`flex-1 text-sm font-semibold ${item.active ? "text-foreground" : "text-muted line-through"}`}>
                  {item.name}
                </p>
                <p className="text-sm text-muted">{item.price.toFixed(2)} €</p>
                <form
                  action={async (fd) => {
                    "use server";
                    await toggleMenuItemActive(fd);
                  }}
                >
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="next_active" value={(!item.active).toString()} />
                  <button
                    type="submit"
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground"
                  >
                    {item.active ? "Desactivar" : "Activar"}
                  </button>
                </form>
              </div>
            ))}
            {allMenu.length === 0 && (
              <p className="px-3.5 py-6 text-center text-sm text-muted">Todavía no hay artículos en la carta.</p>
            )}
          </div>
          <MenuItemForm />
        </>
      )}
    </div>
  );
}

function MenuSection({
  title,
  items,
  memberId,
}: {
  title: string;
  items: MenuItem[];
  memberId: string;
}) {
  return (
    <div className="mb-6">
      <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">{title}</p>
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item) => (
          <form
            key={item.id}
            action={markConsumption}
            className="relative rounded-[18px] border border-border bg-card p-3.5"
          >
            <input type="hidden" name="member_id" value={memberId} />
            <input type="hidden" name="menu_item_id" value={item.id} />
            <input type="hidden" name="unit_price" value={item.price} />
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft">
              <CupIcon className="h-[17px] w-[17px] text-accent" />
            </div>
            <p className="mt-2.5 text-sm font-bold text-foreground">{item.name}</p>
            <p className="mt-0.5 text-xs text-muted">{item.price.toFixed(2)} €</p>
            <button
              type="submit"
              aria-label={`Marcar ${item.name}`}
              className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-[0_6px_14px_-6px_var(--color-accent)] transition-transform active:scale-95"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </form>
        ))}
        {items.length === 0 && <p className="text-sm text-muted">Sin artículos.</p>}
      </div>
    </div>
  );
}

function HistoryTable({
  rows,
}: {
  rows: { date: string; member?: string; item: string; quantity: number; total: number }[];
}) {
  const showMember = rows.some((r) => r.member !== undefined);
  return (
    <div className="overflow-hidden rounded-[18px] border border-border bg-card">
      {rows.map((r, idx) => (
        <div
          key={idx}
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
          </div>
          <p className="text-sm font-bold text-foreground">{r.total.toFixed(2)} €</p>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="px-3.5 py-6 text-center text-sm text-muted">Todavía no hay consumos.</p>
      )}
    </div>
  );
}
