import { createClient } from "@/lib/supabase/server";
import { getDemoRole } from "@/lib/demo-context";
import { DocumentForm } from "./document-form";
import { DocumentRow } from "./document-row";

// Gestión de la carpeta "general": admin, presidencia, vicepresidencia
// y secretaría, como hasta ahora. La carpeta "privada" (Fase 9) es solo
// de los roles con acceso a dinero.
const GENERAL_MANAGE_ROLES = ["admin", "presidente", "vicepresidente", "secretario"];
const PRIVATE_ROLES = ["admin", "presidente", "tesorero"];

export default async function DocumentosPage() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();
  const canManageGeneral = GENERAL_MANAGE_ROLES.includes(demoRole);
  const canUsePrivate = PRIVATE_ROLES.includes(demoRole);

  const { data: documentsData } = await supabase
    .from("documents")
    .select("id, name, doc_type, reference_url, folder")
    .order("created_at", { ascending: false });

  const documents = documentsData ?? [];
  const general = documents.filter((d) => d.folder === "general");
  const privados = documents.filter((d) => d.folder === "privado");

  return (
    <div>
      <h1 className="mb-1 text-xl font-extrabold tracking-tight text-foreground">Documentación</h1>
      <p className="mb-5 text-sm text-muted">
        Estatutos, actas y normativa del club. Cada documento puede enlazar a su carpeta o archivo
        en el Drive del club.
      </p>

      <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">General (todo el club)</p>
      <div className="mb-7 overflow-hidden rounded-[18px] border border-border bg-card">
        {general.map((doc, idx) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            isLast={idx === general.length - 1}
            canManage={canManageGeneral}
            canUsePrivate={canUsePrivate}
          />
        ))}
        {general.length === 0 && (
          <p className="px-3.5 py-6 text-center text-sm text-muted">
            Todavía no hay documentos generales.
          </p>
        )}
      </div>

      {canUsePrivate && (
        <>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">
            Privada (admin, presidencia, tesorería)
          </p>
          <div className="mb-7 overflow-hidden rounded-[18px] border border-border bg-card">
            {privados.map((doc, idx) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                isLast={idx === privados.length - 1}
                canManage={canUsePrivate}
                canUsePrivate={canUsePrivate}
              />
            ))}
            {privados.length === 0 && (
              <p className="px-3.5 py-6 text-center text-sm text-muted">
                Todavía no hay documentos en la carpeta privada.
              </p>
            )}
          </div>
        </>
      )}

      {(canManageGeneral || canUsePrivate) && (
        <>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Añadir documento</p>
          <DocumentForm canUsePrivate={canUsePrivate} />
        </>
      )}
    </div>
  );
}
