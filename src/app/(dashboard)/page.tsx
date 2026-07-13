import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PipelineChart } from "./pipeline-chart";
import { CHANNELS, CHANNEL_LABELS, type Channel } from "@/lib/channels";
import { currentMonthRange } from "@/lib/month";

export default async function DashboardHome() {
  const supabase = await createClient();
  const { start, end } = currentMonthRange();

  const [{ count: companies }, { count: contacts }, { data: opportunities }, { data: monthContacts }] =
    await Promise.all([
      supabase.from("companies").select("*", { count: "exact", head: true }),
      supabase.from("contacts").select("*", { count: "exact", head: true }),
      supabase.from("opportunities").select("stage, amount"),
      supabase
        .from("contacts")
        .select("source")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString()),
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

  const countByChannel = new Map<Channel, number>();
  for (const c of monthContacts ?? []) {
    if (c.source && (CHANNELS as readonly string[]).includes(c.source)) {
      countByChannel.set(c.source as Channel, (countByChannel.get(c.source as Channel) ?? 0) + 1);
    }
  }
  const totalWithSource = [...countByChannel.values()].reduce((a, b) => a + b, 0);
  const breakdownPhrase =
    totalWithSource > 0
      ? CHANNELS.filter((c) => (countByChannel.get(c) ?? 0) > 0)
          .sort((a, b) => (countByChannel.get(b) ?? 0) - (countByChannel.get(a) ?? 0))
          .map((c) => `${Math.round(((countByChannel.get(c) ?? 0) / totalWithSource) * 10)} de ${CHANNEL_LABELS[c]}`)
          .join(", ")
      : null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Resumen</h1>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <Link
        href="/canales"
        className="mb-8 block rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hover:border-gray-300 dark:hover:border-gray-700"
      >
        <h2 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">¿De dónde vienen tus contactos?</h2>
        {breakdownPhrase ? (
          <p className="text-sm">
            De cada 10 contactos este mes, <strong>{breakdownPhrase}</strong>.{" "}
            <span className="text-gray-500 dark:text-gray-500">Ver coste por canal →</span>
          </p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Todavía no hay contactos con canal de origen este mes. Ver canales →
          </p>
        )}
      </Link>

      <PipelineChart data={(opportunities ?? []).map((o) => ({ stage: o.stage, amount: Number(o.amount) }))} />
    </div>
  );
}
