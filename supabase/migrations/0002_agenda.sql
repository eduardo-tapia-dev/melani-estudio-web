-- =============================================================================
-- Fase 2: agenda (horarios libres, seña) y permisos más estrictos.
-- =============================================================================

-- Defensa en profundidad: el rol anónimo no tiene NINGÚN privilegio sobre
-- tablas privadas (además de RLS). Así una consulta pública da 401, no [].
revoke all on table public.clientas, public.citas, public.ingresos, public.gastos,
  public.categorias_gasto, public.insumos, public.movimientos_insumo,
  public.servicio_insumos, public.servicio_valores, public.push_subscriptions,
  public.admins
  from anon;

-- -----------------------------------------------------------------------------
-- Horarios libres para una fecha y duración.
-- Candidatos: cada 30 min desde la apertura + el final (con margen) de cada cita
-- del día, para no desperdiciar huecos. Se descartan los que chocan, los que
-- terminan después del cierre y los que ya pasaron.
-- -----------------------------------------------------------------------------
create or replace function public.horarios_libres(
  p_fecha date,
  p_duracion_min integer,
  p_excluir_cita uuid default null
) returns table (inicio timestamptz, fin timestamptz)
language plpgsql stable security invoker set search_path = public as $$
declare
  cfg public.configuracion;
  tz constant text := 'America/Asuncion';
begin
  if not public.es_admin() then
    raise exception 'NO_AUTORIZADO' using errcode = '42501';
  end if;
  select * into cfg from public.configuracion where id = 1;
  if not (extract(isodow from p_fecha)::smallint = any (cfg.dias_atencion)) then
    return;
  end if;

  return query
  with candidatos as (
    select g at time zone tz as ini
    from generate_series(p_fecha + cfg.hora_apertura, p_fecha + cfg.hora_cierre, interval '30 minutes') g
    union
    select c.bloqueo_fin
    from public.citas c
    where c.estado in ('pendiente_sena','confirmada','atendida')
      and (c.bloqueo_fin at time zone tz)::date = p_fecha
      and (p_excluir_cita is null or c.id <> p_excluir_cita)
  )
  select k.ini, k.ini + make_interval(mins => p_duracion_min)
  from candidatos k
  where (k.ini at time zone tz)::time >= cfg.hora_apertura
    and ((k.ini + make_interval(mins => p_duracion_min)) at time zone tz)::time <= cfg.hora_cierre
    and ((k.ini + make_interval(mins => p_duracion_min)) at time zone tz)::date = p_fecha
    and k.ini > now()
    and not exists (
      select 1 from public.citas c
      where c.estado in ('pendiente_sena','confirmada','atendida')
        and (p_excluir_cita is null or c.id <> p_excluir_cita)
        and tstzrange(c.inicio, c.bloqueo_fin, '[)')
            && tstzrange(k.ini, k.ini + make_interval(mins => p_duracion_min + cfg.margen_min), '[)')
    )
  order by k.ini;
end $$;
revoke all on function public.horarios_libres(date, integer, uuid) from public, anon;
grant execute on function public.horarios_libres(date, integer, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Registrar (o corregir) la seña de una cita. Crea/actualiza UN ingreso
-- 'sena' para la cita (índice único) y confirma la cita si estaba pendiente.
-- -----------------------------------------------------------------------------
create or replace function public.registrar_sena(
  p_cita uuid,
  p_monto integer,
  p_fecha date,
  p_medio text
) returns void
language plpgsql security invoker set search_path = public as $$
declare
  c public.citas;
begin
  if not public.es_admin() then
    raise exception 'NO_AUTORIZADO' using errcode = '42501';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'MONTO_INVALIDO' using errcode = 'P0001';
  end if;
  select * into c from public.citas where id = p_cita for update;
  if not found then raise exception 'CITA_NO_EXISTE' using errcode = 'P0001'; end if;

  update public.citas
     set sena_pagada = true, sena_monto = p_monto, sena_fecha = p_fecha, sena_medio = p_medio,
         estado = case when estado = 'pendiente_sena' then 'confirmada'::public.estado_cita else estado end
   where id = p_cita;

  insert into public.ingresos (fecha, monto, medio, tipo, concepto, cita_id, clienta_id, nota)
  values (p_fecha, p_monto, p_medio, case when c.curso_id is not null then 'curso' else 'servicio' end,
          'sena', p_cita, c.clienta_id, 'Seña')
  on conflict (cita_id, concepto) where cita_id is not null and concepto in ('sena','saldo')
  do update set fecha = excluded.fecha, monto = excluded.monto, medio = excluded.medio;
end $$;
revoke all on function public.registrar_sena(uuid, integer, date, text) from public, anon;
grant execute on function public.registrar_sena(uuid, integer, date, text) to authenticated;

-- Quitar una seña cargada por error (borra también su ingreso).
create or replace function public.anular_sena(p_cita uuid) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if not public.es_admin() then
    raise exception 'NO_AUTORIZADO' using errcode = '42501';
  end if;
  delete from public.ingresos where cita_id = p_cita and concepto = 'sena';
  update public.citas
     set sena_pagada = false, sena_monto = null, sena_fecha = null, sena_medio = null,
         estado = case when estado = 'confirmada' then 'pendiente_sena'::public.estado_cita else estado end
   where id = p_cita;
end $$;
revoke all on function public.anular_sena(uuid) from public, anon;
grant execute on function public.anular_sena(uuid) to authenticated;

-- Total gastado por clienta (para la ficha).
create or replace view public.clientas_resumen with (security_invoker = true) as
select c.id, c.nombre, c.telefono, c.notas, c.creado_en,
       coalesce((select sum(i.monto) from public.ingresos i where i.clienta_id = c.id), 0)::bigint as total_gastado,
       (select count(*) from public.citas ct where ct.clienta_id = c.id and ct.estado = 'atendida') as citas_atendidas,
       (select max(ct.inicio) from public.citas ct where ct.clienta_id = c.id and ct.estado = 'atendida') as ultima_visita
from public.clientas c;
revoke all on public.clientas_resumen from anon;
grant select on public.clientas_resumen to authenticated;
