"use client";

import { useState } from "react";
import { deleteReport, setHomeReport, updateReport } from "./actions";
import { computeSeries, type RawData } from "./aggregate";
import { ReportView } from "./report-view";
import { ReportBuilderForm } from "./report-builder-form";
import { ExportCsvButton } from "./export-csv-button";
import type { ReportBlock } from "./blocks";
import Link from "next/link";

type Report = {
  id: string;
  name: string;
  blocks: ReportBlock[];
  date_from: string | null;
  date_to: string | null;
  is_home: boolean;
  is_template: boolean;
};

export function ReportCard({
  report,
  raw,
  isOwner,
}: {
  report: Report;
  raw: RawData;
  isOwner: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="rounded-lg border border-border bg-raised p-5">
        <ReportBuilderForm
          raw={raw}
          action={async (formData) => {
            await updateReport(formData);
            setEditing(false);
          }}
          submitLabel="Guardar cambios"
          onCancel={() => setEditing(false)}
          initial={{
            id: report.id,
            name: report.name,
            blocks: report.blocks,
            dateFrom: report.date_from ?? "",
            dateTo: report.date_to ?? "",
            isTemplate: report.is_template,
          }}
        />
      </div>
    );
  }

  const computedBlocks = report.blocks.map((block) => ({
    block,
    computed: computeSeries(raw, block.series, report.date_from, report.date_to),
  }));
  const allSeries = computedBlocks.flatMap((b) => b.computed);

  return (
    <div className="rounded-lg border border-border bg-raised p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-ink">
            {report.name}
            {report.is_home && <span className="ml-2 rounded-full bg-sunken px-2 py-0.5 text-xs font-normal text-ink-soft">Inicio</span>}
            {report.is_template && <span className="ml-2 rounded-full bg-sunken px-2 py-0.5 text-xs font-normal text-ink-soft">Plantilla de equipo</span>}
          </h2>
          {(report.date_from || report.date_to) && (
            <p className="text-xs text-ink-mute">
              {report.date_from ?? "inicio"} → {report.date_to ?? "hoy"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ExportCsvButton series={allSeries} filename={report.name} />
          <Link href={`/informes/${report.id}`} target="_blank" className="text-sm text-ink-soft hover:underline">
            Exportar PDF
          </Link>
          {isOwner && (
            <>
              <button type="button" onClick={() => setEditing(true)} className="text-sm text-ink-soft hover:underline">
                Editar
              </button>
              <form action={setHomeReport}>
                <input type="hidden" name="id" value={report.is_home ? "" : report.id} />
                <button type="submit" className="text-sm text-ink-soft hover:underline">
                  {report.is_home ? "Quitar de inicio" : "Usar como inicio"}
                </button>
              </form>
              <form action={deleteReport}>
                <input type="hidden" name="id" value={report.id} />
                <button type="submit" className="text-sm text-danger hover:underline">
                  Eliminar
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-6">
        {computedBlocks.map(({ block, computed }) => (
          <div key={block.id}>
            {block.title && <h3 className="mb-2 text-sm font-semibold text-ink">{block.title}</h3>}
            <ReportView chartType={block.chartType} series={computed} />
          </div>
        ))}
      </div>
    </div>
  );
}
