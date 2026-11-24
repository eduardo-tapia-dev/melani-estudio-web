-- Fotos del estudio (el salón) para la sección "El estudio" del sitio.
-- La sección se oculta sola mientras no haya fotos visibles.
create table if not exists public.estudio_fotos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  storage_path text,
  descripcion text,
  orden integer not null default 0,
  visible boolean not null default true,
  creado_en timestamptz not null default now()
);
alter table public.estudio_fotos enable row level security;
drop policy if exists estudio_fotos_publico on public.estudio_fotos;
create policy estudio_fotos_publico on public.estudio_fotos for select to anon, authenticated
  using (visible or public.es_admin());
drop policy if exists estudio_fotos_admin on public.estudio_fotos;
create policy estudio_fotos_admin on public.estudio_fotos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

insert into public.contenido_sitio (clave, valor) values
  ('estudio_titulo', 'Tu momento, en un espacio pensado para vos'),
  ('estudio_texto', 'Un ambiente tranquilo, cómodo y prolijo, donde cada detalle está cuidado para que disfrutes tu momento.')
on conflict (clave) do nothing;
