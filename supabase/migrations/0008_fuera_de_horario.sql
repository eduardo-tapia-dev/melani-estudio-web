-- Melani a veces atiende fuera del horario (antes de abrir, después de cerrar o en días que no abre).
-- El horario de atención sigue sirviendo para sugerir "Horarios libres", pero ya no bloquea guardar
-- una cita escrita a mano ("Escribir otra hora"). Se mantiene: el anti-choques (exclusion constraint)
-- y que la cita empiece y termine el mismo día.
create or replace function public.citas_validar() returns trigger
language plpgsql as $$
declare
  cfg public.configuracion;
  dur integer;
  ini_local timestamp;
  fin_local timestamp;
begin
  select * into cfg from public.configuracion where id = 1;

  if new.servicio_id is not null then
    select duracion_min into dur from public.servicios where id = new.servicio_id;
  else
    select duracion_min into dur from public.cursos where id = new.curso_id;
  end if;
  dur := coalesce(dur, cfg.duracion_default_min);

  -- Si no se envió fin (o cambió el inicio/servicio), se recalcula con la duración.
  if tg_op = 'INSERT' and new.fin is null then
    new.fin := new.inicio + make_interval(mins => dur);
  elsif tg_op = 'UPDATE' and new.fin = old.fin
        and (new.inicio <> old.inicio
             or new.servicio_id is distinct from old.servicio_id
             or new.curso_id is distinct from old.curso_id) then
    new.fin := new.inicio + make_interval(mins => dur);
  end if;
  new.bloqueo_fin := new.fin + make_interval(mins => cfg.margen_min);

  -- Solo para citas activas: debe terminar el mismo día (no se valida el horario de atención).
  if new.estado in ('pendiente_sena','confirmada') then
    ini_local := new.inicio at time zone 'America/Asuncion';
    fin_local := new.fin at time zone 'America/Asuncion';
    if ini_local::date <> fin_local::date then
      raise exception 'FUERA_DE_HORARIO: la cita tiene que terminar antes de la medianoche'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
