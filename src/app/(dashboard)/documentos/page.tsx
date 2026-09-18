import { createClient } from "@/lib/supabase/server";
import { getDemoRole } from "@/lib/demo-context";
import { DocumentForm } from "./document-form";
import { DocumentRow } from "./document-row";

const DOCUMENT_ROLES = ["admin", "presidente", "secretario"];

export default async function DocumentosPage() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();

  if (!DOCUMENT_ROLES.includes(demoRole)) {
    return (
      <p className="text-sm text-muted">
        La documentación del club es cosa de admin, presidencia y secretaría. Cambia de rol arriba
        a la derecha para verla.
      </p>
    );
  }

  const { data: documentsData } = await supabase
    .from("documents")
    .select("id, name, doc_type, reference_url")
    .order("created_at", { ascending: false });

  const documents = documentsData ?? [];

  return (
    <div>
      <h1 className="mb-1 text-xl font-extrabold tracking-tight text-foreground">Documentación</h1>
      <p className="mb-5 text-sm text-muted">
        Estatutos, actas y normativa del club. Cada documento puede enlazar a su carpeta o archivo
        en el Drive del club (se vinculará más adelante).
      </p>

      <div className="mb-7 overflow-hidden rounded-[18px] border border-border bg-card">
        {documents.map((doc, idx) => (
          <DocumentRow key={doc.id} doc={doc} isLast={idx === documents.length - 1} canManage />
        ))}
        {documents.length === 0 && (
          <p className="px-3.5 py-6 text-center text-sm text-muted">
            Todavía no hay documentos. Aquí se irán enlazando estatutos, actas y normativa del
            Drive del club.
          </p>
        )}
      </div>

      <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Añadir documento</p>
      <DocumentForm />
    </div>
  );
}
