import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { KeyIcon } from "@/components/icons";
import { ClubSwitch } from "./club-switch";
import { PresenceButton } from "./presence-button";
import { TransferForm } from "./transfer-form";
import { IncomingTransferBanner } from "./incoming-transfer-banner";

const HISTORY_ROLES = ["admin", "presidente", "tesorero"];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

export default async function FichajePage() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();

  const { data: membersData } = await supabase
    .from("members")
    .select("id, full_name")
    .eq("status", "activo")
    .order("full_name");
  const members = membersData ?? [];
  const cookieId = await getDemoMemberIdCookie();
  const currentMemberId = members.find((m) => m.id === cookieId)?.id ?? members[0]?.id ?? "";

  const [{ data: statusData }, { data: myPresenceData }, { data: presenceListData }, { data: incomingData }, { data: outgoingData }] =
    await Promise.all([
      supabase.from("club_status").select("is_open, responsible_member_id, responsible_member_name, opened_at").eq("id", true).maybeSingle(),
      supabase.from("presence").select("id").eq("member_id", currentMemberId).is("checked_out_at", null).maybeSingle(),
      supabase.from("presence").select("id, member_id, member_name, checked_in_at").is("checked_out_at", null).order("checked_in_at"),
      supabase
        .from("responsibility_transfers")
        .select("id, from_member_name")
        .eq("to_member_id", currentMemberId)
        .eq("status", "pendiente")
        .maybeSingle(),
      supabase
        .from("responsibility_transfers")
        .select("id, to_member_name")
        .eq("from_member_id", currentMemberId)
        .eq("status", "pendiente")
        .maybeSingle(),
    ]);

  const isOpen = statusData?.is_open ?? false;
  const responsibleId = statusData?.responsible_member_id ?? null;
  const responsibleName = statusData?.responsible_member_name ?? null;
  const isResponsible = isOpen && responsibleId === currentMemberId;
  const isCheckedIn = Boolean(myPresenceData);
  const presenceList = presenceListData ?? [];
  const canSeePresence = HISTORY_ROLES.includes(demoRole) || isCheckedIn;
  const presentMembers = presenceList
    .filter((p) => p.member_id !== currentMemberId)
    .map((p) => ({ id: p.member_id, full_name: p.member_name }));

  let history: { id: string; label: string; at: string }[] = [];
  if (HISTORY_ROLES.includes(demoRole)) {
    const [{ data: logData }, { data: transfersData }] = await Promise.all([
      supabase.from("club_status_log").select("id, event_type, actor_member_name, created_at").order("created_at", { ascending: false }).limit(30),
      supabase
        .from("responsibility_transfers")
        .select("id, from_member_name, to_member_name, status, created_at, responded_at")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    const logEntries = (logData ?? []).map((l) => ({
      id: `log-${l.id}`,
      label: `${l.event_type === "apertura" ? "Apertura" : "Cierre"} · ${l.actor_member_name ?? "—"}`,
      at: l.created_at,
    }));
    const transferEntries = (transfersData ?? []).map((t) => ({
      id: `tr-${t.id}`,
      label: `Cesión: ${t.from_member_name} → ${t.to_member_name} (${
        t.status === "pendiente" ? "pendiente" : t.status === "aceptada" ? "aceptada" : t.status === "rechazada" ? "rechazada" : "cancelada"
      })`,
      at: t.responded_at ?? t.created_at,
    }));
    history = [...logEntries, ...transferEntries].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 30);
  }

  return (
    <div>
      <div className="mb-1 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft">
          <KeyIcon className="h-[18px] w-[18px] text-accent" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Fichaje</h1>
      </div>
      <p className="mb-5 mt-1 text-sm text-muted">
        Quién abre y cierra el local, y quién está dentro ahora mismo.
      </p>

      {incomingData && <IncomingTransferBanner transferId={incomingData.id} fromName={incomingData.from_member_name} />}

      <div className="flex flex-col gap-3">
        <ClubSwitch
          isOpen={isOpen}
          responsibleName={responsibleName}
          openedAt={statusData?.opened_at ?? null}
          isResponsible={isResponsible}
          canForceClose={["admin", "presidente"].includes(demoRole)}
        />

        {isResponsible && (
          <TransferForm
            presentMembers={presentMembers}
            pendingTransfer={outgoingData ? { toName: outgoingData.to_member_name } : null}
          />
        )}

        <PresenceButton isCheckedIn={isCheckedIn} clubOpen={isOpen} />

        <div className="rounded-[18px] border border-border bg-card p-4">
          <p className="text-sm font-bold text-foreground">Quién está dentro ahora</p>
          {canSeePresence ? (
            <div className="mt-2 flex flex-col gap-1.5">
              {presenceList.map((p) => (
                <p key={p.id} className="text-sm text-foreground">
                  {p.member_name}
                  {p.member_id === currentMemberId && <span className="text-xs text-muted"> (tú)</span>}
                  <span className="ml-1.5 text-xs text-muted">· desde {formatDateTime(p.checked_in_at)}</span>
                </p>
              ))}
              {presenceList.length === 0 && <p className="mt-1 text-sm text-muted">Nadie fichado ahora mismo.</p>}
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted">
              Solo puedes ver quién está dentro si tú también estás fichado como presente.
            </p>
          )}
        </div>
      </div>

      {HISTORY_ROLES.includes(demoRole) && (
        <>
          <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">
            Historial (admin, presidencia y tesorería)
          </p>
          <div className="overflow-hidden rounded-[18px] border border-border bg-card">
            {history.map((h, idx) => (
              <div
                key={h.id}
                className={`flex items-center justify-between gap-3 px-3.5 py-3 ${idx !== history.length - 1 ? "border-b border-border" : ""}`}
              >
                <p className="text-sm text-foreground">{h.label}</p>
                <p className="text-xs text-muted">{formatDateTime(h.at)}</p>
              </div>
            ))}
            {history.length === 0 && (
              <p className="px-3.5 py-6 text-center text-sm text-muted">Todavía no hay nada registrado.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
