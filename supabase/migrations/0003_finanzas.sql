-- =============================================================================
-- Fase 3: finanzas (cobro de citas, stock de insumos, resumen mensual)
-- =============================================================================

-- Stock: cada movimiento suma (compra) o resta (uso/ajuste negativo) automáticamente.
create or replace function public.movimientos_insumo_stock() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.insumos set stock_actual = stock_actual + new.cantidad where id = new.insumo_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.insumos set stock_actual = stock_actual - old.cantidad where id = old.insumo_id;
    return old;
  end if;
  return null;
end $$;
drop trigger if exists movimientos_insumo_stock on public.movimientos_insumo;
create trigger movimientos_insumo_stock after insert or delete on public.movimientos_insumo
  for each row execute function public.movimientos_insumo_stock();

-- -----------------------------------------------------------------------------
-- Marcar atendida: guarda el total, descuenta la seña ya cobrada y genera UN
-- ingreso 'saldo' (índice único por cita → nunca se duplica). Descuenta los
-- insumos asociados al servicio (una sola vez por cita).
-- -----------------------------------------------------------------------------
create or replace function public.marcar_atendida(p_cita uuid, p_total integer, p_medio text, p_fecha date default null)
returns integer
language plpgsql security invoker set search_path = public as $$
declare
  c public.citas;
  v_sena integer;
  v_saldo integer;
  v_fecha date;
begin
  if not public.es_admin() then raise exception 'NO_AUTORIZADO' using errcode = '42501'; end if;
  if p_total is null or p_total < 0 then raise exception 'MONTO_INVALIDO' using errcode = 'P0001'; end if;
  if p_medio not in ('efectivo','transferencia') then raise exception 'MEDIO_INVALIDO' using errcode = 'P0001'; end if;
  select * into c from public.citas where id = p_cita for update;
  if not found then raise exception 'CITA_NO_EXISTE' using errcode = 'P0001'; end if;
  if c.estado in ('cancelada','no_asistio') then
    raise exception 'CITA_NO_ACTIVA: reactivá la cita antes de cobrarla' using errcode = 'P0001';
  end if;

  v_sena := case when c.sena_pagada then coalesce(c.sena_monto, 0) else 0 end;
  v_saldo := p_total - v_sena;
  if v_saldo < 0 then
    raise exception 'TOTAL_MENOR_QUE_SENA: el total es menor que la seña ya cobrada' using errcode = 'P0001';
  end if;
  v_fecha := coalesce(p_fecha, (c.inicio at time zone 'America/Asuncion')::date);

  update public.citas set estado = 'atendida', monto_total = p_total, medio_pago = p_medio where id = p_cita;

  if v_saldo > 0 then
    insert into public.ingresos (fecha, monto, medio, tipo, concepto, cita_id, clienta_id, nota)
    values (v_fecha, v_saldo, p_medio, case when c.curso_id is not null then 'curso' else 'servicio' end,
            'saldo', p_cita, c.clienta_id, 'Saldo')
    on conflict (cita_id, concepto) where cita_id is not null and concepto in ('sena','saldo')
    do update set fecha = excluded.fecha, monto = excluded.monto, medio = excluded.medio;
  else
    delete from public.ingresos where cita_id = p_cita and concepto = 'saldo';
  end if;

  if c.servicio_id is not null
     and not exists (select 1 from public.movimientos_insumo where cita_id = p_cita and tipo = 'uso') then
    insert into public.movimientos_insumo (insumo_id, tipo, cantidad, cita_id, nota)
    select si.insumo_id, 'uso', -si.cantidad, p_cita, 'Uso automático al atender'
    from public.servicio_insumos si
    join public.insumos i on i.id = si.insumo_id and i.activo
    where si.servicio_id = c.servicio_id;
  end if;
  return v_saldo;
end $$;
revoke all on function public.marcar_atendida(uuid, integer, text, date) from public, anon;
grant execute on function public.marcar_atendida(uuid, integer, text, date) to authenticated;

-- Deshacer "atendida": borra el saldo, devuelve los insumos al stock.
create or replace function public.desmarcar_atendida(p_cita uuid) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'NO_AUTORIZADO' using errcode = '42501'; end if;
  delete from public.ingresos where cita_id = p_cita and concepto = 'saldo';
  delete from public.movimientos_insumo where cita_id = p_cita and tipo = 'uso';
  update public.citas
     set estado = case when sena_pagada then 'confirmada'::public.estado_cita else 'pendiente_sena'::public.estado_cita end,
         monto_total = null, medio_pago = null
   where id = p_cita and estado = 'atendida';
end $$;
revoke all on function public.desmarcar_atendida(uuid) from public, anon;
grant execute on function public.desmarcar_atendida(uuid) to authenticated;

-- La seña no se toca en una cita ya cobrada (evita saldos desfasados).
create or replace function public.registrar_sena(p_cita uuid, p_monto integer, p_fecha date, p_medio text) returns void
language plpgsql security invoker set search_path = public as $$
declare
  c public.citas;
begin
  if not public.es_admin() then raise exception 'NO_AUTORIZADO' using errcode = '42501'; end if;
  if p_monto is null or p_monto <= 0 then raise exception 'MONTO_INVALIDO' using errcode = 'P0001'; end if;
  select * into c from public.citas where id = p_cita for update;
  if not found then raise exception 'CITA_NO_EXISTE' using errcode = 'P0001'; end if;
  if c.estado = 'atendida' then
    raise exception 'CITA_ATENDIDA: deshacé "atendida" para cambiar la seña' using errcode = 'P0001';
  end if;
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

create or replace function public.anular_sena(p_cita uuid) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'NO_AUTORIZADO' using errcode = '42501'; end if;
  if exists (select 1 from public.citas where id = p_cita and estado = 'atendida') then
    raise exception 'CITA_ATENDIDA: deshacé "atendida" para cambiar la seña' using errcode = 'P0001';
  end if;
  delete from public.ingresos where cita_id = p_cita and concepto = 'sena';
  update public.citas
     set sena_pagada = false, sena_monto = null, sena_fecha = null, sena_medio = null,
         estado = case when estado = 'confirmada' then 'pendiente_sena'::public.estado_cita else estado end
   where id = p_cita;
end $$;

-- -----------------------------------------------------------------------------
-- Compra de insumo: suma stock y crea el gasto (categoría de insumos).
-- -----------------------------------------------------------------------------
create or replace function public.registrar_compra(
  p_insumo uuid, p_cantidad numeric, p_costo_total integer, p_fecha date, p_medio text, p_nota text default null
) returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_cat uuid;
  v_gasto uuid;
  v_nombre text;
begin
  if not public.es_admin() then raise exception 'NO_AUTORIZADO' using errcode = '42501'; end if;
  if p_cantidad is null or p_cantidad <= 0 then raise exception 'CANTIDAD_INVALIDA' using errcode = 'P0001'; end if;
  if p_costo_total is null or p_costo_total < 0 then raise exception 'MONTO_INVALIDO' using errcode = 'P0001'; end if;
  select nombre into v_nombre from public.insumos where id = p_insumo;
  if v_nombre is null then raise exception 'INSUMO_NO_EXISTE' using errcode = 'P0001'; end if;

  if p_costo_total > 0 then
    select id into v_cat from public.categorias_gasto where es_insumos order by orden limit 1;
    if v_cat is null then
      insert into public.categorias_gasto (nombre, es_insumos, orden) values ('Insumos', true, 1) returning id into v_cat;
    end if;
    insert into public.gastos (fecha, monto, categoria_id, medio, nota)
    values (p_fecha, p_costo_total, v_cat, p_medio,
            'Compra: ' || v_nombre || ' ×' || trim(to_char(p_cantidad, 'FM999999990.##')) || coalesce(' · ' || nullif(trim(p_nota), ''), ''))
    returning id into v_gasto;
    update public.insumos set costo_ultima_compra = round(p_costo_total / p_cantidad) where id = p_insumo;
  end if;

  insert into public.movimientos_insumo (insumo_id, tipo, cantidad, costo_total, gasto_id, fecha, nota)
  values (p_insumo, 'compra', p_cantidad, p_costo_total, v_gasto, (p_fecha + time '12:00') at time zone 'America/Asuncion', nullif(trim(p_nota), ''));
end $$;
revoke all on function public.registrar_compra(uuid, numeric, integer, date, text, text) from public, anon;
grant execute on function public.registrar_compra(uuid, numeric, integer, date, text, text) to authenticated;

-- Anular un movimiento (devuelve el stock y, si era compra, borra su gasto).
create or replace function public.anular_movimiento(p_mov uuid) returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_gasto uuid;
begin
  if not public.es_admin() then raise exception 'NO_AUTORIZADO' using errcode = '42501'; end if;
  delete from public.movimientos_insumo where id = p_mov returning gasto_id into v_gasto;
  if v_gasto is not null then delete from public.gastos where id = v_gasto; end if;
end $$;
revoke all on function public.anular_movimiento(uuid) from public, anon;
grant execute on function public.anular_movimiento(uuid) to authenticated;

-- Estado de insumos con alertas.
create or replace view public.insumos_estado with (security_invoker = true) as
select i.*,
       u.ultimo_uso,
       (i.activo and i.stock_actual <= i.stock_minimo) as por_reponer,
       (i.activo and i.stock_actual > 0 and i.creado_en < now() - interval '60 days'
        and (u.ultimo_uso is null or u.ultimo_uso < now() - interval '60 days')) as sobra
from public.insumos i
left join lateral (
  select max(m.fecha) as ultimo_uso from public.movimientos_insumo m where m.insumo_id = i.id and m.tipo = 'uso'
) u on true;
revoke all on public.insumos_estado from anon;
grant select on public.insumos_estado to authenticated;

-- -----------------------------------------------------------------------------
-- Resumen del mes para el dashboard (todo calculado en la base).
-- -----------------------------------------------------------------------------
create or replace function public.resumen_mes(p_mes date) returns jsonb
language plpgsql stable security invoker set search_path = public as $$
declare
  tz constant text := 'America/Asuncion';
  v_ini date := date_trunc('month', p_mes)::date;
  v_fin date := (date_trunc('month', p_mes) + interval '1 month')::date;
  cfg public.configuracion;
  v_ing bigint;
  v_gas bigint;
  v_prom numeric;
  v_reserva bigint;
begin
  if not public.es_admin() then raise exception 'NO_AUTORIZADO' using errcode = '42501'; end if;
  select * into cfg from public.configuracion where id = 1;
  select coalesce(sum(monto), 0) into v_ing from public.ingresos where fecha >= v_ini and fecha < v_fin;
  select coalesce(sum(monto), 0) into v_gas from public.gastos where fecha >= v_ini and fecha < v_fin;
  select coalesce(sum(g.monto), 0) / 3.0 into v_prom
    from public.gastos g join public.categorias_gasto c on c.id = g.categoria_id
   where c.es_insumos and g.fecha >= (v_ini - interval '3 months')::date and g.fecha < v_ini;
  v_reserva := case when cfg.reserva_modo = 'porcentaje' then round(v_ing * cfg.reserva_porcentaje / 100) else round(v_prom) end;

  return jsonb_build_object(
    'mes', v_ini,
    'ingresos', v_ing,
    'gastos', v_gas,
    'ganancia', v_ing - v_gas,
    'reserva', v_reserva,
    'reserva_modo', cfg.reserva_modo,
    'reserva_porcentaje', cfg.reserva_porcentaje,
    'promedio_insumos_3m', round(v_prom),
    'bolsillo', v_ing - v_gas - v_reserva,
    'ingresos_por_medio', (select coalesce(jsonb_object_agg(medio, total), '{}') from (
        select medio, sum(monto) total from public.ingresos where fecha >= v_ini and fecha < v_fin group by medio) x),
    'gastos_por_medio', (select coalesce(jsonb_object_agg(medio, total), '{}') from (
        select medio, sum(monto) total from public.gastos where fecha >= v_ini and fecha < v_fin group by medio) x),
    'ingresos_por_tipo', (select coalesce(jsonb_object_agg(tipo, total), '{}') from (
        select tipo, sum(monto) total from public.ingresos where fecha >= v_ini and fecha < v_fin group by tipo) x),
    'ingresos_por_categoria', (select coalesce(jsonb_agg(jsonb_build_object('categoria', categoria, 'total', total) order by total desc), '[]') from (
        select coalesce(cat.nombre, case when i.tipo = 'curso' then 'Cursos' else 'Otros' end) categoria, sum(i.monto) total
          from public.ingresos i
          left join public.citas ct on ct.id = i.cita_id
          left join public.servicios s on s.id = ct.servicio_id
          left join public.categorias cat on cat.id = s.categoria_id
         where i.fecha >= v_ini and i.fecha < v_fin
         group by 1) x),
    'gastos_por_categoria', (select coalesce(jsonb_agg(jsonb_build_object('categoria', c.nombre, 'total', x.total) order by x.total desc), '[]') from (
        select categoria_id, sum(monto) total from public.gastos where fecha >= v_ini and fecha < v_fin group by categoria_id) x
        join public.categorias_gasto c on c.id = x.categoria_id),
    'citas_por_estado', (select coalesce(jsonb_object_agg(estado, n), '{}') from (
        select estado, count(*) n from public.citas
         where (inicio at time zone tz)::date >= v_ini and (inicio at time zone tz)::date < v_fin group by estado) x),
    'clientas_atendidas', (select count(distinct clienta_id) from public.citas
         where estado = 'atendida' and (inicio at time zone tz)::date >= v_ini and (inicio at time zone tz)::date < v_fin),
    'top_servicios', (select coalesce(jsonb_agg(jsonb_build_object('nombre', nombre, 'cantidad', n, 'total', total) order by n desc, total desc), '[]') from (
        select coalesce(s.nombre, cu.nombre) nombre, count(*) n, coalesce(sum(ct.monto_total), 0) total
          from public.citas ct
          left join public.servicios s on s.id = ct.servicio_id
          left join public.cursos cu on cu.id = ct.curso_id
         where ct.estado = 'atendida' and (ct.inicio at time zone tz)::date >= v_ini and (ct.inicio at time zone tz)::date < v_fin
         group by 1 order by count(*) desc, coalesce(sum(ct.monto_total), 0) desc limit 6) x),
    'serie', (select jsonb_agg(jsonb_build_object('mes', m, 'ingresos', i, 'gastos', g) order by m) from (
        select gs::date m,
               coalesce((select sum(monto) from public.ingresos where fecha >= gs::date and fecha < (gs + interval '1 month')::date), 0) i,
               coalesce((select sum(monto) from public.gastos where fecha >= gs::date and fecha < (gs + interval '1 month')::date), 0) g
          from generate_series(v_ini - interval '11 months', v_ini, interval '1 month') gs) x)
  );
end $$;
revoke all on function public.resumen_mes(date) from public, anon;
grant execute on function public.resumen_mes(date) to authenticated;
