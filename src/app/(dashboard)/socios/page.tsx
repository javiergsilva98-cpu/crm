import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { CLUB_ROLE_LABELS, type ClubRole } from "@/lib/demo-role";
import { ExportLink } from "@/components/export-link";
import { SubmitButton } from "@/components/submit-button";
import { MemberForm } from "./member-form";
import { toggleMemberStatus } from "./actions";
import {
  MEMBER_MANAGE_ROLES,
  ACCOUNT_MANAGE_ROLES as ACCOUNT_CREATE_ROLES,
  EXPORT_ROLES,
} from "@/lib/permissions";

function nextKeyNumber(members: { key_number: string | null }[]): string {
  const numeric = members
    .map((m) => m.key_number)
    .filter((k): k is string => !!k && /^\d+$/.test(k))
    .map(Number);
  const next = numeric.length > 0 ? Math.max(...numeric) + 1 : 1;
  return String(next).padStart(2, "0");
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function SociosPage() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();

  if (demoRole === "bodeguero") {
    return (
      <p className="text-sm text-muted">
        La ficha de socios no forma parte del rol de bodeguero en esta demo. Cambia a Presidente,
        Secretario o Tesorero arriba a la derecha para verla.
      </p>
    );
  }

  const now = new Date();
  const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const [{ data: members }, { data: cuotas }] = await Promise.all([
    supabase.from("members").select("id, full_name, club_role, status, key_number, joined_at").order("full_name"),
    supabase
      .from("treasury_movements")
      .select("member_id")
      .eq("movement_type", "cuota")
      .gte("movement_date", currentMonthStart),
  ]);

  const paidIds = new Set((cuotas ?? []).map((c) => c.member_id));
  const rows = (members ?? []).map((m) => ({ ...m, cuotaAlDia: paidIds.has(m.id) }));

  // Secretario (Fase 10: rol pendiente de definir del todo) se trata
  // como un socio normal en esta pantalla — solo ve su propia ficha.
  if (demoRole === "socio" || demoRole === "secretario") {
    const cookieId = await getDemoMemberIdCookie();
    const me = rows.find((m) => m.id === cookieId) ?? rows.filter((m) => m.club_role === "socio")[0];

    return (
      <div>
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Mi ficha</h1>
          <Link href="/perfil" className="text-xs font-semibold text-accent hover:underline">
            Editar perfil →
          </Link>
        </div>
        {me ? (
          <div className="rounded-[18px] border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-lg font-extrabold text-accent">
                {initials(me.full_name)}
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{me.full_name}</p>
                <p className="text-sm text-muted">{CLUB_ROLE_LABELS[me.club_role as ClubRole]}</p>
              </div>
            </div>
            <div className="mt-5 divide-y divide-border border-t border-border">
              <Field label="Estado" value={<span className="capitalize">{me.status}</span>} />
              <Field label="Nº de llave" value={me.key_number ?? "—"} />
              <Field
                label="Cuota"
                value={
                  <span className={me.cuotaAlDia ? "text-success" : "text-warning"}>
                    {me.cuotaAlDia ? "Al día" : "Pendiente"}
                  </span>
                }
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">No hay socios de ejemplo todavía.</p>
        )}
      </div>
    );
  }

  const canManage = MEMBER_MANAGE_ROLES.includes(demoRole);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Socios</h1>
        {EXPORT_ROLES.includes(demoRole) && <ExportLink href="/api/export/socios" label="Exportar" />}
      </div>
      <div className="mb-7 overflow-hidden rounded-[18px] border border-border bg-card">
        {rows.map((m, idx) => (
          <div
            key={m.id}
            className={`flex items-center gap-3 px-3.5 py-3 ${idx !== rows.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-xl bg-accent-soft text-xs font-extrabold text-accent">
              {initials(m.full_name)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{m.full_name}</p>
              <p className="text-xs capitalize text-muted">
                {CLUB_ROLE_LABELS[m.club_role as ClubRole]} · {m.status}
                {m.key_number ? ` · llave ${m.key_number}` : ""}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                m.cuotaAlDia ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
              }`}
            >
              {m.cuotaAlDia ? "Al día" : "Pendiente"}
            </span>
            {canManage && (
              <form
                action={async (fd) => {
                  "use server";
                  await toggleMemberStatus(fd);
                }}
              >
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="next_status" value={m.status === "activo" ? "baja" : "activo"} />
                <SubmitButton
                  pendingLabel="..."
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground disabled:opacity-50"
                >
                  {m.status === "activo" ? "Dar de baja" : "Reactivar"}
                </SubmitButton>
              </form>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <p className="px-3.5 py-6 text-center text-sm text-muted">No hay socios de ejemplo todavía.</p>
        )}
      </div>

      {ACCOUNT_CREATE_ROLES.includes(demoRole) && (
        <>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Dar de alta un socio</p>
          <MemberForm suggestedKeyNumber={nextKeyNumber(rows)} />
        </>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
