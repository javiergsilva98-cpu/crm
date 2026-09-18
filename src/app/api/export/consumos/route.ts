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
    .from("consumptions")
    .select("consumed_at, quantity, unit_price, members(full_name), menu_items(name)")
    .order("consumed_at", { ascending: false });

  const rows = (
    (data ?? []) as unknown as Array<{
      consumed_at: string;
      quantity: number;
      unit_price: number;
      members: { full_name: string } | null;
      menu_items: { name: string } | null;
    }>
  ).map((c) => [
    c.consumed_at,
    c.members?.full_name ?? "",
    c.menu_items?.name ?? "",
    c.quantity,
    c.unit_price.toFixed(2),
    (c.quantity * c.unit_price).toFixed(2),
  ]);

  const csv = toCsv(["Fecha", "Socio", "Artículo", "Cantidad", "Precio unidad (€)", "Total (€)"], rows);
  return csvResponse(`consumos-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
