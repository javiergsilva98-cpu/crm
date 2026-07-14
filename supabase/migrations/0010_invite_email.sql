-- Permite invitar por email además de por enlace: se guarda el email
-- de destino y si el correo llegó a enviarse.

alter table public.invites add column if not exists email text;
alter table public.invites add column if not exists sent_at timestamptz;
