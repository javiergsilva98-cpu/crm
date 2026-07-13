-- Datos de ejemplo para probar el CRM con casos reales.
-- Requiere haber ejecutado ya las migraciones 0001, 0002 y 0003.
--
-- Asigna todos los registros al primer usuario registrado (normalmente tú,
-- el admin). Si tienes varios usuarios y quieres usar otro, cambia la
-- subconsulta `(select id from auth.users order by created_at asc limit 1)`
-- por el UUID concreto de ese usuario (Authentication → Users en Supabase).

do $$
declare
  v_owner uuid := (select id from auth.users order by created_at asc limit 1);
  v_c1 uuid; -- Panadería Artesana Ruiz
  v_c2 uuid; -- Talleres Mecánicos Ferrol
  v_c3 uuid; -- Estudio Creativo Nube
  v_c4 uuid; -- Clínica Dental Vega
begin
  if v_owner is null then
    raise exception 'No hay ningún usuario registrado todavía. Regístrate en la app antes de correr este script.';
  end if;

  -- 1) Empresas ---------------------------------------------------------

  insert into public.companies (owner_id, name, website, industry, created_at)
  values (v_owner, 'Panadería Artesana Ruiz', 'panaderiaruiz.es', 'Alimentación', now() - interval '20 days')
  returning id into v_c1;

  insert into public.companies (owner_id, name, website, industry, created_at)
  values (v_owner, 'Talleres Mecánicos Ferrol', 'talleresferrol.com', 'Automoción', now() - interval '25 days')
  returning id into v_c2;

  insert into public.companies (owner_id, name, website, industry, created_at)
  values (v_owner, 'Estudio Creativo Nube', 'estudionube.es', 'Diseño', now() - interval '18 days')
  returning id into v_c3;

  insert into public.companies (owner_id, name, website, industry, created_at)
  values (v_owner, 'Clínica Dental Vega', 'clinicavega.es', 'Salud', now() - interval '15 days')
  returning id into v_c4;

  -- 2) Contactos (20) — mezcla de canales, con y sin empresa ------------

  -- Instagram (6): la panadería capta sobre todo por Instagram; la mayoría
  -- son clientes particulares sin empresa asociada.
  insert into public.contacts (owner_id, company_id, full_name, email, phone, source, source_detail, created_at) values
    (v_owner, v_c1, 'Ana Ruiz', 'ana@panaderiaruiz.es', '611 22 33 44', 'instagram', 'post reels tarta cumpleaños', now() - interval '11 days'),
    (v_owner, null, 'Javier Soto', 'javier.soto@gmail.com', '612 00 11 22', 'instagram', 'comentó en story', now() - interval '11 days'),
    (v_owner, null, 'Lucía Fernández', 'lucia.fdez@hotmail.com', '613 22 33 44', 'instagram', null, now() - interval '10 days'),
    (v_owner, null, 'Pablo Reyes', 'pablo.reyes@outlook.com', '614 33 44 55', 'instagram', 'reel receta de pan', now() - interval '8 days'),
    (v_owner, null, 'Marina Costa', 'marina.costa@gmail.com', '615 44 55 66', 'instagram', null, now() - interval '5 days'),
    (v_owner, null, 'Diego Herrera', 'diego.herrera@gmail.com', '616 55 66 77', 'instagram', 'anuncio pan artesano', now() - interval '3 days');

  -- Referido (3): el taller crece por boca a boca; uno de los referidos
  -- resulta que además comparte dominio de email con la empresa (para
  -- comprobar que la vinculación automática por dominio también aplica
  -- aunque el canal de origen sea "referido").
  insert into public.contacts (owner_id, company_id, full_name, email, phone, source, source_detail, created_at) values
    (v_owner, v_c2, 'Miguel Ferrol', 'miguel@talleresferrol.com', '622 33 44 55', 'referido', 'cliente actual, boca a boca', now() - interval '12 days'),
    (v_owner, null, 'Sara Domínguez', 'sara.dominguez@gmail.com', '623 44 55 66', 'referido', 'recomendada por Miguel', now() - interval '9 days'),
    (v_owner, v_c2, 'Roberto Blanco', 'roberto.blanco@talleresferrol.com', '624 55 66 77', 'referido', null, now() - interval '2 days');

  -- Google (4): el estudio de diseño capta por búsquedas.
  insert into public.contacts (owner_id, company_id, full_name, email, phone, source, source_detail, created_at) values
    (v_owner, v_c3, 'Laura Nube', 'laura@estudionube.es', '633 44 55 66', 'google', null, now() - interval '11 days'),
    (v_owner, null, 'Carmen Iglesias', 'carmen.iglesias@gmail.com', '634 55 66 77', 'google', 'búsqueda "diseño de logo"', now() - interval '7 days'),
    (v_owner, v_c3, 'Andrés Molina', 'andres.molina@estudionube.es', '635 66 77 88', 'google', 'búsqueda "identidad de marca"', now() - interval '4 days'),
    (v_owner, null, 'Elena Vidal', 'elena.vidal@yahoo.com', '636 77 88 99', 'google', null, now() - interval '1 days');

  -- WhatsApp (4): la clínica dental recibe consultas directas por WhatsApp.
  insert into public.contacts (owner_id, company_id, full_name, email, phone, source, source_detail, created_at) values
    (v_owner, v_c4, 'Carlos Vega', 'carlos@clinicavega.es', '644 55 66 77', 'whatsapp', null, now() - interval '12 days'),
    (v_owner, null, 'Isabel Prieto', 'isabel.prieto@gmail.com', '645 66 77 88', 'whatsapp', 'consulta revisión', now() - interval '8 days'),
    (v_owner, null, 'Fernando Cano', 'fernando.cano@gmail.com', '646 77 88 99', 'whatsapp', null, now() - interval '6 days'),
    (v_owner, null, 'Beatriz Núñez', 'beatriz.nunez@gmail.com', '647 88 99 00', 'whatsapp', 'urgencia dental', now() - interval '0 days');

  -- TikTok (2): empezando a probar este canal.
  insert into public.contacts (owner_id, company_id, full_name, email, phone, source, source_detail, created_at) values
    (v_owner, null, 'Álvaro Serrano', 'alvaro.serrano@gmail.com', '648 99 00 11', 'tiktok', 'vídeo antes/después', now() - interval '7 days'),
    (v_owner, null, 'Nuria Campos', 'nuria.campos@gmail.com', '649 00 11 22', 'tiktok', null, now() - interval '3 days');

  -- Sin canal indicado (1): contacto antiguo, de antes de usar el campo,
  -- y fuera del mes en curso (para probar filtros por fecha y el aviso de
  -- "sin canal indicado").
  insert into public.contacts (owner_id, company_id, full_name, email, phone, source, source_detail, created_at) values
    (v_owner, null, 'Jorge Aparicio', 'jorge.aparicio@empresaxyz.com', '650 11 22 33', null, null, now() - interval '40 days');

  -- 3) Oportunidades (10) — todas las etapas representadas --------------

  insert into public.opportunities (owner_id, company_id, title, stage, amount, created_at) values
    (v_owner, v_c1, 'Pedido tartas evento corporativo', 'nuevo', 850, now() - interval '10 days'),
    (v_owner, v_c1, 'Catering semanal oficina', 'calificado', 600, now() - interval '8 days'),
    (v_owner, v_c1, 'Pastelería para boda de agosto', 'propuesta', 1400, now() - interval '4 days'),
    (v_owner, v_c2, 'Mantenimiento flota de vehículos', 'negociacion', 3200, now() - interval '11 days'),
    (v_owner, v_c2, 'Revisión ITV completa', 'ganado', 450, now() - interval '23 days'),
    (v_owner, v_c2, 'Cambio de neumáticos', 'perdido', 320, now() - interval '18 days'),
    (v_owner, v_c3, 'Rediseño identidad de marca', 'ganado', 2100, now() - interval '16 days'),
    (v_owner, v_c3, 'Diseño de web corporativa', 'propuesta', 1800, now() - interval '3 days'),
    (v_owner, v_c4, 'Revisión anual clínica', 'nuevo', 450, now() - interval '2 days'),
    (v_owner, v_c4, 'Tratamiento de ortodoncia', 'negociacion', 2600, now() - interval '7 days');

  -- 4) Gasto de canales del mes en curso (para ver coste por contacto) --

  insert into public.channel_spend (owner_id, channel, month, amount, source_type) values
    (v_owner, 'instagram', date_trunc('month', now())::date, 150, 'manual'),
    (v_owner, 'google', date_trunc('month', now())::date, 80, 'manual'),
    (v_owner, 'whatsapp', date_trunc('month', now())::date, 20, 'manual'),
    (v_owner, 'tiktok', date_trunc('month', now())::date, 40, 'manual')
  on conflict (owner_id, channel, month) do update set amount = excluded.amount;

end $$;
