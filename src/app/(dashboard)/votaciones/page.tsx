import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { VoteIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { VoteForm } from "./vote-form";
import { CastForm } from "./cast-form";
import { closeVote, closeExpiredVotes } from "./actions";
import { VOTE_MANAGE_ROLES as BOARD_ROLES, VOTE_CREATE_ROLES as CREATE_VOTE_ROLES } from "@/lib/permissions";
// Crear una votación nueva es solo cosa de presidencia y secretaría
// (más admin, que siempre tiene acceso total) — cerrarla sigue abierto
// a la directiva con acceso operativo, ver VOTE_MANAGE_ROLES en
// src/lib/permissions.ts (secretario ya NO gestiona/cierra, Fase 10).

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

type VoteOption = { id: string; label: string; position: number };
type VoteRow = {
  id: string;
  question: string;
  description: string | null;
  is_anonymous: boolean;
  status: "abierta" | "cerrada";
  category: "normal" | "express";
  deadline: string | null;
  auto_closed: boolean;
  created_at: string;
  vote_options: VoteOption[];
};
type ResultRow = { option_id: string; label: string; votes: number };
type CastRow = { option_id: string; members: { full_name: string } | null };

export default async function VotacionesPage() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();
  const canManage = BOARD_ROLES.includes(demoRole);
  const canCreate = CREATE_VOTE_ROLES.includes(demoRole);

  // Sin cron: al entrar aquí, cierra por sistema cualquier votación cuya
  // fecha límite ya haya pasado, para que el listado se vea al día.
  await closeExpiredVotes();

  const [{ data: membersData }, { data: votesData }] = await Promise.all([
    supabase.from("members").select("id, full_name").eq("status", "activo").order("full_name"),
    supabase
      .from("votes")
      .select(
        "id, question, description, is_anonymous, status, category, deadline, auto_closed, created_at, vote_options(id, label, position)",
      )
      .order("created_at", { ascending: false })
      .order("position", { referencedTable: "vote_options" }),
  ]);

  const members = membersData ?? [];
  const votes = (votesData ?? []) as unknown as VoteRow[];

  const cookieId = await getDemoMemberIdCookie();
  const currentMemberId = members.find((m) => m.id === cookieId)?.id ?? members[0]?.id ?? "";

  const enriched = await Promise.all(
    votes.map(async (v) => {
      const [{ data: results }, myCast, breakdown] = await Promise.all([
        supabase.rpc("vote_results", { p_vote_id: v.id }),
        currentMemberId
          ? supabase
              .from("vote_casts")
              .select("option_id")
              .eq("vote_id", v.id)
              .eq("member_id", currentMemberId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        v.is_anonymous
          ? Promise.resolve({ data: null })
          : supabase.from("vote_casts").select("option_id, members(full_name)").eq("vote_id", v.id),
      ]);
      return {
        ...v,
        results: (results ?? []) as ResultRow[],
        myOptionId: (myCast.data as { option_id: string } | null)?.option_id ?? null,
        breakdown: breakdown.data as unknown as CastRow[] | null,
      };
    }),
  );

  return (
    <div>
      <h1 className="mb-5 text-xl font-extrabold tracking-tight text-foreground">Votaciones</h1>

      <div className="flex flex-col gap-3">
        {enriched.map((v) => {
          const total = v.results.reduce((acc, r) => acc + Number(r.votes), 0);
          return (
            <div key={v.id} className="rounded-[18px] border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-2.5">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-accent-soft">
                    <VoteIcon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-bold text-foreground">{v.question}</p>
                      {v.category === "express" && (
                        <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning">
                          Express
                        </span>
                      )}
                    </div>
                    {v.description && <p className="mt-0.5 text-xs text-muted">{v.description}</p>}
                    {v.deadline && (
                      <p className="mt-0.5 text-[11px] text-muted">
                        {v.status === "abierta"
                          ? `Cierra el ${formatDateTime(v.deadline)}`
                          : v.auto_closed
                            ? `Cerrada automáticamente el ${formatDateTime(v.deadline)}`
                            : `Fecha límite: ${formatDateTime(v.deadline)}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      v.status === "abierta" ? "bg-success-soft text-success" : "bg-border text-muted"
                    }`}
                  >
                    {v.status === "abierta" ? "Abierta" : "Cerrada"}
                  </span>
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
                    {v.is_anonymous ? "Anónima" : "Pública"}
                  </span>
                </div>
              </div>

              {v.status === "abierta" && !v.myOptionId && currentMemberId && (
                <CastForm voteId={v.id} memberId={currentMemberId} options={v.vote_options} />
              )}

              {(v.status === "cerrada" || v.myOptionId) && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {v.myOptionId && (
                    <p className="mb-1 text-xs font-semibold text-accent">
                      Tu voto: {v.vote_options.find((o) => o.id === v.myOptionId)?.label}
                    </p>
                  )}
                  {v.results.map((r) => {
                    const pct = total > 0 ? Math.round((Number(r.votes) / total) * 100) : 0;
                    return (
                      <div key={r.option_id}>
                        <div className="flex items-center justify-between text-xs text-foreground">
                          <span className="font-medium">{r.label}</span>
                          <span className="text-muted">
                            {r.votes} · {pct}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <p className="mt-1 text-xs text-muted">{total} voto{total === 1 ? "" : "s"} en total</p>

                  {!v.is_anonymous && v.breakdown && v.breakdown.length > 0 && (
                    <div className="mt-2 border-t border-border pt-2">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted">Quién votó qué</p>
                      {v.breakdown.map((b, idx) => (
                        <p key={idx} className="text-xs text-muted">
                          {b.members?.full_name ?? "—"} ·{" "}
                          {v.vote_options.find((o) => o.id === b.option_id)?.label}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {canManage && v.status === "abierta" && (
                <form
                  className="mt-3"
                  action={async (fd) => {
                    "use server";
                    await closeVote(fd);
                  }}
                >
                  <input type="hidden" name="id" value={v.id} />
                  <SubmitButton
                    pendingLabel="Cerrando..."
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    Cerrar votación
                  </SubmitButton>
                </form>
              )}
            </div>
          );
        })}
        {enriched.length === 0 && (
          <p className="rounded-[18px] border border-border bg-card px-3.5 py-6 text-center text-sm text-muted">
            Todavía no hay votaciones.
          </p>
        )}
      </div>

      {canCreate && (
        <>
          <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">Nueva votación</p>
          <VoteForm />
        </>
      )}
    </div>
  );
}
