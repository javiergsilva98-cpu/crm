import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "./board";

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id, title, stage, amount, companies(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-ink">Pipeline</h1>
          <p className="mt-1 text-sm text-ink-mute">Arrastra una tarjeta para cambiarla de etapa.</p>
        </div>
        <Link href="/oportunidades" className="text-sm text-ink-soft hover:text-ink hover:underline">
          Ver como lista
        </Link>
      </div>
      <PipelineBoard
        opportunities={(opportunities ?? []).map((o) => ({
          ...o,
          companies: (o.companies as unknown as { name: string } | null) ?? null,
        }))}
      />
    </div>
  );
}
