-- Ejecutar una vez en el SQL editor de Supabase.
-- Permite recuperar la clave solo si el mail ya es una cuenta interna,
-- sin mostrar el listado de usuarios a quien no inició sesión.

create or replace function correo_interno_existe(correo text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from perfiles
    where lower(email) = lower(trim(correo))
  );
$$;

revoke all on function correo_interno_existe(text) from public;
grant execute on function correo_interno_existe(text) to anon, authenticated;
