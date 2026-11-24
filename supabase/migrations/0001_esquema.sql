-- =============================================================================
-- Estudio Melani Cristine — esquema completo
-- Montos: integer en guaraníes. Fechas: timestamptz. Zona: America/Asuncion.
-- Regla de oro: NINGUNA tabla con montos tiene política de lectura pública.
-- =============================================================================

create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Administradoras (solo Melani). es_admin() se usa en todas las políticas.
-- -----------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creado_en timestamptz not null default now()
);
alter table public.admins enable row level security;
create policy admins_self on public.admins for select to authenticated
  using (user_id = auth.uid());

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated;

-- Utilidad: actualizado_en automático
create or replace function public.tocar_actualizado() returns trigger
language plpgsql as $$ begin new.actualizado_en := now(); return new; end $$;

-- -----------------------------------------------------------------------------
-- Configuración (una sola fila). El público solo puede leer columnas seguras
-- mediante privilegios por columna (ver GRANT más abajo).
-- -----------------------------------------------------------------------------
create table public.configuracion (
  id smallint primary key default 1 check (id = 1),
  nombre_negocio text not null default 'Estudio Melani Cristine',
  whatsapp text not null default '595972612944',
  instagram_url text not null default 'https://www.instagram.com/melanicristine.estudio',
  tiktok_url text not null default 'https://www.tiktok.com/@melanicristine',
  direccion text not null default 'San Lorenzo, calle 26 de Marzo, casi Los Laureles',
  ciudad text not null default 'San Lorenzo, Paraguay',
  google_maps_url text,
  dias_atencion smallint[] not null default '{1,2,3,4,5,6}', -- ISO: 1=lunes … 7=domingo
  hora_apertura time not null default '09:30',
  hora_cierre time not null default '20:00',
  horario_texto text not null default 'Lunes a sábado, 9:30 a 20:00',
  duracion_default_min integer not null default 120 check (duracion_default_min > 0),
  margen_min integer not null default 20 check (margen_min >= 0),
  sena_monto integer not null default 50000 check (sena_monto >= 0),
  medios_pago_texto text not null default 'Efectivo y transferencia bancaria',
  -- Privado (finanzas)
  reserva_modo text not null default 'promedio_3m' check (reserva_modo in ('promedio_3m','porcentaje')),
  reserva_porcentaje numeric(5,2) not null default 15 check (reserva_porcentaje between 0 and 100),
  hora_push_diaria time not null default '18:00',
  actualizado_en timestamptz not null default now()
);
create trigger configuracion_tocar before update on public.configuracion
  for each row execute function public.tocar_actualizado();
alter table public.configuracion enable row level security;
create policy configuracion_lectura_publica on public.configuracion for select to anon, authenticated using (true);
create policy configuracion_admin on public.configuracion for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
-- Privilegios por columna: anon NO puede leer las columnas financieras.
revoke select on public.configuracion from anon;
grant select (id, nombre_negocio, whatsapp, instagram_url, tiktok_url, direccion, ciudad,
  google_maps_url, dias_atencion, hora_apertura, hora_cierre, horario_texto,
  duracion_default_min, margen_min, sena_monto, medios_pago_texto)
  on public.configuracion to anon;
-- Nota: sena_monto es público a propósito (la FAQ lo informa: "seña de 50.000 Gs").

-- -----------------------------------------------------------------------------
-- Contenido del sitio (clave → texto). Hero, sobre mí, textos sueltos.
-- -----------------------------------------------------------------------------
create table public.contenido_sitio (
  clave text primary key,
  valor text not null default '',
  actualizado_en timestamptz not null default now()
);
create trigger contenido_tocar before update on public.contenido_sitio
  for each row execute function public.tocar_actualizado();
alter table public.contenido_sitio enable row level security;
create policy contenido_publico on public.contenido_sitio for select to anon, authenticated using (true);
create policy contenido_admin on public.contenido_sitio for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create table public.faq (
  id uuid primary key default gen_random_uuid(),
  pregunta text not null,
  respuesta text not null,
  orden integer not null default 0,
  visible boolean not null default true
);
alter table public.faq enable row level security;
create policy faq_publico on public.faq for select to anon, authenticated using (visible or public.es_admin());
create policy faq_admin on public.faq for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create table public.plantillas_mensaje (
  clave text primary key,           -- agendar, agendar_general, ubicacion, curso, recordatorio
  descripcion text not null default '',
  texto text not null,
  publico boolean not null default true
);
alter table public.plantillas_mensaje enable row level security;
create policy plantillas_publico on public.plantillas_mensaje for select to anon, authenticated
  using (publico or public.es_admin());
create policy plantillas_admin on public.plantillas_mensaje for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- Catálogo público: categorías, servicios (SIN precio), fotos, cursos, testimonios
-- -----------------------------------------------------------------------------
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  orden integer not null default 0
);
alter table public.categorias enable row level security;
create policy categorias_publico on public.categorias for select to anon, authenticated using (true);
create policy categorias_admin on public.categorias for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create table public.servicios (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  categoria_id uuid not null references public.categorias(id),
  nombre text not null,
  descripcion text not null default '',
  beneficios text[] not null default '{}',
  duracion_resultado text,                 -- ej. "2 a 4 semanas aprox."
  duracion_min integer not null default 120 check (duracion_min > 0),  -- duración en agenda
  visible boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create trigger servicios_tocar before update on public.servicios
  for each row execute function public.tocar_actualizado();
alter table public.servicios enable row level security;
create policy servicios_publico on public.servicios for select to anon, authenticated using (visible or public.es_admin());
create policy servicios_admin on public.servicios for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Valor de referencia PRIVADO, en tabla aparte: así nunca viaja con el servicio público.
create table public.servicio_valores (
  servicio_id uuid primary key references public.servicios(id) on delete cascade,
  valor_referencia integer check (valor_referencia >= 0)
);
alter table public.servicio_valores enable row level security;
create policy servicio_valores_admin on public.servicio_valores for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create table public.servicio_fotos (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid not null references public.servicios(id) on delete cascade,
  url text not null,                       -- ruta pública (Storage o /public)
  storage_path text,                       -- para poder borrarla del bucket
  alt text not null default '',
  orden integer not null default 0
);
alter table public.servicio_fotos enable row level security;
create policy servicio_fotos_publico on public.servicio_fotos for select to anon, authenticated using (
  exists (select 1 from public.servicios s where s.id = servicio_id and (s.visible or public.es_admin()))
);
create policy servicio_fotos_admin on public.servicio_fotos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create table public.cursos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  descripcion text not null default '',
  incluye text[] not null default '{}',
  no_incluye text[] not null default '{}',
  modalidad text not null default 'Presencial',
  foto_url text,
  duracion_min integer not null default 120 check (duracion_min > 0),
  visible boolean not null default true,
  orden integer not null default 0
);
alter table public.cursos enable row level security;
create policy cursos_publico on public.cursos for select to anon, authenticated using (visible or public.es_admin());
create policy cursos_admin on public.cursos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create table public.testimonios (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'trabajo' check (tipo in ('trabajo','mensaje')), -- foto de trabajo o captura
  foto_url text not null,
  storage_path text,
  texto text,
  autora text,
  visible boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);
alter table public.testimonios enable row level security;
create policy testimonios_publico on public.testimonios for select to anon, authenticated using (visible or public.es_admin());
create policy testimonios_admin on public.testimonios for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- PRIVADO: clientas, citas, ingresos, gastos, insumos, push
-- -----------------------------------------------------------------------------
create table public.clientas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text not null unique check (telefono ~ '^595[0-9]{8,10}$'),
  notas text,
  creado_en timestamptz not null default now()
);
create index clientas_nombre_idx on public.clientas (lower(nombre));
alter table public.clientas enable row level security;
create policy clientas_admin on public.clientas for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create type public.estado_cita as enum ('pendiente_sena','confirmada','atendida','cancelada','no_asistio');

create table public.citas (
  id uuid primary key default gen_random_uuid(),
  clienta_id uuid not null references public.clientas(id),
  servicio_id uuid references public.servicios(id),
  curso_id uuid references public.cursos(id),
  inicio timestamptz not null,
  fin timestamptz not null,
  bloqueo_fin timestamptz not null,        -- fin + margen (lo calcula el trigger)
  estado public.estado_cita not null default 'pendiente_sena',
  sena_pagada boolean not null default false,
  sena_monto integer check (sena_monto >= 0),
  sena_fecha date,
  sena_medio text check (sena_medio in ('efectivo','transferencia')),
  monto_total integer check (monto_total >= 0),
  medio_pago text check (medio_pago in ('efectivo','transferencia')),
  recordatorio_enviado boolean not null default false,
  recordatorio_enviado_en timestamptz,
  notas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint cita_servicio_o_curso check ((servicio_id is null) <> (curso_id is null)),
  constraint cita_orden check (fin > inicio),
  -- Anti-choques a nivel base de datos: [inicio, fin + margen) no puede cruzarse
  -- con otra cita activa. Las canceladas / no asistió liberan el horario.
  constraint citas_sin_choques exclude using gist (
    tstzrange(inicio, bloqueo_fin, '[)') with &&
  ) where (estado in ('pendiente_sena','confirmada','atendida'))
);
create index citas_inicio_idx on public.citas (inicio);
create index citas_clienta_idx on public.citas (clienta_id);
create trigger citas_tocar before update on public.citas
  for each row execute function public.tocar_actualizado();
alter table public.citas enable row level security;
create policy citas_admin on public.citas for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Calcula fin / bloqueo_fin y valida horario de atención (en hora de Asunción).
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

  -- Solo se valida horario para citas activas.
  if new.estado in ('pendiente_sena','confirmada') then
    ini_local := new.inicio at time zone 'America/Asuncion';
    fin_local := new.fin at time zone 'America/Asuncion';
    if not (extract(isodow from ini_local)::smallint = any (cfg.dias_atencion)) then
      raise exception 'FUERA_DE_HORARIO: ese día el estudio no atiende' using errcode = 'P0001';
    end if;
    if ini_local::date <> fin_local::date
       or ini_local::time < cfg.hora_apertura
       or fin_local::time > cfg.hora_cierre then
      raise exception 'FUERA_DE_HORARIO: la cita debe estar entre % y %', cfg.hora_apertura, cfg.hora_cierre
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;

create trigger citas_validar before insert or update on public.citas
  for each row execute function public.citas_validar();

-- Ingresos: señas y saldos se generan automáticamente; también carga manual.
create table public.ingresos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default (now() at time zone 'America/Asuncion')::date,
  monto integer not null check (monto > 0),
  medio text not null check (medio in ('efectivo','transferencia')),
  tipo text not null default 'servicio' check (tipo in ('servicio','curso')),
  concepto text not null default 'manual' check (concepto in ('sena','saldo','manual')),
  cita_id uuid references public.citas(id) on delete set null,
  clienta_id uuid references public.clientas(id) on delete set null,
  nota text,
  creado_en timestamptz not null default now()
);
-- Una cita no puede tener dos señas ni dos saldos → evita contar doble.
create unique index ingresos_unico_por_cita on public.ingresos (cita_id, concepto)
  where cita_id is not null and concepto in ('sena','saldo');
create index ingresos_fecha_idx on public.ingresos (fecha);
alter table public.ingresos enable row level security;
create policy ingresos_admin on public.ingresos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create table public.categorias_gasto (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null,
  es_insumos boolean not null default false,
  orden integer not null default 0
);
alter table public.categorias_gasto enable row level security;
create policy categorias_gasto_admin on public.categorias_gasto for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create table public.insumos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  unidad text not null default 'unidad',
  stock_actual numeric(12,2) not null default 0,
  stock_minimo numeric(12,2) not null default 0,
  costo_ultima_compra integer check (costo_ultima_compra >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);
alter table public.insumos enable row level security;
create policy insumos_admin on public.insumos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default (now() at time zone 'America/Asuncion')::date,
  monto integer not null check (monto > 0),
  categoria_id uuid not null references public.categorias_gasto(id),
  medio text not null check (medio in ('efectivo','transferencia')),
  nota text,
  creado_en timestamptz not null default now()
);
create index gastos_fecha_idx on public.gastos (fecha);
alter table public.gastos enable row level security;
create policy gastos_admin on public.gastos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create table public.movimientos_insumo (
  id uuid primary key default gen_random_uuid(),
  insumo_id uuid not null references public.insumos(id) on delete cascade,
  tipo text not null check (tipo in ('compra','uso','ajuste')),
  cantidad numeric(12,2) not null,         -- positiva suma, negativa resta
  costo_total integer check (costo_total >= 0),
  gasto_id uuid references public.gastos(id) on delete set null,
  cita_id uuid references public.citas(id) on delete set null,
  fecha timestamptz not null default now(),
  nota text
);
create index movimientos_insumo_idx on public.movimientos_insumo (insumo_id, fecha desc);
alter table public.movimientos_insumo enable row level security;
create policy movimientos_insumo_admin on public.movimientos_insumo for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create table public.servicio_insumos (
  servicio_id uuid not null references public.servicios(id) on delete cascade,
  insumo_id uuid not null references public.insumos(id) on delete cascade,
  cantidad numeric(12,2) not null check (cantidad > 0),
  primary key (servicio_id, insumo_id)
);
alter table public.servicio_insumos enable row level security;
create policy servicio_insumos_admin on public.servicio_insumos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  creado_en timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy push_admin on public.push_subscriptions for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- Storage: bucket público "sitio" (fotos de servicios, hero, testimonios).
-- Lectura pública; escritura solo admin.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sitio', 'sitio', true, 3145728, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy sitio_lectura on storage.objects for select to anon, authenticated
  using (bucket_id = 'sitio');
create policy sitio_insert_admin on storage.objects for insert to authenticated
  with check (bucket_id = 'sitio' and public.es_admin());
create policy sitio_update_admin on storage.objects for update to authenticated
  using (bucket_id = 'sitio' and public.es_admin());
create policy sitio_delete_admin on storage.objects for delete to authenticated
  using (bucket_id = 'sitio' and public.es_admin());

-- Mantener activo el proyecto (lo llama el cron diario). No expone datos.
create or replace function public.ping() returns text
language sql stable as $$ select 'ok'::text $$;
grant execute on function public.ping() to anon, authenticated;
