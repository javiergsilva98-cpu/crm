import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { MemberSwitcher } from "@/components/member-switcher";
import { markConsumption } from "./actions";

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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Consumos</h1>
          <MemberSwitcher members={list} current={currentId} />
        </div>

        <MenuSection title="Bebidas" items={bebidas} memberId={currentId} />
        <MenuSection title="Aperitivos" items={aperitivos} memberId={currentId} />

        <h2 className="mb-3 mt-8 text-lg font-semibold">Tu historial reciente</h2>
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

  const { data: recentData } = await supabase
    .from("consumptions")
    .select("id, quantity, unit_price, consumed_at, members(full_name), menu_items(name)")
    .order("consumed_at", { ascending: false })
    .limit(30);
  const recent = (recentData ?? []) as unknown as Array<{
    id: string;
    quantity: number;
    unit_price: number;
    consumed_at: string;
    members: { full_name: string } | null;
    menu_items: { name: string } | null;
  }>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Consumos recientes</h1>
      <p className="mb-4 text-sm text-muted">
        Vista de gestión: toda la barra. Cambia a &quot;Socio&quot; para ver el flujo de marcar un
        consumo.
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
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <form
            key={item.id}
            action={markConsumption}
            className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
          >
            <input type="hidden" name="member_id" value={memberId} />
            <input type="hidden" name="menu_item_id" value={item.id} />
            <input type="hidden" name="unit_price" value={item.price} />
            <div>
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted">{item.price.toFixed(2)} €</p>
            </div>
            <button
              type="submit"
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white"
            >
              Marcar
            </button>
          </form>
        ))}
        {items.length === 0 && <p className="text-sm text-muted/70">Sin artículos.</p>}
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
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted/70">
            <th className="px-4 py-3">Fecha</th>
            {showMember && <th className="px-4 py-3">Socio</th>}
            <th className="px-4 py-3">Consumo</th>
            <th className="px-4 py-3">Cantidad</th>
            <th className="px-4 py-3">Importe</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-3 text-muted">
                {new Date(r.date).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
              </td>
              {showMember && <td className="px-4 py-3 text-foreground">{r.member}</td>}
              <td className="px-4 py-3 text-foreground">{r.item}</td>
              <td className="px-4 py-3 text-muted">{r.quantity}</td>
              <td className="px-4 py-3 text-muted">{r.total.toFixed(2)} €</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={showMember ? 5 : 4} className="px-4 py-6 text-center text-muted/70">
                Todavía no hay consumos.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
