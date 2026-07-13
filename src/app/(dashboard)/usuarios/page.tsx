import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { updateUserRole } from "./actions";

export default async function UsuariosPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl font-semibold text-ink">Usuarios</h1>
      <p className="mb-6 text-sm text-ink-mute">
        Los administradores ven y gestionan todos los datos. Los usuarios normales solo ven lo que ellos mismos crean.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border bg-raised">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-strong bg-sunken">
            <tr>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Email</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Rol</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-t border-border transition-colors hover:bg-sunken">
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2 capitalize">{u.role}</td>
                <td className="px-4 py-2 text-right">
                  <form action={updateUserRole} className="inline-flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="rounded-md border border-border px-2 py-1 text-sm"
                    >
                      <option value="user">Usuario</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <button type="submit" className="rounded-md border border-border px-3 py-1 text-sm">
                      Guardar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
