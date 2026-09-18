const TABLE_LABELS: Record<string, string> = {
  members: "Socios",
  treasury_movements: "Tesorería",
  inventory_items: "Inventario",
  inventory_restocks: "Reposición",
  consumptions: "Consumo",
  menu_items: "Carta",
  profiles: "Cuentas",
};

const ACTION_LABELS: Record<string, string> = {
  insert: "Alta",
  update: "Modificación",
  delete: "Baja",
};

// Campos que suelen identificar bien la fila afectada, en orden de
// preferencia — se usa el primero que aparezca en new_data (o old_data
// si se borró) para armar una línea legible sin tener que escribir una
// plantilla a mano por cada tabla.
const LABEL_FIELDS = [
  "full_name",
  "name",
  "email",
  "question",
  "description",
  "movement_type",
  "action",
];

export type AuditRow = {
  id: string;
  table_name: string;
  action: string;
  actor_email: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
};

export function tableLabel(tableName: string): string {
  return TABLE_LABELS[tableName] ?? tableName;
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function summaryLine(row: AuditRow): string {
  const data = row.new_data ?? row.old_data;
  if (!data) return tableLabel(row.table_name);

  const parts: string[] = [];
  for (const field of LABEL_FIELDS) {
    const value = data[field];
    if (value !== undefined && value !== null && value !== "") {
      parts.push(String(value));
      break;
    }
  }
  if (typeof data.amount === "number") {
    parts.push(`${data.amount.toFixed(2)} €`);
  }
  if (typeof data.quantity === "number") {
    parts.push(`×${data.quantity}`);
  }
  if (typeof data.club_role === "string") {
    parts.push(`(${data.club_role})`);
  }
  if (typeof data.role === "string" && !parts.some((p) => p.includes(String(data.role)))) {
    parts.push(`rol: ${data.role}`);
  }

  return parts.length > 0 ? parts.join(" · ") : tableLabel(row.table_name);
}
