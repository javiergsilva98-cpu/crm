import { createClient } from "@/lib/supabase/server";
import { assertCanExport } from "@/lib/export-auth";
import { toCsv, csvResponse } from "@/lib/csv";

const INGRESO_TYPES = ["cuota", "ingreso"];

export async function GET() {
  const permError = await assertCanExport();
  if (permError) {
    return new Response(permError, { status: 403 });
  }

  const supabase = await createClient();
  const [{ data: membersData }, { data: movementsData }, { data: consumptionsData }] = await Promise.all([
    supabase.from("members").select("id, full_name, status").order("full_name"),
    supabase.from("treasury_movements").select("member_id, movement_type, amount"),
    supabase.from("consumptions").select("member_id, quantity, unit_price"),
  ]);

  const members = membersData ?? [];
  const movements = movementsData ?? [];
  const consumptions = consumptionsData ?? [];

  const rows = members.map((m) => {
    const paid = movements
      .filter((mv) => mv.member_id === m.id && INGRESO_TYPES.includes(mv.movement_type))
      .reduce((acc, mv) => acc + mv.amount, 0);
    const consumed = consumptions
      .filter((c) => c.member_id === m.id)
      .reduce((acc, c) => acc + c.quantity * c.unit_price, 0);
    return [m.full_name, m.status, paid.toFixed(2), consumed.toFixed(2), (paid - consumed).toFixed(2)];
  });

  const csv = toCsv(["Socio", "Estado", "Pagado (€)", "Consumido (€)", "Saldo (€)"], rows);
  return csvResponse(`saldos-socios-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
