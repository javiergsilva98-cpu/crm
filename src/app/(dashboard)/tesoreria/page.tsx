import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { MemberSwitcher } from "@/components/member-switcher";

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
type Consumption = { member_id: string; quantity: number; unit_price: number };
type Member = { id: string; full_name: string };

function eur(n: number) {
  return `${n.toFixed(2)} €`;
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

  const [{ data: movementsData }, { data: consumptionsData }, { data: membersData }] =
    await Promise.all([
      supabase
        .from("treasury_movements")
        .select("id, movement_type, amount, movement_date, description, member_id, event_id")
        .order("movement_date", { ascending: false }),
      supabase.from("consumptions").select("member_id, quantity, unit_price"),
      supabase.from("members").select("id, full_name").eq("status", "activo").order("full_name"),
    ]);

  const movements = (movementsData ?? []) as Movement[];
  const consumptions = (consumptionsData ?? []) as Consumption[];
  const members = (membersData ?? []) as Member[];

  const clubBalance = movements.reduce(
    (acc, m) => acc + (INGRESO_TYPES.includes(m.movement_type) ? m.amount : -m.amount),
    0,
  );

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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Tesorería</h1>
          <MemberSwitcher members={members} current={currentId} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted">Saldo del club</p>
            <p className="mt-2 text-3xl font-semibold">{eur(clubBalance)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted">Tu saldo</p>
            <p className={`mt-2 text-3xl font-semibold ${balance < 0 ? "text-amber-700" : "text-green-700"}`}>
              {eur(balance)}
            </p>
            <p className="mt-1 text-xs text-muted/70">
              {balance < 0 ? "Debes al club" : "A tu favor"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Tesorería</h1>

      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted">Saldo del club</p>
        <p className="mt-2 text-3xl font-semibold">{eur(clubBalance)}</p>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Cuota fija vs. cargos de evento</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <BreakdownCard label="Cuotas" value={breakdown.cuotas} />
        <BreakdownCard label="Ingresos de eventos" value={breakdown.ingresosEventos} />
        <BreakdownCard label="Otros ingresos" value={breakdown.otrosIngresos} />
        <BreakdownCard label="Compras de evento" value={-breakdown.comprasEvento} />
        <BreakdownCard label="Compras ordinarias" value={-breakdown.comprasOrdinarias} />
        <BreakdownCard label="Compras grandes" value={-breakdown.comprasGrandes} />
        <BreakdownCard label="Urgencias" value={-breakdown.urgencias} />
      </div>

      <h2 className="mb-3 text-lg font-semibold">Saldo por socio</h2>
      <div className="mb-8 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted/70">
              <th className="px-4 py-3">Socio</th>
              <th className="px-4 py-3">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const balance = memberBalance(m.id);
              return (
                <tr key={m.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{m.full_name}</td>
                  <td className={`px-4 py-3 font-medium ${balance < 0 ? "text-amber-700" : "text-green-700"}`}>
                    {eur(balance)}
                  </td>
                </tr>
              );
            })}
            {members.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-muted/70">
                  No hay socios de ejemplo todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Movimientos recientes</h2>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted/70">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Importe</th>
            </tr>
          </thead>
          <tbody>
            {movements.slice(0, 20).map((m) => (
              <tr key={m.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 text-muted">{m.movement_date}</td>
                <td className="px-4 py-3 capitalize text-muted">{m.movement_type.replace("_", " ")}</td>
                <td className="px-4 py-3 text-foreground">{m.description ?? "—"}</td>
                <td
                  className={`px-4 py-3 font-medium ${
                    INGRESO_TYPES.includes(m.movement_type) ? "text-green-700" : "text-amber-700"
                  }`}
                >
                  {INGRESO_TYPES.includes(m.movement_type) ? "+" : "-"}
                  {eur(m.amount)}
                </td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted/70">
                  No hay movimientos de ejemplo todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BreakdownCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${value < 0 ? "text-amber-700" : "text-foreground"}`}>
        {eur(value)}
      </p>
    </div>
  );
}
