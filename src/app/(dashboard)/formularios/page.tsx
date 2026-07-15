import Link from "next/link";
import { HelpButton } from "@/components/help-button";
import { createClient } from "@/lib/supabase/server";
import { createForm, deleteForm } from "./actions";
import { AddDisclosure } from "@/components/add-disclosure";

export default async function FormulariosPage() {
  const supabase = await createClient();
  const { data: forms } = await supabase
    .from("forms")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-1 flex items-center gap-2 font-heading text-3xl font-semibold text-ink">
        Formularios
        <HelpButton slug="formularios-embed" label="Formularios" />
      </h1>
      <p className="mb-8 text-sm text-ink-mute">
        Crea formularios para tu web que den de alta contactos automáticamente en el CRM.
      </p>

      <AddDisclosure label="Crear formulario">
        <form action={createForm} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            name="name"
            placeholder="Nombre del formulario (ej. Contacto web)"
            required
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto sm:flex-1"
          />
          <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover sm:w-auto">
            Crear
          </button>
        </form>
      </AddDisclosure>

      {forms?.length === 0 && (
        <div className="rounded-lg border border-border bg-raised p-6 text-center">
          <p className="font-heading text-base text-ink">Todavía no tienes formularios</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-mute">Crea el primero arriba.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {forms?.map((form) => (
          <div key={form.id} className="flex items-center justify-between rounded-lg border border-border bg-raised p-4">
            <Link href={`/formularios/${form.id}`} className="text-sm font-medium text-ink hover:underline">
              {form.name}
            </Link>
            <form action={deleteForm}>
              <input type="hidden" name="id" value={form.id} />
              <button type="submit" className="text-sm text-danger hover:underline">
                Eliminar
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
