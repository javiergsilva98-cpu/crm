import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const supabase = await createClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("nombre_empresa, nombre_dominio_empresa, industry, fecha_creacion")
    .order("fecha_creacion", { ascending: false });

  const csv = toCsv(
    ["Nombre", "Sitio web", "Industria", "Creado"],
    (companies ?? []).map((c) => [c.nombre_empresa, c.nombre_dominio_empresa, c.industry, c.fecha_creacion]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="empresas.csv"',
    },
  });
}
