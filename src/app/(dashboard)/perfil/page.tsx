import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CLUB_ROLE_LABELS, isClubRole } from "@/lib/demo-role";
import { ProfileForm } from "./profile-form";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, member_id")
    .eq("id", user.id)
    .single();

  const { data: member } = profile?.member_id
    ? await supabase
        .from("members")
        .select("full_name, avatar_url, club_role, key_number, status")
        .eq("id", profile.member_id)
        .single()
    : { data: null };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Mi perfil</h1>
        <p className="text-sm text-muted">Actualiza tu nombre y tu foto</p>
      </div>

      <ProfileForm
        userId={user.id}
        fullName={member?.full_name ?? profile?.email?.split("@")[0] ?? ""}
        avatarUrl={member?.avatar_url ?? null}
      />

      <div className="mt-4 overflow-hidden rounded-[18px] border border-border bg-card">
        <ProfileRow label="Correo" value={profile?.email ?? user.email ?? "—"} />
        {member && (
          <>
            <ProfileRow
              label="Rol en el club"
              value={isClubRole(member.club_role) ? CLUB_ROLE_LABELS[member.club_role] : member.club_role}
            />
            <ProfileRow label="Número de socio" value={member.key_number ?? "—"} />
            <ProfileRow label="Estado" value={member.status === "activo" ? "Activo" : "Baja"} isLast />
          </>
        )}
      </div>
      {!member && (
        <p className="mt-3 text-xs text-muted">
          Tu cuenta todavía no está vinculada a una ficha de socio.
        </p>
      )}
    </div>
  );
}

function ProfileRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3.5 py-3 ${isLast ? "" : "border-b border-border"}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
