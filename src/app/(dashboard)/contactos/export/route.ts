import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const supabase = await createClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("full_name, email, phone, companies(name)")
    .order("created_at", { ascending: false });

  const csv = toCsv(
    ["Nombre", "Email", "Teléfono", "Empresa"],
    (contacts ?? []).map((c) => [
      c.full_name,
      c.email,
      c.phone,
      (c.companies as unknown as { name: string } | null)?.name ?? "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contactos.csv"',
    },
  });
}
