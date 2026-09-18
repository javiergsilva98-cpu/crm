// Selector de rol para la demo: cambia qué secciones se muestran, no
// vuelve a autenticar. El usuario demo real (Supabase Auth) siempre
// tiene el rol 'presidente' en la base de datos, así que el RLS deja
// pasar cualquier lectura sin importar el rol elegido aquí.

export const CLUB_ROLES = ["admin", "presidente", "secretario", "tesorero", "bodeguero", "socio"] as const;
export type ClubRole = (typeof CLUB_ROLES)[number];

export const CLUB_ROLE_LABELS: Record<ClubRole, string> = {
  admin: "Admin",
  presidente: "Presidente",
  secretario: "Secretario",
  tesorero: "Tesorero",
  bodeguero: "Bodeguero",
  socio: "Socio",
};

export const DEMO_ROLE_COOKIE = "demo_role";
export const DEMO_MEMBER_COOKIE = "demo_member_id";
export const DEFAULT_DEMO_ROLE: ClubRole = "presidente";

export function isClubRole(value: string | undefined): value is ClubRole {
  return !!value && (CLUB_ROLES as readonly string[]).includes(value);
}

export const NAV_BY_ROLE: Record<ClubRole, { href: string; label: string }[]> = {
  admin: [
    { href: "/socios", label: "Socios" },
    { href: "/consumos", label: "Consumiciones" },
    { href: "/tesoreria", label: "Tesorería" },
    { href: "/inventario", label: "Inventario" },
    { href: "/calendario", label: "Calendario" },
    { href: "/votaciones", label: "Votaciones" },
    { href: "/documentos", label: "Documentación" },
    { href: "/usuarios", label: "Usuarios" },
    { href: "/auditoria", label: "Auditoría" },
  ],
  presidente: [
    { href: "/socios", label: "Socios" },
    { href: "/consumos", label: "Consumiciones" },
    { href: "/tesoreria", label: "Tesorería" },
    { href: "/inventario", label: "Inventario" },
    { href: "/calendario", label: "Calendario" },
    { href: "/votaciones", label: "Votaciones" },
    { href: "/documentos", label: "Documentación" },
    { href: "/usuarios", label: "Usuarios" },
    { href: "/auditoria", label: "Auditoría" },
  ],
  secretario: [
    { href: "/socios", label: "Socios" },
    { href: "/calendario", label: "Calendario" },
    { href: "/votaciones", label: "Votaciones" },
    { href: "/documentos", label: "Documentación" },
  ],
  tesorero: [
    { href: "/socios", label: "Socios" },
    { href: "/tesoreria", label: "Tesorería" },
    { href: "/calendario", label: "Calendario" },
    { href: "/votaciones", label: "Votaciones" },
    { href: "/auditoria", label: "Auditoría" },
  ],
  bodeguero: [
    { href: "/inventario", label: "Inventario" },
    { href: "/calendario", label: "Calendario" },
    { href: "/votaciones", label: "Votaciones" },
  ],
  socio: [
    { href: "/consumos", label: "Consumiciones" },
    { href: "/tesoreria", label: "Tesorería" },
    { href: "/calendario", label: "Calendario" },
    { href: "/votaciones", label: "Votaciones" },
  ],
};
