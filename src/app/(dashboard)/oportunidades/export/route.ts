import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const supabase = await createClient();
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("title, stage, amount, companies!company_id(name)")
    .order("created_at", { ascending: false });

  const csv = toCsv(
    ["Título", "Etapa", "Monto", "Empresa"],
    (opportunities ?? []).map((o) => [
      o.title,
      o.stage,
      o.amount,
      (o.companies as unknown as { name: string } | null)?.name ?? "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="oportunidades.csv"',
    },
  });
}
