import { createClient } from "@/lib/supabase/server";
import { assertCanExport } from "@/lib/export-auth";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  const permError = await assertCanExport();
  if (permError) {
    return new Response(permError, { status: 403 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("treasury_movements")
    .select("movement_date, movement_type, description, amount, members(full_name), events(name)")
    .order("movement_date", { ascending: false });

  const rows = (
    (data ?? []) as unknown as Array<{
      movement_date: string;
      movement_type: string;
      description: string | null;
      amount: number;
      members: { full_name: string } | null;
      events: { name: string } | null;
    }>
  ).map((m) => [
    m.movement_date,
    m.movement_type,
    m.description ?? "",
    m.members?.full_name ?? "",
    m.events?.name ?? "",
    m.amount.toFixed(2),
  ]);

  const csv = toCsv(["Fecha", "Tipo", "Descripción", "Socio", "Evento", "Importe (€)"], rows);
  return csvResponse(`movimientos-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
