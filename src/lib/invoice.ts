export type InvoiceItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

export function calculateTotals(
  items: { quantity: number; unit_price: number }[],
  taxRate: number,
) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

export function parseInvoiceItems(formData: FormData): InvoiceItem[] {
  const count = Number(formData.get("item_count") ?? 0);
  const items: InvoiceItem[] = [];

  for (let i = 0; i < count; i++) {
    const description = String(formData.get(`item_description_${i}`) ?? "").trim();
    if (!description) continue;
    const quantity = Number(formData.get(`item_quantity_${i}`) ?? 0) || 0;
    const unitPrice = Number(formData.get(`item_unit_price_${i}`) ?? 0) || 0;
    items.push({ description, quantity, unit_price: unitPrice });
  }

  return items;
}
