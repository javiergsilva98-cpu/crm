import { createClient } from "@/lib/supabase/server";
import { createTask, toggleTask, deleteTask } from "./actions";

export default async function TareasPage() {
  const supabase = await createClient();
  const [{ data: tasks }, { data: companies }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_date, completed, companies(name)")
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("companies").select("id, name").order("name"),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Tareas</h1>

      <form action={createTask} className="mb-8 flex flex-wrap gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <input name="title" placeholder="¿Qué hay que hacer?" required className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm" />
        <input name="due_date" type="date" className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm" />
        <select name="company_id" className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm">
          <option value="">Sin empresa</option>
          {companies?.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">
          Agregar
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {tasks?.map((task) => (
          <div
            key={task.id}
            className={`flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 ${
              task.completed ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <form action={toggleTask}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="completed" value={String(task.completed)} />
                <button type="submit" aria-label="Marcar como completada">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      task.completed
                        ? "border-gray-900 bg-gray-900 dark:border-gray-100 dark:bg-gray-100"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    {task.completed && <span className="text-xs text-white dark:text-gray-900">✓</span>}
                  </span>
                </button>
              </form>
              <div>
                <p className={`text-sm ${task.completed ? "line-through" : ""}`}>{task.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {(task.companies as unknown as { name: string } | null)?.name}
                  {task.due_date && ` · ${new Date(task.due_date + "T00:00:00").toLocaleDateString("es-ES")}`}
                </p>
              </div>
            </div>
            <form action={deleteTask}>
              <input type="hidden" name="id" value={task.id} />
              <button type="submit" className="text-sm text-red-600 hover:underline">
                Eliminar
              </button>
            </form>
          </div>
        ))}
        {tasks?.length === 0 && (
          <p className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-600">
            No hay tareas todavía.
          </p>
        )}
      </div>
    </div>
  );
}
