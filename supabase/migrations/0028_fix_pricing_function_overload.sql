-- Fase 9 (0024) reemplazó apply_menu_item_pricing y
-- recalculate_menu_prices_for_inventory_item añadiendo un tercer
-- parámetro (p_receipt_photo_url) con valor por defecto, en vez de
-- reemplazar la función de dos parámetros de las fases 4 y 4.1 (0019,
-- 0021). "create or replace function" con una lista de parámetros
-- distinta crea una función nueva sobrecargada en vez de sustituir la
-- anterior, así que quedaron dos versiones a la vez: una de 2
-- parámetros y otra de 3 (con el tercero opcional). Al llamarlas con
-- solo 2 argumentos, Postgres no puede decidir entre ambas y falla con
-- "function ... is not unique" — el error visto al dar de alta un
-- artículo de carta (p. ej. "Vino blanco").
--
-- Se eliminan las versiones antiguas de 2 parámetros: la de 3
-- parámetros (0024) ya cubre el mismo cálculo y su tercer argumento es
-- opcional, así que las llamadas existentes con 2 argumentos siguen
-- funcionando igual, resolviendo ahora sin ambigüedad.
drop function if exists public.apply_menu_item_pricing(uuid, numeric);
drop function if exists public.recalculate_menu_prices_for_inventory_item(uuid, numeric);
