-- Aviso de stock bajo en el inventario: cada artículo tiene su propio
-- umbral (no todos los artículos se agotan igual: un barril de cerveza
-- "queda poco" con 1, una caja de patatas con 10).

alter table public.inventory_items
  add column low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0);

update public.inventory_items set low_stock_threshold = 6  where id = '40000000-0000-0000-0000-000000000001'; -- Vino tinto D.O. Cebreros (botellas)
update public.inventory_items set low_stock_threshold = 1  where id = '40000000-0000-0000-0000-000000000002'; -- Cerveza (barril 30L)
update public.inventory_items set low_stock_threshold = 2  where id = '40000000-0000-0000-0000-000000000003'; -- Jamón ibérico (piezas)
update public.inventory_items set low_stock_threshold = 1  where id = '40000000-0000-0000-0000-000000000004'; -- Queso curado (piezas)
update public.inventory_items set low_stock_threshold = 10 where id = '40000000-0000-0000-0000-000000000005'; -- Patatas fritas (paquetes)
update public.inventory_items set low_stock_threshold = 24 where id = '40000000-0000-0000-0000-000000000006'; -- Refrescos (lata)
update public.inventory_items set low_stock_threshold = 6  where id = '40000000-0000-0000-0000-000000000007'; -- Tinto de verano (botellas)
