import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Único propósito: generar actividad real contra Supabase para que el
// proyecto gratuito no se autopause por 7 días sin uso (no hace nada
// útil para la app en sí). Vercel Cron llama a esta ruta una vez al día
// mandando CRON_SECRET en la cabecera Authorization — cualquier otra
// petición se rechaza para que nadie más pueda llamarla.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("members").select("id").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
