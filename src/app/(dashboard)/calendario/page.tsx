import { createClient } from "@/lib/supabase/server";
import { getDemoRole } from "@/lib/demo-context";
import { CheckIcon, XIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { EventForm } from "./event-form";
import { ReservationForm } from "./reservation-form";
import { CalendarioViews } from "./calendar-views";
import { approveReservation, rejectReservation } from "./actions";

const MANAGEMENT_ROLES = ["admin", "presidente", "vicepresidente", "secretario", "tesorero"];

type EventRow = {
  id: string;
  name: string;
  event_date: string;
  end_date: string | null;
  kind: "evento" | "reserva";
  status: "pendiente" | "confirmado" | "rechazado";
  notes: string | null;
  opens: { full_name: string } | null;
  closes: { full_name: string } | null;
  requester: { full_name: string } | null;
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default async function CalendarioPage() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();
  const canManage = MANAGEMENT_ROLES.includes(demoRole);

  const [{ data: eventsData }, { data: membersData }] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, name, event_date, end_date, kind, status, notes, opens:members!events_opens_member_id_fkey(full_name), closes:members!events_closes_member_id_fkey(full_name), requester:members!events_requested_by_member_id_fkey(full_name)",
      )
      .order("event_date", { ascending: true }),
    supabase.from("members").select("id, full_name").eq("status", "activo").order("full_name"),
  ]);

  const events = (eventsData ?? []) as unknown as EventRow[];
  const members = membersData ?? [];
  const pending = events.filter((e) => e.status === "pendiente");
  const visible = events.filter((e) => e.status !== "pendiente");

  return (
    <div>
      <h1 className="mb-1 text-xl font-extrabold tracking-tight text-foreground">Calendario</h1>
      <p className="mb-5 text-sm text-muted">Eventos del club y reservas del local</p>

      {canManage && pending.length > 0 && (
        <div className="mb-7">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">
            Solicitudes pendientes ({pending.length})
          </p>
          <div className="flex flex-col gap-2.5">
            {pending.map((e) => (
              <form key={e.id} className="rounded-[18px] border border-warning-soft bg-warning-soft/40 p-4">
                <input type="hidden" name="id" value={e.id} />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{e.name}</p>
                    <p className="text-xs text-muted">
                      {formatDate(e.event_date)}
                      {e.end_date ? ` – ${formatDate(e.end_date)}` : ""} · Solicita:{" "}
                      {e.requester?.full_name ?? "—"}
                    </p>
                    {e.notes && <p className="mt-1 text-xs text-muted">{e.notes}</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div>
                    <label className="mb-1 block text-[11px] text-muted">Quién abre</label>
                    <select
                      name="opens_member_id"
                      className="rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-accent"
                    >
                      <option value="">Sin asignar</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-muted">Quién cierra</label>
                    <select
                      name="closes_member_id"
                      className="rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-accent"
                    >
                      <option value="">Sin asignar</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <SubmitButton
                    formAction={async (fd) => {
                      "use server";
                      await approveReservation(fd);
                    }}
                    className="flex items-center gap-1 rounded-xl bg-success px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                    Aprobar
                  </SubmitButton>
                  <SubmitButton
                    formAction={async (fd) => {
                      "use server";
                      await rejectReservation(fd);
                    }}
                    className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted disabled:opacity-50"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                    Rechazar
                  </SubmitButton>
                </div>
              </form>
            ))}
          </div>
        </div>
      )}

      <CalendarioViews
        events={visible.map((e) => ({
          id: e.id,
          name: e.name,
          event_date: e.event_date,
          end_date: e.end_date,
          kind: e.kind,
          status: e.status,
          notes: e.notes,
          opensName: e.opens?.full_name ?? null,
          closesName: e.closes?.full_name ?? null,
        }))}
      />

      {canManage && (
        <>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Nuevo evento</p>
          <div className="mb-7">
            <EventForm members={members} />
          </div>
        </>
      )}

      <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Solicitar reserva del local</p>
      <ReservationForm />
    </div>
  );
}
