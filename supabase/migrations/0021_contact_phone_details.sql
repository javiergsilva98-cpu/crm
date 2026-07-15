-- Prefijo telefónico y país del contacto, por separado del número en sí,
-- para poder mostrarlo formateado (ej. "+34 612345678") y saber de qué
-- país es sin tener que deducirlo del prefijo a mano.

alter table public.contacts
  add column if not exists phone_prefix text,
  add column if not exists phone_country text;
