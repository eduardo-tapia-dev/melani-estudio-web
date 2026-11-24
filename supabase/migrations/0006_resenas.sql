-- =============================================================================
-- Reseñas de clientas: estrellas 1–5, comentario y hasta 3 fotos.
-- Se publican solo cuando Melani las aprueba (moderación): evita spam, contenido
-- inapropiado y que aparezcan precios en el sitio público.
-- Las visitas NO pueden escribir en la tabla: todo pasa por crear_resena()
-- (SECURITY DEFINER) que valida y limita la cantidad por hora.
-- =============================================================================

create table if not exists public.resenas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 2 and 60),
  estrellas smallint not null check (estrellas between 1 and 5),
  comentario text not null check (char_length(comentario) between 5 and 800),
  servicio_id uuid references public.servicios(id) on delete set null,
  fotos text[] not null default '{}' check (cardinality(fotos) <= 3),
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  creado_en timestamptz not null default now(),
  publicado_en timestamptz
);
create index if not exists resenas_estado_idx on public.resenas (estado, creado_en desc);
alter table public.resenas enable row level security;

-- Público: solo aprobadas (y sin columnas internas).
drop policy if exists resenas_publicas on public.resenas;
create policy resenas_publicas on public.resenas for select to anon, authenticated
  using (estado = 'aprobada' or public.es_admin());
drop policy if exists resenas_admin on public.resenas;
create policy resenas_admin on public.resenas for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
revoke all on public.resenas from anon;
grant select (id, nombre, estrellas, comentario, servicio_id, fotos, publicado_en) on public.resenas to anon;

-- -----------------------------------------------------------------------------
-- Bucket de fotos de reseñas. Las visitas solo pueden SUBIR a pendientes/,
-- con un cupo global (por hora y total) para que nadie llene el 1 GB gratis.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resenas', 'resenas', true, 2097152, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/webp','image/jpeg','image/png'];

create or replace function public.resenas_cupo_subida() returns boolean
language sql stable security definer set search_path = public, storage as $$
  select
    (select count(*) from storage.objects
      where bucket_id = 'resenas' and name like 'pendientes/%' and created_at > now() - interval '1 hour') < 30
    and
    (select count(*) from storage.objects
      where bucket_id = 'resenas' and name like 'pendientes/%') < 150;
$$;
revoke all on function public.resenas_cupo_subida() from public;
grant execute on function public.resenas_cupo_subida() to anon, authenticated;

drop policy if exists resenas_subir on storage.objects;
create policy resenas_subir on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'resenas'
    and name ~ '^pendientes/[0-9a-f-]{36}\.(webp|jpg|png)$'
    and public.resenas_cupo_subida()
  );
drop policy if exists resenas_admin_storage on storage.objects;
create policy resenas_admin_storage on storage.objects for all to authenticated
  using (bucket_id = 'resenas' and public.es_admin())
  with check (bucket_id = 'resenas' and public.es_admin());

-- -----------------------------------------------------------------------------
-- Crear reseña (la llama el formulario público).
-- -----------------------------------------------------------------------------
create or replace function public.crear_resena(
  p_nombre text, p_estrellas integer, p_comentario text, p_servicio uuid default null, p_fotos text[] default '{}'
) returns void
language plpgsql security definer set search_path = public, storage as $$
declare
  v_fotos text[] := coalesce(p_fotos, '{}');
  f text;
begin
  if (select count(*) from public.resenas where creado_en > now() - interval '1 hour') >= 15
     or (select count(*) from public.resenas where estado = 'pendiente') >= 60 then
    raise exception 'DEMASIADAS: recibimos muchas reseñas en poco tiempo, probá de nuevo más tarde' using errcode = 'P0001';
  end if;
  if p_estrellas is null or p_estrellas not between 1 and 5 then
    raise exception 'ESTRELLAS: elegí de 1 a 5 estrellas' using errcode = 'P0001';
  end if;
  if char_length(trim(coalesce(p_nombre, ''))) not between 2 and 60 then
    raise exception 'NOMBRE: escribí tu nombre' using errcode = 'P0001';
  end if;
  if char_length(trim(coalesce(p_comentario, ''))) not between 5 and 800 then
    raise exception 'COMENTARIO: el comentario debe tener entre 5 y 800 caracteres' using errcode = 'P0001';
  end if;
  if cardinality(v_fotos) > 3 then
    raise exception 'FOTOS: máximo 3 fotos' using errcode = 'P0001';
  end if;
  foreach f in array v_fotos loop
    if f !~ '^pendientes/[0-9a-f-]{36}\.(webp|jpg|png)$'
       or not exists (select 1 from storage.objects where bucket_id = 'resenas' and name = f)
       or exists (select 1 from public.resenas where f = any(fotos)) then
      raise exception 'FOTOS: una de las fotos no es válida' using errcode = 'P0001';
    end if;
  end loop;
  if p_servicio is not null and not exists (select 1 from public.servicios where id = p_servicio and visible) then
    p_servicio := null;
  end if;

  insert into public.resenas (nombre, estrellas, comentario, servicio_id, fotos)
  values (trim(p_nombre), p_estrellas, trim(p_comentario), p_servicio, v_fotos);
end $$;
revoke all on function public.crear_resena(text, integer, text, uuid, text[]) from public;
grant execute on function public.crear_resena(text, integer, text, uuid, text[]) to anon, authenticated;
