import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { CLUB_ROLE_LABELS, type ClubRole } from "@/lib/demo-role";
import { MemberSwitcher } from "@/components/member-switcher";

export default async function SociosPage() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();

  if (demoRole === "bodeguero") {
    return (
      <p className="text-sm text-gray-500">
        La ficha de socios no forma parte del rol de bodeguero en esta demo. Cambia a Presidente,
        Secretario o Tesorero arriba a la derecha para verla.
      </p>
    );
  }

  const [{ data: members }, { data: cuotas }] = await Promise.all([
    supabase.from("members").select("id, full_name, club_role, status, key_number, joined_at").order("full_name"),
    supabase.from("treasury_movements").select("member_id").eq("movement_type", "cuota"),
  ]);

  const paidIds = new Set((cuotas ?? []).map((c) => c.member_id));
  const rows = (members ?? []).map((m) => ({ ...m, cuotaAlDia: paidIds.has(m.id) }));

  if (demoRole === "socio") {
    const socios = rows.filter((m) => m.club_role === "socio");
    const cookieId = await getDemoMemberIdCookie();
    const currentId = socios.find((m) => m.id === cookieId)?.id ?? socios[0]?.id;
    const me = rows.find((m) => m.id === currentId);

    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Mi ficha</h1>
          <MemberSwitcher members={socios} current={currentId ?? ""} />
        </div>
        {me ? (
          <dl className="max-w-sm space-y-3 rounded-lg border border-gray-200 bg-white p-6">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">Nombre</dt>
              <dd className="text-sm text-gray-900">{me.full_name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">Rol</dt>
              <dd className="text-sm text-gray-900">{CLUB_ROLE_LABELS[me.club_role as ClubRole]}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">Estado</dt>
              <dd className="text-sm text-gray-900 capitalize">{me.status}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">Nº de llave</dt>
              <dd className="text-sm text-gray-900">{me.key_number ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">Cuota</dt>
              <dd className={`text-sm font-medium ${me.cuotaAlDia ? "text-green-700" : "text-amber-700"}`}>
                {me.cuotaAlDia ? "Al día" : "Pendiente"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-gray-500">No hay socios de ejemplo todavía.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Socios</h1>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Llave</th>
              <th className="px-4 py-3">Alta</th>
              <th className="px-4 py-3">Cuota</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-medium text-gray-900">{m.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{CLUB_ROLE_LABELS[m.club_role as ClubRole]}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{m.status}</td>
                <td className="px-4 py-3 text-gray-600">{m.key_number ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{m.joined_at}</td>
                <td className={`px-4 py-3 font-medium ${m.cuotaAlDia ? "text-green-700" : "text-amber-700"}`}>
                  {m.cuotaAlDia ? "Al día" : "Pendiente"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No hay socios de ejemplo todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
