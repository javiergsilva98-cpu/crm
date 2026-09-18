-- Corrige el modelo de cuota: es mensual (25 €), no anual (60 €), y el
-- club no funciona con prepago (los socios no cargan saldo por
-- adelantado). El saldo de cada socio (cuota pagada - consumido) es el
-- importe pendiente de abonar a final de mes, así que lo normal es que
-- esté en negativo hasta que se liquide.
--
-- Sustituye las cuotas de ejemplo (anuales, 60 €) por cuotas mensuales
-- de 25 € para septiembre 2026 (el mes en curso de la demo), y deja a
-- la mayoría de socios sin la cuota de este mes todavía pagada, para
-- que se vea el saldo negativo real que tendrían que liquidar.

delete from public.treasury_movements where movement_type = 'cuota';

insert into public.treasury_movements (movement_type, amount, movement_date, description, member_id, event_id) values
  ('cuota', 25.00, '2026-09-05', 'Cuota mensual septiembre 2026', '10000000-0000-0000-0000-000000000001', null),
  ('cuota', 25.00, '2026-09-06', 'Cuota mensual septiembre 2026', '10000000-0000-0000-0000-000000000002', null),
  ('cuota', 25.00, '2026-09-06', 'Cuota mensual septiembre 2026', '10000000-0000-0000-0000-000000000003', null);
