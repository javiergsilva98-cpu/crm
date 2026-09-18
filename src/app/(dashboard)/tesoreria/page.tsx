import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { WalletIcon } from "@/components/icons";
import { ExportLink } from "@/components/export-link";
import { MovementForm } from "./movement-form";

const INGRESO_TYPES = ["cuota", "ingreso"];
const TREASURY_MANAGE_ROLES = ["admin", "presidente", "tesorero"];

type Movement = {
  id: string;
  movement_type: string;
  amount: number;
  movement_date: string;
  description: string | null;
  member_id: string | null;
  event_id: string | null;
};
type Consumption = { member_id: string; quantity: number; unit_price: number };
type Member = { id: string; full_name: string };

function eur(n: number) {
  return `${n.toFixed(2)} €`;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function TesoreriaPage() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();

  if (demoRole === "secretario" || demoRole === "bodeguero") {
    return (
      <p className="text-sm text-muted">
        La tesorería no forma parte de tu rol en esta demo. Cambia a Presidente, Tesorero o Socio
        arriba a la derecha para verla.
      </p>
    );
  }

  const [{ data: movementsData }, { data: consumptionsData }, { data: membersData }, { data: clubBalanceData }] =
    await Promise.all([
      supabase
        .from("treasury_movements")
        .select("id, movement_type, amount, movement_date, description, member_id, event_id")
        .order("movement_date", { ascending: false }),
      supabase.from("consumptions").select("member_id, quantity, unit_price"),
      supabase.from("members").select("id, full_name").eq("status", "activo").order("full_name"),
      supabase.rpc("club_balance"),
    ]);

  const movements = (movementsData ?? []) as Movement[];
  const consumptions = (consumptionsData ?? []) as Consumption[];
  const members = (membersData ?? []) as Member[];
  // Calculado con una función de base de datos aparte (no sumando localmente
  // "movements") porque un socio real, por RLS, solo ve sus propios
  // movimientos: sumar solo lo que él ve daría un "saldo del club" erróneo.
  const clubBalance = (clubBalanceData as number | null) ?? 0;

  const sum = (predicate: (m: Movement) => boolean) =>
    movements.filter(predicate).reduce((acc, m) => acc + m.amount, 0);

  const breakdown = {
    cuotas: sum((m) => m.movement_type === "cuota"),
    ingresosEventos: sum((m) => m.movement_type === "ingreso" && m.event_id !== null),
    otrosIngresos: sum((m) => m.movement_type === "ingreso" && m.event_id === null),
    comprasOrdinarias: sum((m) => m.movement_type === "compra_ordinaria"),
    comprasEvento: sum((m) => m.movement_type === "compra_evento"),
    comprasGrandes: sum((m) => m.movement_type === "compra_grande"),
    urgencias: sum((m) => m.movement_type === "urgencia"),
  };

  function memberBalance(memberId: string) {
    const paid = movements
      .filter((m) => m.member_id === memberId && INGRESO_TYPES.includes(m.movement_type))
      .reduce((acc, m) => acc + m.amount, 0);
    const consumed = consumptions
      .filter((c) => c.member_id === memberId)
      .reduce((acc, c) => acc + c.quantity * c.unit_price, 0);
    return paid - consumed;
  }

  if (demoRole === "socio") {
    const cookieId = await getDemoMemberIdCookie();
    const currentId = members.find((m) => m.id === cookieId)?.id ?? members[0]?.id ?? "";
    const balance = currentId ? memberBalance(currentId) : 0;

    return (
      <div>
        <h1 className="mb-5 text-xl font-extrabold tracking-tight text-foreground">Tesorería</h1>

        <div className="rounded-[26px] bg-accent p-6 text-accent-foreground shadow-[0_16px_30px_-14px_var(--color-accent)]">
          <span className="text-sm font-semibold text-white/80">Tu saldo</span>
          <div className="mt-2 text-4xl font-extrabold tracking-tight">{eur(balance)}</div>
          <p className="mt-1 text-sm text-white/85">{balance < 0 ? "Debes al club" : "A tu favor"}</p>
        </div>

        <div className="mt-3 rounded-[18px] border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Saldo del club</p>
          <p className="mt-1.5 text-2xl font-extrabold text-foreground">{eur(clubBalance)}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Tesorería</h1>
        {TREASURY_MANAGE_ROLES.includes(demoRole) && (
          <div className="flex gap-2">
            <ExportLink href="/api/export/movimientos" label="Movimientos" />
            <ExportLink href="/api/export/saldos" label="Saldos" />
          </div>
        )}
      </div>

      <div className="rounded-[26px] bg-accent p-6 text-accent-foreground shadow-[0_16px_30px_-14px_var(--color-accent)]">
        <span className="text-sm font-semibold text-white/80">Saldo del club</span>
        <div className="mt-2 text-4xl font-extrabold tracking-tight">{eur(clubBalance)}</div>
      </div>

      <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">
        Cuota fija vs. cargos de evento
      </p>
      <div className="mb-7 grid grid-cols-2 gap-2.5">
        <BreakdownCard label="Cuotas" value={breakdown.cuotas} />
        <BreakdownCard label="Ingresos de eventos" value={breakdown.ingresosEventos} />
        <BreakdownCard label="Otros ingresos" value={breakdown.otrosIngresos} />
        <BreakdownCard label="Compras de evento" value={-breakdown.comprasEvento} />
        <BreakdownCard label="Compras ordinarias" value={-breakdown.comprasOrdinarias} />
        <BreakdownCard label="Compras grandes" value={-breakdown.comprasGrandes} />
        <BreakdownCard label="Urgencias" value={-breakdown.urgencias} />
      </div>

      <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Saldo por socio</p>
      <div className="mb-7 overflow-hidden rounded-[18px] border border-border bg-card">
        {members.map((m, idx) => {
          const balance = memberBalance(m.id);
          return (
            <div
              key={m.id}
              className={`flex items-center justify-between px-3.5 py-3 ${
                idx !== members.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className="text-sm font-semibold text-foreground">{m.full_name}</span>
              <span className={`text-sm font-bold ${balance < 0 ? "text-warning" : "text-success"}`}>
                {eur(balance)}
              </span>
            </div>
          );
        })}
        {members.length === 0 && (
          <p className="px-3.5 py-6 text-center text-sm text-muted">No hay socios de ejemplo todavía.</p>
        )}
      </div>

      <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Movimientos recientes</p>
      <div className="overflow-hidden rounded-[18px] border border-border bg-card">
        {movements.slice(0, 20).map((m, idx, arr) => (
          <div
            key={m.id}
            className={`flex items-center gap-3 px-3.5 py-3 ${idx !== arr.length - 1 ? "border-b border-border" : ""}`}
          >
            <div
              className={`flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-xl ${
                INGRESO_TYPES.includes(m.movement_type) ? "bg-success-soft" : "bg-accent-soft"
              }`}
            >
              <WalletIcon
                className={`h-4 w-4 ${INGRESO_TYPES.includes(m.movement_type) ? "text-success" : "text-accent"}`}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold capitalize text-foreground">
                {m.description ?? m.movement_type.replace("_", " ")}
              </p>
              <p className="text-xs text-muted">{formatDate(m.movement_date)}</p>
            </div>
            <p
              className={`text-sm font-bold ${
                INGRESO_TYPES.includes(m.movement_type) ? "text-success" : "text-foreground"
              }`}
            >
              {INGRESO_TYPES.includes(m.movement_type) ? "+" : "-"}
              {eur(m.amount)}
            </p>
          </div>
        ))}
        {movements.length === 0 && (
          <p className="px-3.5 py-6 text-center text-sm text-muted">No hay movimientos de ejemplo todavía.</p>
        )}
      </div>

      {TREASURY_MANAGE_ROLES.includes(demoRole) && (
        <>
          <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">Registrar movimiento</p>
          <MovementForm members={members} />
        </>
      )}
    </div>
  );
}

function BreakdownCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-border bg-card p-3.5">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-base font-bold ${value < 0 ? "text-warning" : "text-foreground"}`}>{eur(value)}</p>
    </div>
  );
}
