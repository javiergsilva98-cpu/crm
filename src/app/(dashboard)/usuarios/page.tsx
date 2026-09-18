import { createClient } from "@/lib/supabase/server";
import { getDemoRole } from "@/lib/demo-context";
import { CLUB_ROLE_LABELS } from "@/lib/demo-role";
import { UserForm } from "./user-form";
import { updateUserAccount, deleteUserAccount } from "./actions";

const USER_MANAGE_ROLES = ["admin", "presidente"];

type ProfileRow = {
  id: string;
  email: string | null;
  role: string;
  member_id: string | null;
  members: { full_name: string } | null;
};

export default async function UsuariosPage() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();

  if (!USER_MANAGE_ROLES.includes(demoRole)) {
    return (
      <p className="text-sm text-muted">
        La gestión de usuarios es cosa de admin y presidencia. Cambia de rol arriba a la derecha
        para verla.
      </p>
    );
  }

  const [{ data: profilesData }, { data: membersData }] = await Promise.all([
    supabase.from("profiles").select("id, email, role, member_id, members(full_name)").order("email"),
    supabase.from("members").select("id, full_name").eq("status", "activo").order("full_name"),
  ]);

  const profiles = (profilesData ?? []) as unknown as ProfileRow[];
  const members = membersData ?? [];

  return (
    <div>
      <h1 className="mb-1 text-xl font-extrabold tracking-tight text-foreground">Usuarios</h1>
      <p className="mb-5 text-sm text-muted">
        El registro libre está desactivado: las cuentas se crean solo desde aquí.
      </p>

      <div className="mb-7 overflow-hidden rounded-[18px] border border-border bg-card">
        {profiles.map((p, idx) => (
          <form
            key={p.id}
            action={async (fd) => {
              "use server";
              await updateUserAccount(fd);
            }}
            className={`flex flex-wrap items-center gap-2.5 px-3.5 py-3 ${
              idx !== profiles.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <input type="hidden" name="id" value={p.id} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{p.email ?? "—"}</p>
              <p className="text-xs text-muted">{p.members?.full_name ?? "Sin vincular a socio"}</p>
            </div>
            <select
              name="role"
              defaultValue={p.role}
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-accent"
            >
              {Object.entries(CLUB_ROLE_LABELS).map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
            </select>
            <select
              name="member_id"
              defaultValue={p.member_id ?? ""}
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-accent"
            >
              <option value="">Sin vincular</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground"
            >
              Guardar
            </button>
            <button
              type="submit"
              formAction={async (fd) => {
                "use server";
                await deleteUserAccount(fd);
              }}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-warning transition-colors hover:bg-warning-soft"
            >
              Eliminar
            </button>
          </form>
        ))}
        {profiles.length === 0 && (
          <p className="px-3.5 py-6 text-center text-sm text-muted">Todavía no hay cuentas.</p>
        )}
      </div>

      <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Crear usuario</p>
      <UserForm members={members} />
    </div>
  );
}
