import { createClient } from "@/lib/supabase/server";
import { saveBusinessSettings } from "./actions";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("business_settings")
    .select("legal_name, tax_id, address, postal_code, city, province, country, email, phone")
    .eq("owner_id", user?.id ?? "")
    .maybeSingle();

  return (
    <div>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-ink">Configuración</h1>
      <p className="mb-8 text-sm text-ink-mute">
        Tus datos fiscales. Los usaremos más adelante para generar tus facturas automáticamente.
      </p>

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
          className="mt-6 w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-calm-hover sm:w-auto"
        >
          Guardar datos fiscales
        </button>
      </form>
    </div>
  );
}
