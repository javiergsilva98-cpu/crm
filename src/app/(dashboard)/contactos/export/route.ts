import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import { CHANNEL_LABELS, type Channel } from "@/lib/channels";

export async function GET() {
  const supabase = await createClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select(
      "full_name, correo_electronico, numero_telefono, fuente_trafico_original, desglose_fuente_original_1, companies!empresa_principal_asociada(nombre_empresa)",
    )
    .order("fecha_creacion", { ascending: false });

  const csv = toCsv(
    ["Nombre", "Email", "Teléfono", "Empresa", "Canal", "Detalle del canal"],
    (contacts ?? []).map((c) => [
      c.full_name,
      c.correo_electronico,
      c.numero_telefono,
      (c.companies as unknown as { nombre_empresa: string } | null)?.nombre_empresa ?? "",
      c.fuente_trafico_original ? CHANNEL_LABELS[c.fuente_trafico_original as Channel] : "",
      c.desglose_fuente_original_1 ?? "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contactos.csv"',
    },
  });
}
