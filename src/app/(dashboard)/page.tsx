import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PipelineChart } from "./pipeline-chart";
import { CHANNELS, CHANNEL_LABELS, type Channel } from "@/lib/channels";
import { currentMonthRange } from "@/lib/month";
import { computeSeries, metricInfo, type MetricKey } from "./informes/aggregate";
import { fetchRawData } from "./informes/raw-data";
import { ReportView } from "./informes/report-view";
import type { ChartType } from "./informes/validate";

type SeriesRow = { metric: MetricKey; color: string; compare?: boolean };

export default async function DashboardHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: homeReport } = user
    ? await supabase
        .from("reports")
        .select("id, name, chart_type, series, date_from, date_to")
        .eq("owner_id", user.id)
        .eq("is_home", true)
        .maybeSingle()
    : { data: null };

  if (homeReport) {
    const raw = await fetchRawData(supabase);
    const series = ((homeReport.series as SeriesRow[] | null) ?? []).filter((s) => metricInfo(s.metric));
    const computed = computeSeries(raw, series, homeReport.date_from, homeReport.date_to);

    return (
      <div>
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-1 font-heading text-3xl font-semibold text-ink">{homeReport.name}</h1>
            <p className="text-sm text-ink-mute">Este es tu informe de inicio.</p>
          </div>
          <Link href="/informes" className="text-sm text-ink-soft hover:text-ink hover:underline">
            Cambiar inicio →
          </Link>
        </div>
        <div className="rounded-lg border border-border bg-raised p-5">
          <ReportView chartType={homeReport.chart_type as ChartType} series={computed} />
        </div>
      </div>
    );
  }

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
      <h1 className="mb-1 font-heading text-3xl font-semibold text-ink">Resumen</h1>
      <p className="mb-8 text-sm text-ink-mute">Cómo va tu negocio hoy.</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-raised p-6 transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg hover:shadow-black/10"
          >
            <p className="text-sm text-ink-mute">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{card.value}</p>
          </div>
        ))}
      </div>

      <Link
        href="/canales"
        className="mb-8 block rounded-lg border p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10"
        style={
          breakdownPhrase
            ? { borderColor: "var(--accent-signal)", background: "var(--accent-signal-wash)" }
            : { borderColor: "var(--border-subtle)", background: "var(--bg-raised)" }
        }
      >
        <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
          {breakdownPhrase && <span className="text-signal">✦</span>} ¿De dónde vienen tus contactos?
        </h2>
        {breakdownPhrase ? (
          <p className="text-sm text-ink">
            De cada 10 contactos este mes, <strong>{breakdownPhrase}</strong>.{" "}
            <span className="text-ink-mute">Ver coste por canal →</span>
          </p>
        ) : (
          <p className="text-sm text-ink-mute">
            Todavía no hay contactos con canal de origen este mes. Ver canales →
          </p>
        )}
      </Link>

      <PipelineChart data={(opportunities ?? []).map((o) => ({ stage: o.stage, amount: Number(o.amount) }))} />
    </div>
  );
}
