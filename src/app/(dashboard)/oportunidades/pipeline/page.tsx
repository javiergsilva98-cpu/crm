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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        <Link href="/oportunidades" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
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
