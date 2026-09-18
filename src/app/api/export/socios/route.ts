import { createClient } from "@/lib/supabase/server";
import { assertCanExport } from "@/lib/export-auth";
import { toCsv, csvResponse } from "@/lib/csv";
import { CLUB_ROLE_LABELS, type ClubRole } from "@/lib/demo-role";

export async function GET() {
  const permError = await assertCanExport();
  if (permError) {
    return new Response(permError, { status: 403 });
  }

  const supabase = await createClient();
  const now = new Date();
  const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [{ data: members }, { data: cuotas }] = await Promise.all([
    supabase
      .from("members")
      .select("id, full_name, club_role, status, key_number, joined_at")
      .order("full_name"),
    supabase
      .from("treasury_movements")
      .select("member_id")
      .eq("movement_type", "cuota")
      .gte("movement_date", currentMonthStart),
  ]);

  const paidIds = new Set((cuotas ?? []).map((c) => c.member_id));
  const rows = (members ?? []).map((m) => [
    m.full_name,
    CLUB_ROLE_LABELS[m.club_role as ClubRole] ?? m.club_role,
    m.status,
    m.key_number ?? "",
    m.joined_at,
    paidIds.has(m.id) ? "Sí" : "No",
  ]);

  const csv = toCsv(["Nombre", "Rol", "Estado", "Nº llave", "Alta", "Cuota al día"], rows);
  return csvResponse(`socios-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
