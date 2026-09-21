import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { WalletIcon, AlertIcon, CheckIcon } from "@/components/icons";
import { ExportLink } from "@/components/export-link";
import { MovementForm } from "./movement-form";
import { ClubSettingsForm } from "./club-settings-form";
import { MONEY_EDIT_ROLES as TREASURY_MANAGE_ROLES } from "@/lib/permissions";

const INGRESO_TYPES = ["cuota", "ingreso"];

type Movement = {
  id: string;
  movement_type: string;
  amount: number;
  movement_date: string;
  description: string | null;
  member_id: string | null;
  event_id: string | null;
};
type Consumption = { id: string; member_id: string; quantity: number; unit_price: number; consumed_at: string; menu_items: { name: string } | null };
type Member = { id: string; full_name: string };

function eur(n: number) {
  return `${n.toFixed(2)} €`;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function currentMonthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
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

  const [{ data: movementsData }, { data: consumptionsData }, { data: membersData }, { data: clubBalanceData }, { data: availableBalanceData }, { data: settingsData }] =
    await Promise.all([
      supabase
        .from("treasury_movements")
        .select("id, movement_type, amount, movement_date, description, member_id, event_id")
        .order("movement_date", { ascending: false }),
      supabase.from("consumptions").select("id, member_id, quantity, unit_price, consumed_at, menu_items(name)"),
      supabase.from("members").select("id, full_name").eq("status", "activo").order("full_name"),
      supabase.rpc("club_balance"),
      supabase.rpc("club_available_balance"),
      supabase.from("club_settings").select("reserved_funds, reserved_note").eq("id", true).maybeSingle(),
    ]);

  const movements = (movementsData ?? []) as Movement[];
  const consumptions = (consumptionsData ?? []) as unknown as Consumption[];
  const members = (membersData ?? []) as Member[];
  // Calculado con funciones de base de datos aparte (no sumando localmente
  // "movements") porque un socio real, por RLS, solo ve sus propios
  // movimientos: sumar solo lo que él ve daría un "saldo del club" erróneo.
  const clubBalance = (clubBalanceData as number | null) ?? 0;
  const availableBalance = (availableBalanceData as number | null) ?? clubBalance;
  const reservedFunds = settingsData?.reserved_funds ?? 0;
  const reservedNote = settingsData?.reserved_note ?? "";

  const gastosImportantes = movements
    .filter((m) => m.movement_type === "compra_grande")
    .slice(0, 5);

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

    const myMovements = movements.filter((m) => m.member_id === currentId);
    const myConsumptions = consumptions.filter((c) => c.member_id === currentId);

    // Saldo de consumiciones: solo lo que se ha consumido menos lo que se
    // ha ingresado para pagarlo. La cuota mensual queda fuera a propósito
    // (es un concepto distinto, ver bloque de cuota más abajo) para que el
    // socio no vea un único número que mezcle ambas cosas.
    const consumedTotal = myConsumptions.reduce((acc, c) => acc + c.quantity * c.unit_price, 0);
    const paidTowardsConsumption = myMovements
      .filter((m) => m.movement_type === "ingreso")
      .reduce((acc, m) => acc + m.amount, 0);
    const consumptionBalance = paidTowardsConsumption - consumedTotal;

    const monthStart = currentMonthStart();
    const cuotaThisMonth = myMovements.some((m) => m.movement_type === "cuota" && m.movement_date >= monthStart);

    const ledger = [
      ...myConsumptions.map((c) => ({
        id: `c-${c.id}`,
        date: c.consumed_at,
        concept: c.menu_items?.name ?? "Consumición",
        amount: -(c.quantity * c.unit_price),
      })),
      ...myMovements.map((m) => ({
        id: `m-${m.id}`,
        date: m.movement_date,
        concept: m.description ?? (m.movement_type === "cuota" ? "Cuota mensual" : m.movement_type.replace("_", " ")),
        amount: INGRESO_TYPES.includes(m.movement_type) ? m.amount : -m.amount,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div>
        <h1 className="mb-5 text-xl font-extrabold tracking-tight text-foreground">Tesorería</h1>

        <div className="rounded-[18px] border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">Cuota mensual</span>
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                cuotaThisMonth ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
              }`}
            >
              {cuotaThisMonth ? <CheckIcon className="h-3 w-3" /> : <AlertIcon className="h-3 w-3" />}
              {cuotaThisMonth ? "Pagada" : "Pendiente"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {cuotaThisMonth
              ? "Ya está al día este mes."
              : "Todavía no consta el pago de la cuota de este mes."}
          </p>
        </div>

        <div className="mt-3 rounded-[26px] bg-accent p-6 text-accent-foreground shadow-[0_16px_30px_-14px_var(--color-accent)]">
          <span className="text-sm font-semibold text-white/80">Mi saldo de consumiciones</span>
          <div className="mt-2 text-4xl font-extrabold tracking-tight">{eur(consumptionBalance)}</div>
          <p className="mt-1 text-sm text-white/85">
            {consumptionBalance < 0 ? "Debes al club" : "A tu favor"} · no incluye la cuota
          </p>
        </div>

        <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">Mis movimientos</p>
        <div className="max-h-[420px] overflow-y-auto overflow-x-hidden rounded-[18px] border border-border bg-card">
          {ledger.map((row, idx) => (
            <div
              key={row.id}
              className={`flex items-center gap-3 px-3.5 py-3 ${idx !== ledger.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex-1">
                <p className="text-sm font-semibold capitalize text-foreground">{row.concept}</p>
                <p className="text-xs text-muted">{formatDate(row.date.slice(0, 10))}</p>
              </div>
              <p className={`text-sm font-bold ${row.amount < 0 ? "text-foreground" : "text-success"}`}>
                {row.amount < 0 ? "-" : "+"}
                {eur(Math.abs(row.amount))}
              </p>
            </div>
          ))}
          {ledger.length === 0 && (
            <p className="px-3.5 py-6 text-center text-sm text-muted">Todavía no hay movimientos.</p>
          )}
        </div>

        <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">Saldo del club</p>
        <div className="rounded-[18px] border border-border bg-card p-4">
          <p className="text-xs text-muted">Caja disponible (sin fondos reservados)</p>
          <p className="mt-1.5 text-2xl font-extrabold text-foreground">{eur(availableBalance)}</p>
        </div>

        {gastosImportantes.length > 0 && (
          <>
            <p className="mb-2.5 mt-5 text-xs font-bold uppercase tracking-wide text-muted">
              Últimos gastos importantes
            </p>
            <div className="overflow-hidden rounded-[18px] border border-border bg-card">
              {gastosImportantes.map((m, idx) => (
                <div
                  key={m.id}
                  className={`flex items-center justify-between px-3.5 py-3 ${
                    idx !== gastosImportantes.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{m.description ?? "Compra grande"}</p>
                    <p className="text-xs text-muted">{formatDate(m.movement_date)}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">-{eur(m.amount)}</p>
                </div>
              ))}
            </div>
          </>
        )}
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
        <p className="mt-2 text-sm text-white/85">
          Caja disponible (sin {eur(reservedFunds)} reservados): <strong>{eur(availableBalance)}</strong>
        </p>
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

          <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">
            Fondos reservados/comprometidos
          </p>
          <p className="mb-3 text-xs text-muted">
            Se restan del &quot;Saldo del club&quot; para calcular la caja realmente disponible (ej.
            dinero ya apartado para el seguro de los próximos meses). No afectan al saldo por socio.
          </p>
          <ClubSettingsForm reservedFunds={reservedFunds} reservedNote={reservedNote} />
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
