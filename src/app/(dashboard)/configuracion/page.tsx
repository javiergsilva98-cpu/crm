import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { saveBusinessSettings } from "./actions";
import { updateUserRole, createInvite, deleteInvite } from "./users-actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { InviteLink } from "./invite-link";
import { MarketingSection } from "./marketing-section";
import { ServicesSection } from "./services-section";
import { HelpButton } from "@/components/help-button";

const SECTIONS = [
  { key: "empresa", label: "Datos de la empresa" },
  { key: "servicios", label: "Servicios" },
  { key: "usuarios", label: "Usuarios" },
  { key: "marketing", label: "Marketing" },
] as const;

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";
  const activeTab =
    tab === "servicios" ? "servicios" : (tab === "usuarios" || tab === "marketing") && isAdmin ? tab : "empresa";

  const { data: settings } = await supabase
    .from("business_settings")
    .select("legal_name, tax_id, address, postal_code, city, province, country, email, phone")
    .eq("owner_id", user?.id ?? "")
    .maybeSingle();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, unit_price, tax_rate")
    .eq("owner_id", user?.id ?? "")
    .order("name");

  const [{ data: users }, { data: invites }, { data: integrations }] = isAdmin
    ? await Promise.all([
        supabase.from("profiles").select("id, email, role, created_at").order("created_at", { ascending: true }),
        supabase
          .from("invites")
          .select("id, role, email, sent_at, created_at")
          .is("used_by", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("marketing_integrations")
          .select("provider, connected_at, last_synced_at, last_sync_error")
          .eq("owner_id", user?.id ?? ""),
      ])
    : [{ data: null }, { data: null }, { data: null }];

  return (
    <div>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-ink">Configuración</h1>
      <p className="mb-8 text-sm text-ink-mute">Tus datos fiscales y quién tiene acceso al CRM.</p>

      <div className="flex flex-col gap-8 md:flex-row">
        <div className="relative md:w-48 md:flex-none">
        <nav className="flex gap-1 overflow-x-auto md:w-48 md:flex-none md:flex-col md:gap-0.5">
          {SECTIONS.filter((s) => s.key === "empresa" || s.key === "servicios" || isAdmin).map((section) => (
            <Link
              key={section.key}
              href={`/configuracion?tab=${section.key}`}
              className={`shrink-0 rounded-md px-3 py-2 text-sm transition-colors ${
                activeTab === section.key
                  ? "bg-sunken font-medium text-ink"
                  : "text-ink-soft hover:bg-sunken hover:text-ink"
              }`}
            >
              {section.label}
            </Link>
          ))}
        </nav>
        {SECTIONS.filter((s) => s.key === "empresa" || s.key === "servicios" || isAdmin).length > 1 && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 right-0 h-full w-8 md:hidden"
            style={{ background: "linear-gradient(to right, transparent, var(--bg-base))" }}
          />
        )}
        </div>

        <div className="min-w-0 flex-1">
          {activeTab === "empresa" && (
            <>
              <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Datos fiscales</h2>
              <p className="mb-3 text-sm text-ink-mute">Los usaremos más adelante para generar tus facturas automáticamente.</p>

              <form action={saveBusinessSettings} className="max-w-2xl rounded-lg border border-border bg-raised p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-ink-soft">Razón social / Nombre</label>
            <input
              name="legal_name"
              defaultValue={settings?.legal_name ?? ""}
              placeholder="Ej. Javier García Silva o Mi Empresa S.L."
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-soft">NIF / CIF</label>
            <input
              name="tax_id"
              defaultValue={settings?.tax_id ?? ""}
              placeholder="12345678A"
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-soft">Email de facturación</label>
            <input
              name="email"
              type="email"
              defaultValue={settings?.email ?? ""}
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-ink-soft">Dirección fiscal</label>
            <input
              name="address"
              defaultValue={settings?.address ?? ""}
              placeholder="Calle y número"
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-soft">Código postal</label>
            <input
              name="postal_code"
              defaultValue={settings?.postal_code ?? ""}
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-soft">Ciudad</label>
            <input
              name="city"
              defaultValue={settings?.city ?? ""}
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-soft">Provincia</label>
            <input
              name="province"
              defaultValue={settings?.province ?? ""}
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-soft">País</label>
            <input
              name="country"
              defaultValue={settings?.country ?? "España"}
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-soft">Teléfono</label>
            <input
              name="phone"
              defaultValue={settings?.phone ?? ""}
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-6 w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover sm:w-auto"
        >
          Guardar datos fiscales
        </button>
              </form>
            </>
          )}

          {activeTab === "usuarios" && isAdmin && (
            <>
              <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-ink">
                Usuarios
                <HelpButton slug="invitar-usuarios" label="Invitar usuarios" />
              </h2>
              <p className="mb-3 text-sm text-ink-mute">
                Los administradores ven y gestionan todos los datos. Los usuarios normales solo ven lo que ellos mismos crean.
              </p>

              <div className="mb-6 overflow-x-auto rounded-lg border border-border bg-raised">
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

              <h3 className="mb-2 text-sm font-semibold text-ink">Agregar nuevo usuario</h3>
              <p className="mb-3 text-sm text-ink-mute">
                Genera un enlace de invitación para compartirlo tú mismo, o escribe un email para que reciba la invitación directamente.
              </p>
              <form action={createInvite} className="mb-2 flex flex-col gap-3 rounded-lg border border-border bg-raised p-4 sm:flex-row sm:items-center">
                <select name="role" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto">
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
                <input
                  name="email"
                  type="email"
                  placeholder="Email (opcional, para enviar por correo)"
                  className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:flex-1"
                />
                <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover sm:w-auto">
                  Crear invitación
                </button>
              </form>
              <p className="mb-6 text-xs text-ink-mute">
                Si dejas el email en blanco, se generará solo el enlace para copiar y enviar tú mismo.
              </p>

              {invites && invites.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-border bg-raised">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border-strong bg-sunken">
                      <tr>
                        <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Rol</th>
                        <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Email</th>
                        <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Estado</th>
                        <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Creada</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map((invite) => (
                        <tr key={invite.id} className="border-t border-border transition-colors hover:bg-sunken">
                          <td className="px-4 py-2 capitalize">{invite.role}</td>
                          <td className="px-4 py-2 text-ink-soft">{invite.email ?? "—"}</td>
                          <td className="px-4 py-2 text-ink-mute">
                            {invite.email ? (invite.sent_at ? "Enviada por email" : "Pendiente de envío") : "Solo enlace"}
                          </td>
                          <td className="px-4 py-2 text-ink-mute">
                            {new Date(invite.created_at).toLocaleDateString("es-ES")}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex justify-end gap-2">
                              <InviteLink id={invite.id} />
                              <form action={deleteInvite}>
                                <input type="hidden" name="id" value={invite.id} />
                                <ConfirmSubmitButton
                                  confirmMessage="¿Revocar esta invitación? El enlace dejará de funcionar."
                                  className="rounded-md border border-border px-3 py-1 text-sm text-danger transition-colors hover:border-danger"
                                >
                                  Revocar
                                </ConfirmSubmitButton>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === "servicios" && <ServicesSection services={services ?? []} />}

          {activeTab === "marketing" && isAdmin && <MarketingSection integrations={integrations ?? []} />}
        </div>
      </div>
    </div>
  );
}
