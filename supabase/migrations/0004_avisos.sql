-- =============================================================================
-- Fase 4: aviso diario por Web Push y cron.
-- El cron NO usa la service_role key: se autentica con un token propio cuyo
-- hash SHA-256 vive en cron_secreto (tabla sin ninguna política → invisible
-- para anon y authenticated). Solo funciones SECURITY DEFINER lo consultan.
-- =============================================================================

create table if not exists public.cron_secreto (
  id smallint primary key default 1 check (id = 1),
  hash text not null
);
alter table public.cron_secreto enable row level security;
revoke all on public.cron_secreto from anon, authenticated;

create or replace function public.cron_valido(p_token text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists (
    select 1 from public.cron_secreto
    where p_token is not null and length(p_token) >= 32
      and hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  );
$$;
revoke all on function public.cron_valido(text) from public, anon, authenticated;

-- Datos para el aviso de las 20:00: citas activas de mañana + suscripciones.
create or replace function public.aviso_diario(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  tz constant text := 'America/Asuncion';
  v_manana date := (now() at time zone tz)::date + 1;
begin
  if not public.cron_valido(p_token) then raise exception 'NO_AUTORIZADO' using errcode = '42501'; end if;
  return jsonb_build_object(
    'fecha', v_manana,
    'citas', (select coalesce(jsonb_agg(jsonb_build_object(
                 'hora', to_char(c.inicio at time zone tz, 'HH24:MI'),
                 'clienta', split_part(cl.nombre, ' ', 1),
                 'servicio', coalesce(s.nombre, cu.nombre),
                 'sena', c.sena_pagada,
                 'recordatorio', c.recordatorio_enviado) order by c.inicio), '[]')
              from public.citas c
              join public.clientas cl on cl.id = c.clienta_id
              left join public.servicios s on s.id = c.servicio_id
              left join public.cursos cu on cu.id = c.curso_id
              where (c.inicio at time zone tz)::date = v_manana
                and c.estado in ('pendiente_sena','confirmada')),
    'suscripciones', (select coalesce(jsonb_agg(jsonb_build_object('endpoint', endpoint, 'p256dh', p256dh, 'auth', auth)), '[]')
                      from public.push_subscriptions)
  );
end $$;
revoke all on function public.aviso_diario(text) from public;
grant execute on function public.aviso_diario(text) to anon;

-- Limpia suscripciones vencidas (el servicio de push responde 404/410).
create or replace function public.quitar_suscripcion(p_token text, p_endpoint text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.cron_valido(p_token) then raise exception 'NO_AUTORIZADO' using errcode = '42501'; end if;
  delete from public.push_subscriptions where endpoint = p_endpoint;
end $$;
revoke all on function public.quitar_suscripcion(text, text) from public;
grant execute on function public.quitar_suscripcion(text, text) to anon;
