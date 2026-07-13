import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const supabase = await createClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("name, website, industry, created_at")
    .order("created_at", { ascending: false });

  const csv = toCsv(
    ["Nombre", "Sitio web", "Industria", "Creado"],
    (companies ?? []).map((c) => [c.name, c.website, c.industry, c.created_at]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="empresas.csv"',
    },
  });
}
