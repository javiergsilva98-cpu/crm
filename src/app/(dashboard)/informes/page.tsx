import { createClient } from "@/lib/supabase/server";
import { fetchRawData } from "./raw-data";
import { CreateReportForm } from "./create-report-form";
import { ReportCard } from "./report-card";
import { AddDisclosure } from "@/components/add-disclosure";
import { HelpButton } from "@/components/help-button";
import { blocksFromDb, sanitizeBlocks } from "./blocks";

export default async function InformesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: reports }, raw] = await Promise.all([
    supabase
      .from("reports")
      .select("id, name, blocks, date_from, date_to, is_home, is_template, owner_id, created_at")
      .order("created_at", { ascending: false }),
    fetchRawData(supabase),
  ]);

  const ownReports = (reports ?? []).filter((r) => r.owner_id === user?.id);
  const templateReports = (reports ?? []).filter((r) => r.owner_id !== user?.id);

  function renderReport(report: NonNullable<typeof reports>[number]) {
    const blocks = sanitizeBlocks(blocksFromDb(report.blocks));
    return (
      <ReportCard key={report.id} report={{ ...report, blocks }} raw={raw} isOwner={report.owner_id === user?.id} />
    );
  }

  return (
    <div>
      <h1 className="mb-1 flex items-center gap-2 font-heading text-3xl font-semibold text-ink">
        Informes
        <HelpButton slug="informes-avanzados" label="Informes avanzados" />
      </h1>
      <p className="mb-8 text-sm text-ink-mute">
        Crea y guarda informes con las métricas del CRM que más te interesan. Puedes marcar uno como la pantalla de inicio o compartirlo como plantilla con el equipo.
      </p>

      <AddDisclosure label="Crear informe">
        <CreateReportForm raw={raw} />
      </AddDisclosure>

      {(!reports || reports.length === 0) && (
        <div className="rounded-lg border border-border bg-raised p-6 text-center">
          <p className="font-heading text-base text-ink">Todavía no tienes informes</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-mute">Crea el primero arriba eligiendo una métrica.</p>
        </div>
      )}

      {ownReports.length > 0 && (
        <div className="mb-8 flex flex-col gap-6">
          <h2 className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Tus informes</h2>
          {ownReports.map(renderReport)}
        </div>
      )}

      {templateReports.length > 0 && (
        <div className="flex flex-col gap-6">
          <h2 className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Plantillas del equipo</h2>
          {templateReports.map(renderReport)}
        </div>
      )}
    </div>
  );
}
