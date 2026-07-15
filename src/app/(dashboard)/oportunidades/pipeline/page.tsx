import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "./board";
import { HelpButton } from "@/components/help-button";

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id, title, stage, amount, stage_entered_at, updated_at, companies!company_id(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold text-ink">
            Pipeline
            <HelpButton slug="pipeline-oportunidades" label="Etapas y pipeline" />
          </h1>
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
