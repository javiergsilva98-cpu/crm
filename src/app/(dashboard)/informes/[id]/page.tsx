import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeSeries } from "../aggregate";
import { fetchRawData } from "../raw-data";
import { ReportView } from "../report-view";
import { PrintButton } from "./print-button";
import { blocksFromDb, sanitizeBlocks } from "../blocks";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: report }, raw] = await Promise.all([
    supabase.from("reports").select("id, name, blocks, date_from, date_to").eq("id", id).maybeSingle(),
    fetchRawData(supabase),
  ]);

  if (!report) notFound();

  const blocks = sanitizeBlocks(blocksFromDb(report.blocks));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">{report.name}</h1>
          {(report.date_from || report.date_to) && (
            <p className="text-sm text-ink-mute">
              {report.date_from ?? "inicio"} → {report.date_to ?? "hoy"}
            </p>
          )}
        </div>
        <PrintButton />
      </div>
      <div className="flex flex-col gap-6">
        {blocks.map((block) => {
          const computed = computeSeries(raw, block.series, report.date_from, report.date_to);
          return (
            <div key={block.id} className="rounded-lg border border-border bg-raised p-5">
              {block.title && <h2 className="mb-3 text-base font-semibold text-ink">{block.title}</h2>}
              <ReportView chartType={block.chartType} series={computed} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
