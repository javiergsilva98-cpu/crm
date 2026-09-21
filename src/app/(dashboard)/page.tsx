import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { NAV_BY_ROLE } from "@/lib/demo-role";
import { closeExpiredVotes } from "./votaciones/actions";
import {
  UsersIcon,
  CupIcon,
  WalletIcon,
  BoxIcon,
  CalendarIcon,
  VoteIcon,
  UserPlusIcon,
  FolderIcon,
  ShieldIcon,
  CheckIcon,
  AlertIcon,
} from "@/components/icons";

type Icon = (props: { className?: string }) => React.JSX.Element;

const TILE_ICON: Record<string, Icon> = {
  "/socios": UsersIcon,
  "/consumos": CupIcon,
  "/tesoreria": WalletIcon,
  "/inventario": BoxIcon,
  "/calendario": CalendarIcon,
  "/votaciones": VoteIcon,
  "/documentos": FolderIcon,
  "/usuarios": UserPlusIcon,
  "/auditoria": ShieldIcon,
};

const TILE_SUBTITLE: Record<string, string> = {
  "/socios": "Ficha de socios",
  "/consumos": "Marcar consumición",
  "/tesoreria": "Balance del club",
  "/inventario": "Stock de bodega",
  "/calendario": "Eventos y reservas",
  "/votaciones": "Vota y consulta resultados",
  "/documentos": "Estatutos, actas y normativa",
  "/usuarios": "Crear y gestionar cuentas",
  "/auditoria": "Historial de cambios",
};

type ActivityRow = {
  icon: Icon;
  title: string;
  subtitle: string;
  trailing: string;
  tone: "positive" | "negative" | "neutral";
};

function eur(n: number) {
  return `${n.toFixed(2)} €`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export default async function DashboardHome() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();
  const navItems = NAV_BY_ROLE[demoRole];

  // Sin cron: cierra por sistema cualquier votación con fecha límite
  // vencida antes de mirar si hay resultados recientes que anunciar.
  await closeExpiredVotes();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: recentAutoClosed } = await supabase
    .from("votes")
    .select("id, question, deadline")
    .eq("auto_closed", true)
    .gte("deadline", sevenDaysAgo.toISOString())
    .order("deadline", { ascending: false })
    .limit(2);
  const closedVotes = await Promise.all(
    (recentAutoClosed ?? []).map(async (v) => {
      const { data: results } = await supabase.rpc("vote_results", { p_vote_id: v.id });
      const rows = (results ?? []) as { option_id: string; label: string; votes: number }[];
      const winner = rows.reduce((best, r) => (best === null || r.votes > best.votes ? r : best), null as (typeof rows)[number] | null);
      return { id: v.id, question: v.question, winnerLabel: winner?.label ?? null };
    }),
  );

  let lowStockCount = 0;
  if (["admin", "presidente", "vicepresidente", "tesorero", "bodeguero"].includes(demoRole)) {
    const { data: inventoryData } = await supabase
      .from("inventory_items")
      .select("current_stock, low_stock_threshold");
    lowStockCount = (inventoryData ?? []).filter((i) => i.current_stock <= i.low_stock_threshold).length;
  }

  let heroLabel = "Socios activos";
  let heroValue = "0";
  let heroBadge: string | null = null;
  let secondaryLabel = "Eventos sin cobrar";
  let secondaryValue = "0";
  let activityTitle = "Actividad reciente";
  let activity: ActivityRow[] = [];
  let cuotaPending = false;

  if (demoRole === "socio") {
    const { data: membersData } = await supabase
      .from("members")
      .select("id, full_name")
      .eq("status", "activo")
      .order("full_name");
    const members = membersData ?? [];
    const cookieId = await getDemoMemberIdCookie();
    const currentId = members.find((m) => m.id === cookieId)?.id ?? members[0]?.id ?? "";

    const now = new Date();
    const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const [{ data: cuotaData }, { data: consumptionsData }, { data: historyData }] = await Promise.all([
      supabase
        .from("treasury_movements")
        .select("amount, movement_date")
        .eq("member_id", currentId)
        .eq("movement_type", "cuota"),
      supabase.from("consumptions").select("quantity, unit_price").eq("member_id", currentId),
      supabase
        .from("consumptions")
        .select("id, quantity, unit_price, consumed_at, menu_items(name)")
        .eq("member_id", currentId)
        .order("consumed_at", { ascending: false })
        .limit(4),
    ]);

    const paid = (cuotaData ?? []).reduce((acc, m) => acc + m.amount, 0);
    const paidThisMonth = (cuotaData ?? []).some((m) => m.movement_date >= currentMonthStart);
    const consumed = (consumptionsData ?? []).reduce((acc, c) => acc + c.quantity * c.unit_price, 0);
    const balance = paid - consumed;

    cuotaPending = !paidThisMonth;
    heroLabel = "Tu saldo";
    heroValue = eur(balance);
    heroBadge = paidThisMonth ? "Cuota al día" : "Cuota pendiente";
    secondaryLabel = "";
    secondaryValue = "";
    activityTitle = "Tu historial reciente";
    activity = ((historyData ?? []) as unknown as Array<{
      id: string;
      quantity: number;
      unit_price: number;
      consumed_at: string;
      menu_items: { name: string } | null;
    }>).map((h) => ({
      icon: CupIcon,
      title: h.menu_items?.name ?? "Consumición",
      subtitle: formatDate(h.consumed_at),
      trailing: `-${eur(h.quantity * h.unit_price)}`,
      tone: "negative",
    }));
  } else if (demoRole === "bodeguero") {
    const [{ count: items }, { data: restocksData }] = await Promise.all([
      supabase.from("inventory_items").select("*", { count: "exact", head: true }),
      supabase
        .from("inventory_restocks")
        .select("id, quantity, cost, restocked_at, inventory_items(name)")
        .order("restocked_at", { ascending: false })
        .limit(4),
    ]);

    heroLabel = "Artículos en bodega";
    heroValue = String(items ?? 0);
    secondaryLabel = "";
    secondaryValue = "";
    activityTitle = "Reposiciones recientes";
    activity = ((restocksData ?? []) as unknown as Array<{
      id: string;
      quantity: number;
      cost: number;
      restocked_at: string;
      inventory_items: { name: string } | null;
    }>).map((r) => ({
      icon: BoxIcon,
      title: r.inventory_items?.name ?? "Artículo",
      subtitle: `+${r.quantity} · ${formatDate(r.restocked_at)}`,
      trailing: r.cost > 0 ? `-${eur(r.cost)}` : "—",
      tone: "negative",
    }));
  } else if (demoRole === "secretario") {
    const [{ count: members }, { count: pendingEvents }, { data: recentMembers }] = await Promise.all([
      supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "activo"),
      supabase.from("events").select("*", { count: "exact", head: true }).neq("charge_status", "cobrado"),
      supabase
        .from("members")
        .select("id, full_name, joined_at")
        .order("joined_at", { ascending: false })
        .limit(4),
    ]);

    heroLabel = "Socios activos";
    heroValue = String(members ?? 0);
    secondaryLabel = "Eventos sin cobrar del todo";
    secondaryValue = String(pendingEvents ?? 0);
    activityTitle = "Altas recientes";
    activity = (recentMembers ?? []).map((m) => ({
      icon: UsersIcon,
      title: m.full_name,
      subtitle: `Alta · ${formatDate(m.joined_at)}`,
      trailing: "",
      tone: "neutral",
    }));
  } else {
    const [{ count: members }, { count: pendingEvents }, { data: movementsData }] = await Promise.all([
      supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "activo"),
      supabase.from("events").select("*", { count: "exact", head: true }).neq("charge_status", "cobrado"),
      supabase
        .from("treasury_movements")
        .select("id, movement_type, amount, movement_date, description")
        .order("movement_date", { ascending: false })
        .limit(4),
    ]);

    const ingresoTypes = ["cuota", "ingreso"];
    heroLabel = "Socios activos";
    heroValue = String(members ?? 0);
    secondaryLabel = "Eventos sin cobrar del todo";
    secondaryValue = String(pendingEvents ?? 0);
    activityTitle = "Movimientos recientes";
    activity = (movementsData ?? []).map((m) => ({
      icon: WalletIcon,
      title: m.description ?? m.movement_type.replace("_", " "),
      subtitle: formatDate(m.movement_date),
      trailing: `${ingresoTypes.includes(m.movement_type) ? "+" : "-"}${eur(m.amount)}`,
      tone: ingresoTypes.includes(m.movement_type) ? "positive" : "negative",
    }));
  }

  return (
    <div>
      {cuotaPending && (
        <Link
          href="/tesoreria"
          className="mb-4 flex items-center gap-3 rounded-[18px] border border-warning/30 bg-warning-soft p-3.5"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-warning/15">
            <AlertIcon className="h-[18px] w-[18px] text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-warning">Cuota de este mes pendiente</p>
            <p className="text-xs text-warning/80">Toca para ver el detalle en Tesorería.</p>
          </div>
        </Link>
      )}

      {closedVotes.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {closedVotes.map((v) => (
            <Link
              key={v.id}
              href="/votaciones"
              className="flex items-center gap-3 rounded-[18px] border border-accent/30 bg-accent-soft p-3.5"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent/15">
                <VoteIcon className="h-[18px] w-[18px] text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-accent">Votación cerrada: {v.question}</p>
                <p className="text-xs text-accent/80">
                  {v.winnerLabel ? `Resultado: ${v.winnerLabel}` : "Toca para ver el resultado."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Hero card */}
      <div className="rounded-[26px] bg-accent p-6 text-accent-foreground shadow-[0_16px_30px_-14px_var(--color-accent)]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white/80">{heroLabel}</span>
          {heroBadge && (
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">{heroBadge}</span>
          )}
        </div>
        <div className="mt-2 text-4xl font-extrabold tracking-tight">{heroValue}</div>
        {secondaryLabel && (
          <div className="mt-3 flex items-center gap-2 text-sm text-white/85">
            <span className="font-semibold">{secondaryValue}</span>
            <span>{secondaryLabel}</span>
          </div>
        )}
        <div className="mt-4 flex gap-2.5">
          {navItems.slice(0, 2).map((item) => {
            const Icon = TILE_ICON[item.href] ?? CheckIcon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white/15 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/25"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick access */}
      <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">Accesos rápidos</p>
      <div className="grid grid-cols-2 gap-2.5">
        {navItems.map((item) => {
          const Icon = TILE_ICON[item.href] ?? CheckIcon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative rounded-[18px] border border-border bg-card p-3.5 transition-colors hover:border-accent"
            >
              {item.href === "/inventario" && lowStockCount > 0 && (
                <span className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-white">
                  {lowStockCount}
                </span>
              )}
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-accent-soft">
                <Icon className="h-[19px] w-[19px] text-accent" />
              </div>
              <p className="mt-2.5 text-sm font-bold text-foreground">{item.label}</p>
              <p className="mt-0.5 text-xs text-muted">{TILE_SUBTITLE[item.href]}</p>
            </Link>
          );
        })}
      </div>

      {/* Activity */}
      <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">{activityTitle}</p>
      <div className="overflow-hidden rounded-[18px] border border-border bg-card">
        {activity.map((row, idx) => {
          const Icon = row.icon;
          const toneBg = row.tone === "positive" ? "bg-success-soft" : row.tone === "negative" ? "bg-accent-soft" : "bg-accent-soft";
          const toneColor = row.tone === "positive" ? "text-success" : "text-accent";
          const trailColor = row.tone === "positive" ? "text-success" : row.tone === "negative" ? "text-foreground" : "text-muted";
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 px-3.5 py-3 ${idx !== activity.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className={`flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-xl ${toneBg}`}>
                <Icon className={`h-4 w-4 ${toneColor}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{row.title}</p>
                <p className="text-xs text-muted">{row.subtitle}</p>
              </div>
              {row.trailing && <p className={`text-sm font-bold ${trailColor}`}>{row.trailing}</p>}
            </div>
          );
        })}
        {activity.length === 0 && (
          <p className="px-3.5 py-6 text-center text-sm text-muted">Todavía no hay nada por aquí.</p>
        )}
      </div>
    </div>
  );
}
