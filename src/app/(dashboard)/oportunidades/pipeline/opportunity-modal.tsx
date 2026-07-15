"use client";

import { useEffect, useState } from "react";
import { STAGE_LABELS } from "@/lib/stages";
import { formatDateTime } from "@/lib/format";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  getOpportunityDetail,
  updateOpportunityNotes,
  addOpportunityActivity,
  deleteOpportunityActivity,
} from "./actions";

type Detail = Awaited<ReturnType<typeof getOpportunityDetail>>;

function daysAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "hoy";
  if (days === 1) return "1 día";
  return `${days} días`;
}

export function OpportunityModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOpportunityDetail(id).then((result) => {
      if (cancelled) return;
      setDetail(result);
      setNotes(result.opportunity?.notes ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-raised p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {!detail || !detail.opportunity ? (
          <p className="text-sm text-ink-mute">Cargando...</p>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-semibold text-ink">{detail.opportunity.title}</h2>
                <p className="mt-0.5 text-sm text-ink-mute">
                  {[detail.opportunity.companies?.name, detail.opportunity.contacts?.full_name].filter(Boolean).join(" · ") || "Sin empresa ni contacto"}
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label="Cerrar" className="text-ink-mute transition-colors hover:text-ink">
                ×
              </button>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-ink-mute uppercase">Etapa</p>
                <p className="mt-0.5 text-ink">{STAGE_LABELS[detail.opportunity.stage as keyof typeof STAGE_LABELS] ?? detail.opportunity.stage}</p>
              </div>
              <div>
                <p className="text-xs text-ink-mute uppercase">Monto</p>
                <p className="mt-0.5 text-ink">{Number(detail.opportunity.amount).toLocaleString("es-ES")}€</p>
              </div>
              <div>
                <p className="text-xs text-ink-mute uppercase">En esta etapa</p>
                <p className="mt-0.5 text-ink">{daysAgo(detail.opportunity.stage_entered_at)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-mute uppercase">Modificado</p>
                <p className="mt-0.5 text-ink" title={formatDateTime(detail.opportunity.updated_at)}>
                  hace {daysAgo(detail.opportunity.updated_at)}
                </p>
              </div>
            </div>

            <div className="mb-5">
              <p className="mb-1 text-xs font-semibold text-ink-soft uppercase">Notas</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Notas generales de esta oportunidad..."
                className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
              />
              <button
                type="button"
                disabled={savingNotes}
                onClick={async () => {
                  setSavingNotes(true);
                  const formData = new FormData();
                  formData.set("id", id);
                  formData.set("notes", notes);
                  await updateOpportunityNotes(formData);
                  setSavingNotes(false);
                }}
                className="mt-2 rounded-md border border-border px-3 py-1 text-xs text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
              >
                {savingNotes ? "Guardando..." : "Guardar notas"}
              </button>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-ink-soft uppercase">Actividad ({detail.activities.length})</p>
              <form
                action={async (formData) => {
                  formData.set("opportunity_id", id);
                  await addOpportunityActivity(formData);
                  const result = await getOpportunityDetail(id);
                  setDetail(result);
                }}
                className="mb-3 flex gap-2"
              >
                <input
                  name="body"
                  placeholder="Añadir una nota (llamada, reunión, email...)"
                  required
                  className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
                />
                <button type="submit" className="rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover">
                  Añadir
                </button>
              </form>
              <div className="flex flex-col gap-2">
                {detail.activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between rounded-lg border border-border bg-base px-3 py-2 text-sm">
                    <div>
                      <p className="text-ink">{activity.body}</p>
                      <p className="text-xs text-ink-mute">{formatDateTime(activity.created_at)}</p>
                    </div>
                    <form
                      action={async (formData) => {
                        await deleteOpportunityActivity(formData);
                        const result = await getOpportunityDetail(id);
                        setDetail(result);
                      }}
                    >
                      <input type="hidden" name="id" value={activity.id} />
                      <ConfirmSubmitButton confirmMessage="¿Eliminar esta nota de actividad?" className="text-danger hover:underline">
                        Eliminar
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                ))}
                {detail.activities.length === 0 && (
                  <p className="rounded-lg border border-border bg-base px-3 py-4 text-center text-xs text-ink-mute">
                    Sin actividad registrada todavía.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
