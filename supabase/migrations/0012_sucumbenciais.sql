-- Comarca Honorários — honorários sucumbenciais como entidade própria
-- Registra valores recebidos da parte contrária (condenação em honorários).
-- RLS: cada advogado vê só seus próprios registros (advogado_id = auth.uid()).

create table public.sucumbenciais (
  id                   uuid primary key default gen_random_uuid(),
  honorario_id         uuid not null references public.honorarios(id) on delete cascade,
  advogado_id          uuid not null references auth.users(id),
  valor                numeric(12,2) not null check (valor > 0),
  doc_adversario       text not null,          -- CPF ou CNPJ (só dígitos)
  status               text not null default 'aguardando'
                         check (status in ('aguardando', 'recebido')),
  data_recebimento     date,
  divisao_parceiro_id  uuid references public.advogados(id) on delete set null,
  divisao_parceiro_pct numeric(5,2)
                         check (divisao_parceiro_pct is null
                             or (divisao_parceiro_pct >= 0 and divisao_parceiro_pct <= 100)),
  created_at           timestamptz not null default now()
);

create index on public.sucumbenciais (honorario_id);
create index on public.sucumbenciais (advogado_id);

-- Trigger: define advogado_id = auth.uid() antes de cada insert.
create function public.set_advogado_id_sucumbenciais()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.advogado_id := auth.uid();
  return new;
end;
$$;
revoke execute on function public.set_advogado_id_sucumbenciais()
  from public, anon, authenticated;

create trigger set_advogado_id_sucumbenciais
  before insert on public.sucumbenciais
  for each row execute procedure public.set_advogado_id_sucumbenciais();

-- RLS
alter table public.sucumbenciais enable row level security;

create policy "own_sucumbenciais_select"
  on public.sucumbenciais for select
  using (advogado_id = auth.uid());

create policy "own_sucumbenciais_insert"
  on public.sucumbenciais for insert
  with check (advogado_id = auth.uid());

create policy "own_sucumbenciais_update"
  on public.sucumbenciais for update
  using (advogado_id = auth.uid());

create policy "own_sucumbenciais_delete"
  on public.sucumbenciais for delete
  using (advogado_id = auth.uid());
