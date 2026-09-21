import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { CountForm } from "./count-form";

const COUNT_ROLES = ["admin", "presidente", "vicepresidente", "bodeguero"];

export default async function InventoryCountPage() {
  const supabase = await createClient();
  const demoRole = await getDemoRole();

  if (!COUNT_ROLES.includes(demoRole)) {
    return (
      <p className="text-sm text-muted">
        El conteo físico no forma parte de tu rol en esta demo. Cambia a Presidente o Bodeguero
        arriba a la derecha para verlo.
      </p>
    );
  }

  const [{ data: itemsData }, { data: membersData }, { data: lastCountsData }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, unit, current_stock")
      .order("name"),
    supabase.from("members").select("id, full_name").eq("status", "activo").order("full_name"),
    supabase
      .from("inventory_counts")
      .select("id, counted_at, notes, members(full_name), inventory_count_lines(id, expected_stock, actual_stock, inventory_items(name, unit))")
      .order("counted_at", { ascending: false })
      .limit(3),
  ]);

  const items = itemsData ?? [];
  const members = membersData ?? [];
  const lastCounts = (lastCountsData ?? []) as unknown as Array<{
    id: string;
    counted_at: string;
    notes: string | null;
    members: { full_name: string } | null;
    inventory_count_lines: Array<{
      id: string;
      expected_stock: number;
      actual_stock: number;
      inventory_items: { name: string; unit: string } | null;
    }>;
  }>;

  const cookieId = await getDemoMemberIdCookie();
  const defaultMemberId = members.find((m) => m.id === cookieId)?.id ?? members[0]?.id ?? "";

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Conteo físico</h1>
          <p className="mt-0.5 text-sm text-muted">
            Introduce lo que hay de verdad en cada artículo. Al guardar, se compara con el stock
            teórico y el stock queda ajustado a lo contado.
          </p>
        </div>
        <Link href="/inventario" className="text-xs font-semibold text-accent">
          ← Inventario
        </Link>
      </div>

      <CountForm items={items} members={members} defaultMemberId={defaultMemberId} />

      {lastCounts.length > 0 && (
        <>
          <p className="mb-2.5 mt-7 text-xs font-bold uppercase tracking-wide text-muted">Últimos conteos</p>
          <div className="flex flex-col gap-3">
            {lastCounts.map((c) => (
              <div key={c.id} className="overflow-hidden rounded-[18px] border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
                  <p className="text-xs font-semibold text-foreground">
                    {new Date(c.counted_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                    {c.members?.full_name && <span className="font-normal text-muted"> · {c.members.full_name}</span>}
                  </p>
                </div>
                {c.inventory_count_lines.map((l) => {
                  const diff = l.actual_stock - l.expected_stock;
                  return (
                    <div key={l.id} className="flex items-center justify-between px-3.5 py-2 text-sm">
                      <span className="text-foreground">{l.inventory_items?.name ?? "—"}</span>
                      <span className="text-muted">
                        {l.expected_stock} → {l.actual_stock} {l.inventory_items?.unit}{" "}
                        {diff !== 0 && (
                          <span className={diff < 0 ? "font-bold text-warning" : "font-bold text-success"}>
                            ({diff > 0 ? "+" : ""}
                            {diff})
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
