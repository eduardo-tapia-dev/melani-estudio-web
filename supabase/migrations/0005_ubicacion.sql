-- Ubicación exacta del estudio para el mapa del sitio (dato público, como la dirección).
alter table public.configuracion
  add column if not exists ubicacion_lat double precision check (ubicacion_lat between -90 and 90),
  add column if not exists ubicacion_lng double precision check (ubicacion_lng between -180 and 180);
grant select (ubicacion_lat, ubicacion_lng) on public.configuracion to anon;

update public.configuracion
   set google_maps_url = 'https://maps.app.goo.gl/sASiNcjKPcBhVt4c8',
       ubicacion_lat = -25.306329,
       ubicacion_lng = -57.5124975
 where id = 1;
