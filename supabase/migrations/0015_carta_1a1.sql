-- Ajusta la carta para que todo lo vendido sea 1:1 con bodega: latas,
-- botellines o paquetes individuales (consumo unitario), y botellas para
-- repartir entre varios socios (consumo compartido). Se quita lo que no
-- encaja en ese modelo (raciones, copas sueltas, tablas mixtas) en vez de
-- inventar una equivalencia rara.

-- ---------------------------------------------------------------------
-- Bodega: renombra el barril de cerveza a latas y añade lo que falta.
-- IDs 40000000-...-0001 a 0006 vienen de seed.sql, 0007 de la migración
-- 0004 (Tinto de verano) — se usan 0011 en adelante para no chocar.
-- ---------------------------------------------------------------------
update public.inventory_items set name = 'Cerveza (latas)', unit = 'latas'
  where id = '40000000-0000-0000-0000-000000000002';
update public.inventory_restocks set quantity = 48, cost = 60.00
  where inventory_item_id = '40000000-0000-0000-0000-000000000002'
    and restocked_at = '2026-01-15';

insert into public.inventory_items (id, name, unit, current_stock, low_stock_threshold) values
  ('40000000-0000-0000-0000-000000000011', 'Vino blanco (botella)', 'botellas', 0, 3),
  ('40000000-0000-0000-0000-000000000012', 'Vermut (botella)',      'botellas', 0, 2),
  ('40000000-0000-0000-0000-000000000013', 'Agua (botellín)',       'botellines', 0, 6),
  ('40000000-0000-0000-0000-000000000014', 'Aceitunas (paquete)',   'paquetes', 0, 3)
on conflict (id) do nothing;

insert into public.inventory_restocks (inventory_item_id, quantity, cost, restocked_at, responsible_member_id) values
  ('40000000-0000-0000-0000-000000000011', 12, 66.00, '2026-02-05', '10000000-0000-0000-0000-000000000005'),
  ('40000000-0000-0000-0000-000000000012', 6,  48.00, '2026-02-05', '10000000-0000-0000-0000-000000000005'),
  ('40000000-0000-0000-0000-000000000013', 48, 14.40, '2026-02-05', '10000000-0000-0000-0000-000000000005'),
  ('40000000-0000-0000-0000-000000000014', 20, 18.00, '2026-02-05', '10000000-0000-0000-0000-000000000005');

-- ---------------------------------------------------------------------
-- Recompone current_stock de todo lo vinculado a partir del histórico de
-- reposiciones y consumos, ahora que se ha corregido la cantidad de la
-- de cerveza y hay artículos recién vinculados con consumos previos.
-- ---------------------------------------------------------------------
update public.inventory_items i set current_stock = coalesce((
  select sum(r.quantity) from public.inventory_restocks r where r.inventory_item_id = i.id
), 0) - coalesce((
  select sum(c.quantity) from public.consumptions c
  join public.menu_items m on m.id = c.menu_item_id
  where m.inventory_item_id = i.id
), 0)
where i.id in (
  '40000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000005',
  '40000000-0000-0000-0000-000000000006',
  '40000000-0000-0000-0000-000000000007',
  '40000000-0000-0000-0000-000000000011',
  '40000000-0000-0000-0000-000000000012',
  '40000000-0000-0000-0000-000000000013',
  '40000000-0000-0000-0000-000000000014'
);

-- ---------------------------------------------------------------------
-- Carta: cada bebida/aperitivo queda vinculado 1:1 (unitario) o
-- compartido (botella a repartir) a su artículo de bodega.
-- ---------------------------------------------------------------------
update public.menu_items set
  name = 'Cerveza (lata)', inventory_item_id = '40000000-0000-0000-0000-000000000002', stock_mode = 'unit'
  where id = '20000000-0000-0000-0000-000000000001'; -- antes "Caña"

update public.menu_items set
  name = 'Vino tinto (botella) D.O. Cebreros', price = 9.00,
  inventory_item_id = '40000000-0000-0000-0000-000000000001', stock_mode = 'shared'
  where id = '20000000-0000-0000-0000-000000000002'; -- antes "Vino tinto (copa)"

update public.menu_items set
  name = 'Vino blanco (botella)', price = 9.00,
  inventory_item_id = '40000000-0000-0000-0000-000000000011', stock_mode = 'shared'
  where id = '20000000-0000-0000-0000-000000000003'; -- antes "Vino blanco (copa)"

update public.menu_items set
  name = 'Vermut (botella)', price = 8.00,
  inventory_item_id = '40000000-0000-0000-0000-000000000012', stock_mode = 'shared'
  where id = '20000000-0000-0000-0000-000000000004';

update public.menu_items set
  name = 'Refresco (lata)', inventory_item_id = '40000000-0000-0000-0000-000000000006', stock_mode = 'unit'
  where id = '20000000-0000-0000-0000-000000000005';

update public.menu_items set
  name = 'Agua (botellín)', inventory_item_id = '40000000-0000-0000-0000-000000000013', stock_mode = 'unit'
  where id = '20000000-0000-0000-0000-000000000006';

update public.menu_items set
  name = 'Aceitunas (paquete)', inventory_item_id = '40000000-0000-0000-0000-000000000014', stock_mode = 'unit'
  where id = '20000000-0000-0000-0000-000000000007';

update public.menu_items set
  name = 'Patatas fritas (paquete)', inventory_item_id = '40000000-0000-0000-0000-000000000005', stock_mode = 'unit'
  where id = '20000000-0000-0000-0000-000000000008';

-- Tinto de verano ya se llevaba en bodega por botellas: se declara
-- explícitamente como compartido (se abre y se reparte).
update public.menu_items set
  name = 'Tinto de verano (botella)',
  inventory_item_id = '40000000-0000-0000-0000-000000000007', stock_mode = 'shared'
  where id = '20000000-0000-0000-0000-000000000012';

-- Jamón, queso y tabla mixta se vendían "por ración/tabla", que no es 1:1
-- con una unidad de bodega (paquete, botella o lata). Se desactivan de la
-- carta en vez de borrarse (ya tienen consumos registrados) hasta que se
-- decida cómo venderlos en formato unitario (p.ej. loncha envasada).
update public.menu_items set active = false
  where id in (
    '20000000-0000-0000-0000-000000000009', -- Jamón ibérico (ración)
    '20000000-0000-0000-0000-000000000010', -- Queso curado (ración)
    '20000000-0000-0000-0000-000000000011'  -- Tabla mixta
  );
