import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import { CHANNEL_LABELS, type Channel } from "@/lib/channels";

export async function GET() {
  const supabase = await createClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("full_name, email, phone, source, source_detail, companies!company_id(name)")
    .order("created_at", { ascending: false });

  const csv = toCsv(
    ["Nombre", "Email", "Teléfono", "Empresa", "Canal", "Detalle del canal"],
    (contacts ?? []).map((c) => [
      c.full_name,
      c.email,
      c.phone,
      (c.companies as unknown as { name: string } | null)?.name ?? "",
      c.source ? CHANNEL_LABELS[c.source as Channel] : "",
      c.source_detail ?? "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contactos.csv"',
    },
  });
}
