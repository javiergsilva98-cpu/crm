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
    .from("inventory_restocks")
    .select("restocked_at, quantity, cost, inventory_items(name, unit), members(full_name)")
    .order("restocked_at", { ascending: false });

  const rows = (
    (data ?? []) as unknown as Array<{
      restocked_at: string;
      quantity: number;
      cost: number;
      inventory_items: { name: string; unit: string } | null;
      members: { full_name: string } | null;
    }>
  ).map((r) => [
    r.restocked_at,
    r.inventory_items?.name ?? "",
    r.quantity,
    r.inventory_items?.unit ?? "",
    r.cost.toFixed(2),
    r.members?.full_name ?? "",
  ]);

  const csv = toCsv(["Fecha", "Artículo", "Cantidad", "Unidad", "Coste (€)", "Responsable"], rows);
  return csvResponse(`reposiciones-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
