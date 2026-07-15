import { createClient } from "@/lib/supabase/server";
import { createTask, toggleTask, deleteTask } from "./actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AddDisclosure } from "@/components/add-disclosure";

export default async function TareasPage() {
  const supabase = await createClient();
  const [{ data: tasks, error: tasksError }, { data: companies }, { data: opportunities }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_date, completed, companies!company_id(name), opportunities!opportunity_id(title)")
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("companies").select("id, name").order("name"),
    supabase.from("opportunities").select("id, title").order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-ink">Tareas</h1>
      <p className="mb-8 text-sm text-ink-mute">Lo que tienes pendiente con tus clientes.</p>

      <AddDisclosure label="Agregar tarea">
        <form action={createTask} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input name="title" placeholder="¿Qué hay que hacer?" required className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
          <input name="due_date" type="date" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
          <select name="company_id" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto">
            <option value="">Sin empresa</option>
            {companies?.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <select name="opportunity_id" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto">
            <option value="">Sin oportunidad</option>
            {opportunities?.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.title}
              </option>
            ))}
          </select>
          <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover sm:w-auto">
            Agregar
          </button>
        </form>
      </AddDisclosure>

      {tasksError && (
        <div className="mb-6 rounded-lg border border-danger bg-raised p-4 text-sm text-danger">
          Error al cargar las tareas: {tasksError.message}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {tasks?.map((task) => (
          <div
            key={task.id}
            className={`flex items-center justify-between rounded-lg border border-border bg-raised px-4 py-3 ${
              task.completed ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <form action={toggleTask}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="completed" value={String(task.completed)} />
                <button type="submit" aria-label="Marcar como completada">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      task.completed ? "border-success bg-success" : "border-border-strong"
                    }`}
                  >
                    {task.completed && <span className="text-xs text-base">✓</span>}
                  </span>
                </button>
              </form>
              <div>
                <p className={`text-sm text-ink ${task.completed ? "line-through" : ""}`}>{task.title}</p>
                <p className="text-xs text-ink-mute">
                  {[
                    (task.companies as unknown as { name: string } | null)?.name,
                    (task.opportunities as unknown as { title: string } | null)?.title,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  {task.due_date && ` · ${new Date(task.due_date + "T00:00:00").toLocaleDateString("es-ES")}`}
                </p>
              </div>
            </div>
            <form action={deleteTask}>
              <input type="hidden" name="id" value={task.id} />
              <ConfirmSubmitButton confirmMessage={`¿Eliminar la tarea "${task.title}"?`} className="text-sm text-danger hover:underline">
                Eliminar
              </ConfirmSubmitButton>
            </form>
          </div>
        ))}
        {tasks?.length === 0 && (
          <div className="rounded-lg border border-border bg-raised px-4 py-12 text-center">
            <p className="font-heading text-base text-ink">Nada pendiente por ahora</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-mute">
              Añade tu primera tarea con el botón + de arriba — una llamada, un presupuesto por enviar — y aparecerá aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
