-- Comarca Honorários — multi-advogado (sub-perfis por escritório)

-- 1. Tabela advogados
create table public.advogados (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  nome        text        not null,
  oab         text,
  ativo       boolean     not null default true,
  created_at  timestamptz not null default now()
);
create index on public.advogados (user_id);
alter table public.advogados enable row level security;

-- Separate policies by operation
create policy "advogados_select_own" on public.advogados
  for select using ((select auth.uid()) = user_id);
create policy "advogados_insert_own" on public.advogados
  for insert with check ((select auth.uid()) = user_id);
create policy "advogados_update_own" on public.advogados
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "advogados_delete_own" on public.advogados
  for delete using ((select auth.uid()) = user_id);

-- 2. membro_id em honorarios
alter table public.honorarios
  add column membro_id uuid references public.advogados(id) on delete set null;
create index on public.honorarios (membro_id);

-- 3. membro_id em clientes
alter table public.clientes
  add column membro_id uuid references public.advogados(id) on delete set null;
create index on public.clientes (membro_id);

-- 4. Seed: criar um advogado por profile existente (idempotent sem unique constraint)
insert into public.advogados (user_id, nome, oab)
select p.id, p.nome, p.oab
from public.profiles p
where not exists (
  select 1 from public.advogados a where a.user_id = p.id
);

-- 5. Atualizar honorarios existentes → membro_id do seed
update public.honorarios h
set membro_id = (
  select a.id from public.advogados a
  where a.user_id = h.advogado_id
  limit 1
);

-- 6. Atualizar clientes existentes → membro_id do seed
update public.clientes c
set membro_id = (
  select a.id from public.advogados a
  where a.user_id = c.advogado_id
  limit 1
);

-- 7. Trigger: auto-criar advogado quando novo profile é criado
create or replace function public.handle_new_profile_advogado()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.advogados (user_id, nome, oab)
  values (new.id, new.nome, new.oab);
  return new;
end;
$$;
revoke execute on function public.handle_new_profile_advogado()
  from public, anon, authenticated;

create trigger on_profile_created_advogado
  after insert on public.profiles
  for each row execute function public.handle_new_profile_advogado();
