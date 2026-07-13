-- Fecha de pago de una factura.
alter table public.invoices add column if not exists paid_at date;
