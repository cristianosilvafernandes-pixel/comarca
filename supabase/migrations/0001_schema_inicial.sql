-- Comarca Honorários — schema inicial
-- Implementa docs/doc.md (§4 a §10) e o modelo de docs/spec.md §2.
-- Ordem conforme doc.md §14. Idempotente onde possível.

-- =====================================================================
-- 1. Extensões (§4)
-- =====================================================================
create extension if not exists pgcrypto;   -- gen_random_bytes / gen_random_uuid
create extension if not exists citext;      -- e-mail case-insensitive

-- =====================================================================
-- 2. Tabelas (§5) — ordem de dependência
-- =====================================================================

-- 2.1 profiles (estende auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  oab         text,
  chave_pix   text,
  foro        text,
  plano       text not null default 'free'
              check (plano in ('free','essencial','profissional')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2.2 clientes
create table public.clientes (
  id          uuid primary key default gen_random_uuid(),
  advogado_id uuid not null references public.profiles(id) on delete cascade,
  nome        text not null,
  cpf         text not null,
  whatsapp    text not null,
  email       citext,
  endereco    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.clientes (advogado_id);

-- 2.3 honorarios
create table public.honorarios (
  id                  uuid primary key default gen_random_uuid(),
  advogado_id         uuid not null references public.profiles(id) on delete cascade,
  cliente_id          uuid not null references public.clientes(id) on delete restrict,
  processo            text,
  area                text check (area in
    ('Trabalhista','Cível','Família','Criminal','Previdenciário','Tributário','Consumidor','Outro')),
  tribunal            text check (tribunal in
    ('TJRS','TJSP','TJRJ','TRF4','TST','STJ','Outro')),
  parte_contraria     text,
  tipo                text not null check (tipo in
    ('fixo_parcelado','ad_exitum','recorrente','fixo_exitum')),
  frequencia          text check (frequencia in ('Mensal','Quinzenal','Única')),
  valor_total         numeric(12,2),
  valor_causa         numeric(12,2),
  percentual_exito    numeric(5,2),
  valor_entrada       numeric(12,2),
  valor_mensal        numeric(12,2),
  data_inicio         date,
  data_fim            date,
  chave_pix           text,
  link_publico_token  text not null unique default encode(gen_random_bytes(16),'hex'),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on public.honorarios (advogado_id);
create index on public.honorarios (cliente_id);

-- 2.4 parcelas
create table public.parcelas (
  id                  uuid primary key default gen_random_uuid(),
  honorario_id        uuid not null references public.honorarios(id) on delete cascade,
  advogado_id         uuid not null references public.profiles(id) on delete cascade,
  numero              int not null,
  valor               numeric(12,2) not null,
  vencimento          date not null,
  status_registrado   text not null default 'em_aberto'
                      check (status_registrado in ('em_aberto','pago','pago_verificacao')),
  data_pagamento      date,
  origem_pagamento    text check (origem_pagamento in ('contratual','sucumbencial')),
  doc_pagador         text,
  confirmado_cliente  boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (honorario_id, numero)
);
create index on public.parcelas (advogado_id);
create index on public.parcelas (honorario_id);
create index on public.parcelas (vencimento);

-- 2.5 documentos
create table public.documentos (
  id              uuid primary key default gen_random_uuid(),
  advogado_id     uuid not null references public.profiles(id) on delete cascade,
  storage_path    text not null,
  status_extracao text not null default 'pendente'
                  check (status_extracao in ('pendente','processando','concluido','erro')),
  dados_extraidos jsonb,
  created_at      timestamptz not null default now()
);
create index on public.documentos (advogado_id);

-- 2.6 lembretes
create table public.lembretes (
  id          uuid primary key default gen_random_uuid(),
  advogado_id uuid not null references public.profiles(id) on delete cascade,
  parcela_id  uuid not null references public.parcelas(id) on delete cascade,
  canal       text not null default 'whatsapp',
  enviado_em  timestamptz not null default now()
);
create index on public.lembretes (advogado_id, enviado_em);

-- 2.7 status_efetivo (conveniência)
create or replace function public.status_efetivo(p public.parcelas)
returns text language sql immutable as $$
  select case
    when p.status_registrado = 'pago' then 'pago'
    when p.status_registrado = 'pago_verificacao' then 'pago_verificacao'
    when p.vencimento < current_date then 'atrasado'
    when p.vencimento - current_date between 0 and 2 then 'vencendo'
    else 'pendente'
  end;
$$;

-- =====================================================================
-- 3. Funções e Triggers (§6)
-- =====================================================================

-- 3.1 criar profile ao registrar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3.2 preencher advogado_id automaticamente
create or replace function public.set_advogado_id()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.advogado_id is null then
    new.advogado_id := auth.uid();
  end if;
  return new;
end;
$$;

create trigger set_advogado_id_clientes   before insert on public.clientes
  for each row execute function public.set_advogado_id();
create trigger set_advogado_id_honorarios before insert on public.honorarios
  for each row execute function public.set_advogado_id();
create trigger set_advogado_id_documentos before insert on public.documentos
  for each row execute function public.set_advogado_id();
create trigger set_advogado_id_lembretes  before insert on public.lembretes
  for each row execute function public.set_advogado_id();

-- parcelas: herdar advogado_id do honorário pai
create or replace function public.set_parcela_advogado_id()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.advogado_id is null then
    select advogado_id into new.advogado_id
    from public.honorarios where id = new.honorario_id;
  end if;
  return new;
end;
$$;

create trigger set_advogado_id_parcelas before insert on public.parcelas
  for each row execute function public.set_parcela_advogado_id();

-- 3.3 updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

create trigger t_updated_at_profiles   before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger t_updated_at_clientes   before update on public.clientes
  for each row execute function public.set_updated_at();
create trigger t_updated_at_honorarios before update on public.honorarios
  for each row execute function public.set_updated_at();
create trigger t_updated_at_parcelas   before update on public.parcelas
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 4. RLS — habilitar + policies (§7)
-- =====================================================================
alter table public.profiles   enable row level security;
alter table public.clientes   enable row level security;
alter table public.honorarios enable row level security;
alter table public.parcelas   enable row level security;
alter table public.documentos enable row level security;
alter table public.lembretes  enable row level security;

-- 4.1 profiles (dono = próprio usuário)
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- 4.2 clientes
create policy "clientes_select_own" on public.clientes
  for select using (advogado_id = auth.uid());
create policy "clientes_insert_own" on public.clientes
  for insert with check (advogado_id = auth.uid());
create policy "clientes_update_own" on public.clientes
  for update using (advogado_id = auth.uid()) with check (advogado_id = auth.uid());
create policy "clientes_delete_own" on public.clientes
  for delete using (advogado_id = auth.uid());

-- 4.3 honorarios
create policy "honorarios_select_own" on public.honorarios
  for select using (advogado_id = auth.uid());
create policy "honorarios_insert_own" on public.honorarios
  for insert with check (advogado_id = auth.uid());
create policy "honorarios_update_own" on public.honorarios
  for update using (advogado_id = auth.uid()) with check (advogado_id = auth.uid());
create policy "honorarios_delete_own" on public.honorarios
  for delete using (advogado_id = auth.uid());

-- 4.4 parcelas
create policy "parcelas_select_own" on public.parcelas
  for select using (advogado_id = auth.uid());
create policy "parcelas_insert_own" on public.parcelas
  for insert with check (advogado_id = auth.uid());
create policy "parcelas_update_own" on public.parcelas
  for update using (advogado_id = auth.uid()) with check (advogado_id = auth.uid());
create policy "parcelas_delete_own" on public.parcelas
  for delete using (advogado_id = auth.uid());

-- 4.5 documentos
create policy "documentos_select_own" on public.documentos
  for select using (advogado_id = auth.uid());
create policy "documentos_insert_own" on public.documentos
  for insert with check (advogado_id = auth.uid());
create policy "documentos_update_own" on public.documentos
  for update using (advogado_id = auth.uid()) with check (advogado_id = auth.uid());
create policy "documentos_delete_own" on public.documentos
  for delete using (advogado_id = auth.uid());

-- 4.6 lembretes
create policy "lembretes_select_own" on public.lembretes
  for select using (advogado_id = auth.uid());
create policy "lembretes_insert_own" on public.lembretes
  for insert with check (advogado_id = auth.uid());
create policy "lembretes_update_own" on public.lembretes
  for update using (advogado_id = auth.uid()) with check (advogado_id = auth.uid());
create policy "lembretes_delete_own" on public.lembretes
  for delete using (advogado_id = auth.uid());

-- =====================================================================
-- 5. Limites de plano (§10) — clientes (replicar p/ honorarios/lembretes depois)
-- =====================================================================
create or replace function public.check_limite_clientes()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  plano_atual text;
  total int;
  limite int;
begin
  select plano into plano_atual from public.profiles where id = new.advogado_id;
  select count(*) into total from public.clientes where advogado_id = new.advogado_id;
  limite := case plano_atual
              when 'free' then 3
              when 'essencial' then 10
              else 2147483647 end;
  if total >= limite then
    raise exception 'Limite de clientes do plano % atingido (%).', plano_atual, limite
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger trg_limite_clientes before insert on public.clientes
  for each row execute function public.check_limite_clientes();
