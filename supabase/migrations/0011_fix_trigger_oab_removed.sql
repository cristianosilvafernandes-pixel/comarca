-- 0009 removeu oab de profiles mas handle_new_profile_advogado ainda referenciava new.oab
create or replace function public.handle_new_profile_advogado()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.advogados (user_id, nome)
  values (new.id, new.nome);
  return new;
end;
$$;
revoke execute on function public.handle_new_profile_advogado()
  from public, anon, authenticated;
