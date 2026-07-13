import { createClient } from "@/lib/supabase/server";
import { PipelineChart } from "./pipeline-chart";

export default async function DashboardHome() {
  const supabase = await createClient();

  const [{ count: companies }, { count: contacts }, { data: opportunities }] =
    await Promise.all([
      supabase.from("companies").select("*", { count: "exact", head: true }),
      supabase.from("contacts").select("*", { count: "exact", head: true }),
      supabase.from("opportunities").select("stage, amount"),
    ]);

  const opportunityCount = opportunities?.length ?? 0;
  const pipelineValue = (opportunities ?? []).reduce((sum, o) => sum + Number(o.amount), 0);
  const won = (opportunities ?? []).filter((o) => o.stage === "ganado").length;
  const lost = (opportunities ?? []).filter((o) => o.stage === "perdido").length;
  const conversionRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;

  const cards = [
    { label: "Empresas", value: companies ?? 0 },
    { label: "Contactos", value: contacts ?? 0 },
    { label: "Oportunidades", value: opportunityCount },
    { label: "Valor del pipeline", value: `$${pipelineValue.toLocaleString()}` },
    { label: "Tasa de conversión", value: conversionRate !== null ? `${conversionRate}%` : "—" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Resumen</h1>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
      <PipelineChart data={(opportunities ?? []).map((o) => ({ stage: o.stage, amount: Number(o.amount) }))} />
    </div>
  );
}
