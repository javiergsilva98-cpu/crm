import { createClient } from "@/lib/supabase/server";
import { createContact, deleteContact } from "./actions";

export default async function ContactosPage() {
  const supabase = await createClient();
  const [{ data: contacts }, { data: companies }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, full_name, email, phone, companies(name)")
      .order("created_at", { ascending: false }),
    supabase.from("companies").select("id, name").order("name"),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Contactos</h1>

      <form action={createContact} className="mb-8 flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <input name="full_name" placeholder="Nombre completo" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="Email" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input name="phone" placeholder="Teléfono" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <select name="company_id" className="rounded-md border border-gray-300 px-3 py-2 text-sm">
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

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2">Empresa</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {contacts?.map((contact) => (
              <tr key={contact.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{contact.full_name}</td>
                <td className="px-4 py-2">{contact.email}</td>
                <td className="px-4 py-2">{contact.phone}</td>
                <td className="px-4 py-2">{(contact.companies as unknown as { name: string } | null)?.name}</td>
                <td className="px-4 py-2 text-right">
                  <form action={deleteContact}>
                    <input type="hidden" name="id" value={contact.id} />
                    <button type="submit" className="text-red-600 hover:underline">
                      Eliminar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {contacts?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No hay contactos todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
