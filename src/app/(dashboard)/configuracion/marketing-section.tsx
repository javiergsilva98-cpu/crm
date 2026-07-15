import { PROVIDERS } from "@/lib/marketing-providers";
import { saveIntegration, disconnectIntegration, syncIntegration } from "./marketing-actions";
import { HelpButton } from "@/components/help-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

type Integration = {
  provider: string;
  connected_at: string | null;
  last_synced_at: string | null;
  last_sync_error: string | null;
};

export function MarketingSection({ integrations }: { integrations: Integration[] }) {
  return (
    <>
      <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Marketing</h2>
      <p className="mb-6 text-sm text-ink-mute">
        Conecta tus cuentas de Meta Ads y Google Ads para que la inversión por canal en{" "}
        <span className="font-medium text-ink">Canales</span> se rellene sola cada vez que sincronices, en vez de
        introducirla a mano.
      </p>

      <div className="flex flex-col gap-4">
        {PROVIDERS.map((config) => {
          const integration = integrations.find((i) => i.provider === config.key) ?? null;

          return (
            <div key={config.key} className="rounded-lg border border-border bg-raised p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {config.label}
                    <HelpButton slug={config.helpSlug} label={config.label} />
                  </h3>
                  {integration ? (
                    <p className="text-xs text-ink-mute">
                      Conectado
                      {integration.connected_at && ` desde ${new Date(integration.connected_at).toLocaleDateString("es-ES")}`}
                      {integration.last_synced_at &&
                        ` · última sincronización ${new Date(integration.last_synced_at).toLocaleString("es-ES")}`}
                    </p>
                  ) : (
                    <p className="text-xs text-ink-mute">Sin conectar</p>
                  )}
                  {integration?.last_sync_error && (
                    <p className="mt-1 text-xs text-danger">Error al sincronizar: {integration.last_sync_error}</p>
                  )}
                </div>
                {integration && (
                  <div className="flex items-center gap-3">
                    <form action={syncIntegration}>
                      <input type="hidden" name="provider" value={config.key} />
                      <button type="submit" className="rounded-md border border-border px-3 py-1 text-sm text-ink-soft transition-colors hover:border-border-strong hover:text-ink">
                        Sincronizar ahora
                      </button>
                    </form>
                    <form action={disconnectIntegration}>
                      <input type="hidden" name="provider" value={config.key} />
                      <ConfirmSubmitButton
                        confirmMessage={`¿Desconectar ${config.label}? Tendrás que volver a introducir las credenciales para reconectarlo.`}
                        className="text-sm text-danger hover:underline"
                      >
                        Desconectar
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                )}
              </div>

              <form action={saveIntegration} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input type="hidden" name="provider" value={config.key} />
                {config.fields.map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-xs text-ink-soft">{field.label}</label>
                    <input
                      name={field.key}
                      type="password"
                      placeholder={integration ? "•••••••• (déjalo en blanco para no cambiarlo)" : field.placeholder}
                      autoComplete="off"
                      className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <button type="submit" className="rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover">
                    {integration ? "Guardar cambios" : "Conectar"}
                  </button>
                </div>
              </form>
            </div>
          );
        })}
      </div>
    </>
  );
}
