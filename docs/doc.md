# Supabase — Guia de Banco de Dados Funcional e Seguro

> Tudo que precisa ser feito no Supabase para um banco funcional, isolado por usuário e seguro.
> Versão 1.0 · Junho/2026 · Implementa o modelo de [spec.md](spec.md) · Acompanha [inventario-funcionalidades.md](inventario-funcionalidades.md)
>
> **Esta é documentação.** Nenhum recurso é provisionado agora. Os blocos SQL e os passos abaixo são a referência para a Fase 1 do [roadmap.md](roadmap.md) (tasks T-107..T-112).

---

## 0. Princípios de segurança (não-negociáveis)

1. **RLS ligado em toda tabela de domínio.** Sem exceção. Tabela sem policy = tabela inacessível.
2. **Isolamento por advogado:** todo acesso autenticado filtra por `advogado_id = auth.uid()`.
3. **Página pública nunca toca as tabelas com a chave `anon`.** Acesso só via Edge Function com `service_role`, validando o token e retornando o mínimo.
4. **Nenhum segredo no cliente** além da `anon key` (que é pública por design). `service_role` só em Edge Functions / servidor.
5. **Token público opaco** (128 bits), sem informação derivável, único e indexado.
6. **Storage privado**; download só por URL assinada de curta duração.
7. **Limites de plano validados no servidor** (trigger/policy), nunca só no frontend.

---

## 1. O que será provisionado

| Recurso | Itens |
|---|---|
| **Auth** | E-mail/senha, confirmação de e-mail, trigger de criação de perfil |
| **Extensões** | `pgcrypto` (geração de token), `citext` (e-mails) |
| **Tabelas** | `profiles`, `clientes`, `honorarios`, `parcelas`, `documentos`, `lembretes` |
| **RLS** | Policies por tabela (`select/insert/update/delete`) |
| **Funções/Triggers** | `handle_new_user`, `set_advogado_id`, `set_updated_at`, `gen_link_token`, contadores de limite |
| **Storage** | Bucket privado `documentos` |
| **Edge Functions** | `public-honorario`, `public-confirmar`, `extrair-documento` |
| **Ambientes** | Projeto `dev` e projeto `prod` (ou branches do Supabase) |

---

## 2. Ambientes e fluxo

- **Dois projetos Supabase:** `comarca-dev` e `comarca-prod` (ou usar Supabase Branching para previews por PR).
- **Migrações versionadas** no repositório (`supabase/migrations/*.sql`) via Supabase CLI — nunca alterar o schema pela UI em produção.
- Ordem: aplicar local → dev → prod. Testar RLS em dev antes de promover.
- `supabase db diff` / `supabase migration new` para gerar migrações; `supabase db push` para aplicar.

---

## 3. Configuração de Auth

No painel **Authentication → Providers / Settings**:

- Habilitar **Email** (senha). Desabilitar provedores não usados.
- **Confirm email: ON** (exige verificação antes do primeiro login).
- **Secure email change: ON**; **Secure password change: ON**.
- Definir **Site URL** e **Redirect URLs** para os domínios da Vercel (prod + previews).
- Política de senha: mínimo 8 caracteres; ativar proteção contra senha vazada (**Leaked password protection: ON**).
- JWT expiry padrão; refresh token rotation **ON**.
- (Opcional) limitar `signups` se o cadastro for por convite.

---

## 4. Extensões

```sql
create extension if not exists pgcrypto;   -- gen_random_bytes / gen_random_uuid
create extension if not exists citext;     -- e-mail case-insensitive
```

---

## 5. Schema (DDL)

> Convenções: PK `uuid`, `snake_case`, dinheiro `numeric(12,2)`, timestamps `timestamptz`. `advogado_id` em toda tabela de domínio para RLS.

### 5.1. `profiles` (estende `auth.users`)

```sql
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  oab         text,
  chave_pix   text,
  foro        text,                         -- ex.: "Pelotas/RS" (usado no contrato)
  plano       text not null default 'free'
              check (plano in ('free','essencial','profissional')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

### 5.2. `clientes`

```sql
create table public.clientes (
  id          uuid primary key default gen_random_uuid(),
  advogado_id uuid not null references public.profiles(id) on delete cascade,
  nome        text not null,
  cpf         text not null,
  whatsapp    text not null,                -- normalizado E.164 (ex.: +5553991234567)
  email       citext,
  endereco    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.clientes (advogado_id);
```

### 5.3. `honorarios`

```sql
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
  valor_resultado     numeric(12,2),        -- valor obtido na causa (ao registrar êxito)
  data_exito          date,                 -- data do êxito/acordo
  encerrado_sem_exito boolean not null default false,
  chave_pix           text,                 -- default = profiles.chave_pix
  link_publico_token  text not null unique default encode(gen_random_bytes(16),'hex'),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on public.honorarios (advogado_id);
create index on public.honorarios (cliente_id);
create unique index on public.honorarios (link_publico_token);
```

> `gen_random_bytes(16)` = 128 bits → token hex de 32 caracteres, não-adivinhável.

### 5.4. `parcelas`

```sql
create table public.parcelas (
  id                  uuid primary key default gen_random_uuid(),
  honorario_id        uuid not null references public.honorarios(id) on delete cascade,
  advogado_id         uuid not null references public.profiles(id) on delete cascade, -- desnormalizado p/ RLS
  numero              int not null,
  valor               numeric(12,2) not null,
  vencimento          date not null,
  status_registrado   text not null default 'em_aberto'
                      check (status_registrado in ('em_aberto','pago','pago_verificacao')),
  data_pagamento      date,
  origem_pagamento    text check (origem_pagamento in ('contratual','sucumbencial')),
  doc_pagador         text,                 -- CPF/CNPJ do pagador (só quando sucumbencial)
  confirmado_cliente  boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (honorario_id, numero)
);
create index on public.parcelas (advogado_id);
create index on public.parcelas (honorario_id);
create index on public.parcelas (vencimento);
```

> **Status efetivo** (`pendente`/`vencendo`/`atrasado`) é derivado em consulta/aplicação a partir de `status_registrado` + `vencimento`. Não é coluna. Ver §5.7 para uma função opcional.

### 5.5. `documentos`

```sql
create table public.documentos (
  id              uuid primary key default gen_random_uuid(),
  advogado_id     uuid not null references public.profiles(id) on delete cascade,
  storage_path    text not null,
  status_extracao text not null default 'pendente'
                  check (status_extracao in ('pendente','processando','concluido','erro')),
  dados_extraidos jsonb,                    -- { nome, cpf, whatsapp, email, endereco }
  created_at      timestamptz not null default now()
);
create index on public.documentos (advogado_id);
```

### 5.6. `lembretes`

```sql
create table public.lembretes (
  id          uuid primary key default gen_random_uuid(),
  advogado_id uuid not null references public.profiles(id) on delete cascade,
  parcela_id  uuid not null references public.parcelas(id) on delete cascade,
  canal       text not null default 'whatsapp',
  enviado_em  timestamptz not null default now()
);
create index on public.lembretes (advogado_id, enviado_em);
```

### 5.7. Função de status efetivo (opcional, conveniência)

```sql
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
```

---

## 6. Funções e Triggers

### 6.1. Criar `profiles` ao registrar usuário

```sql
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
```

### 6.2. Preencher `advogado_id` automaticamente (defesa em profundidade)

```sql
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
```

> Para `parcelas`, herdar `advogado_id` do honorário pai (insira já preenchido pela aplicação, ou trigger que faz lookup).

### 6.3. `updated_at` automático

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

-- repetir para cada tabela com updated_at:
create trigger t_updated_at_profiles  before update on public.profiles
  for each row execute function public.set_updated_at();
-- ... clientes, honorarios, parcelas
```

---

## 7. RLS — habilitar e policies

### 7.1. Habilitar RLS em todas as tabelas

```sql
alter table public.profiles   enable row level security;
alter table public.clientes   enable row level security;
alter table public.honorarios enable row level security;
alter table public.parcelas   enable row level security;
alter table public.documentos enable row level security;
alter table public.lembretes  enable row level security;
```

### 7.2. `profiles` (o dono é o próprio usuário)

```sql
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
-- insert é feito pelo trigger (security definer); não criar policy de insert para o usuário.
```

### 7.3. Tabelas de domínio — padrão (aplicar a `clientes`, `honorarios`, `parcelas`, `documentos`, `lembretes`)

```sql
-- Exemplo para clientes; replicar trocando o nome da tabela.
create policy "clientes_select_own" on public.clientes
  for select using (advogado_id = auth.uid());
create policy "clientes_insert_own" on public.clientes
  for insert with check (advogado_id = auth.uid());
create policy "clientes_update_own" on public.clientes
  for update using (advogado_id = auth.uid()) with check (advogado_id = auth.uid());
create policy "clientes_delete_own" on public.clientes
  for delete using (advogado_id = auth.uid());
```

> Repetir os 4 blocos para `honorarios`, `parcelas`, `documentos`, `lembretes`. Como `parcelas` carrega `advogado_id`, a policy é direta e performática.

### 7.4. Impedir exclusão de cliente com honorários

A FK `honorarios.cliente_id ... on delete restrict` (§5.3) já bloqueia no banco. A aplicação deve tratar o erro e pedir confirmação/realocação (INV-… / spec F2).

---

## 8. Storage

No painel **Storage** ou via SQL:

- Criar bucket **`documentos`** com **public = false**.
- Estrutura de chave: `documentos/{advogado_id}/{documento_id}.{ext}`.
- Policies de Storage (tabela `storage.objects`):

```sql
create policy "doc_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documentos'
              and (storage.foldername(name))[1] = auth.uid()::text);

create policy "doc_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'documentos'
         and (storage.foldername(name))[1] = auth.uid()::text);

create policy "doc_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documentos'
         and (storage.foldername(name))[1] = auth.uid()::text);
```

- Downloads via **URL assinada** (`createSignedUrl`) com expiração curta (ex.: 60 s). Nunca expor URL pública.

---

## 9. Edge Functions

> Implementadas em Deno (TypeScript), deployadas via `supabase functions deploy`. As 3 funções abaixo cobrem o que a `anon key` não deve fazer diretamente.

### 9.1. `public-honorario` (GET — página pública, sem login)

- Entrada: `token` (do path `/h/:token`).
- Usa `service_role` (segredo só no servidor) para buscar o honorário pelo `link_publico_token` e a **parcela em aberto mais próxima**.
- Retorna **somente**: nome do advogado + OAB, nome do cliente, processo, parcela `n/total`, valor, vencimento, chave PIX, status efetivo. **Nada além disso.**
- Token inválido → 404 genérico ("lembrete não encontrado").
- Rate-limit por IP/token.

### 9.2. `public-confirmar` (POST — confirmação do cliente)

- Entrada: `token` + `numero_parcela`.
- Valida o token, marca a parcela como `pago_verificacao` + `confirmado_cliente = true`.
- Idempotente: se já está pago/em verificação, não regride.
- (Opcional) notifica o advogado.

### 9.3. `extrair-documento` (POST — OCR/IA)

- Entrada: `storage_path` (autenticada — recebe o JWT do advogado).
- Gera URL assinada, envia ao provedor de OCR/IA, grava `dados_extraidos` em `documentos` (campos: nome, cpf, whatsapp, email, endereco) e atualiza `status_extracao`.
- Trata erro/timeout → `status_extracao = 'erro'`.

**Segredos das Edge Functions** (via `supabase secrets set`): `SUPABASE_SERVICE_ROLE_KEY`, `OCR_API_KEY`. Nunca no cliente.

---

## 10. Limites de plano (enforcement no servidor)

Validar no banco, não só na UI. Exemplo para clientes (replicar a lógica para honorários ativos e lembretes/mês):

```sql
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
              else 2147483647 end;       -- profissional = ilimitado
  if total >= limite then
    raise exception 'Limite de clientes do plano % atingido (%).', plano_atual, limite
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger trg_limite_clientes before insert on public.clientes
  for each row execute function public.check_limite_clientes();
```

> Limites: free 3/5/10 · essencial 10/20/50 · profissional ilimitado (clientes / honorários ativos / lembretes mês). Lembretes/mês: contar `lembretes` do advogado no mês corrente antes de inserir.

---

## 11. LGPD — exclusão de dados

- **Excluir cliente:** bloqueado se houver honorários (FK restrict); após realocação/encerramento, `delete` remove o cliente.
- **Excluir conta:** `delete from auth.users where id = auth.uid()` cascateia para `profiles` → `clientes` → `honorarios` → `parcelas`/`lembretes`/`documentos` (todas as FKs com `on delete cascade`). Implementar via Edge Function autenticada que também apaga objetos do Storage do usuário.
- Documentar retenção e finalidade dos dados pessoais (CPF, contato) na política de privacidade (task T-605).

---

## 12. Verificação de segurança (antes de ir a prod)

- [ ] RLS **enabled** em `profiles`, `clientes`, `honorarios`, `parcelas`, `documentos`, `lembretes`.
- [ ] Toda tabela de domínio tem as 4 policies (select/insert/update/delete) com `advogado_id = auth.uid()`.
- [ ] Nenhuma policy usa `using (true)` em tabela de domínio.
- [ ] Bucket `documentos` é privado; policies por pasta do usuário; downloads só por URL assinada.
- [ ] `service_role` não aparece no frontend nem no repositório; só em Edge Functions/CI secrets.
- [ ] Página pública não acessa tabelas com `anon`; só via `public-honorario`/`public-confirmar`.
- [ ] `link_publico_token` é 128 bits, único, indexado.
- [ ] Funções `security definer` têm `set search_path = ''`.
- [ ] Limites de plano validados por trigger no servidor.
- [ ] Rodar **Supabase Advisors** (Security + Performance) e resolver todos os alertas.
- [ ] Auth: confirmação de e-mail ON, leaked password protection ON, redirect URLs restritas.
- [ ] Backups/PITR habilitados no projeto de produção.

---

## 13. Variáveis de ambiente

| Variável | Onde | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend (Vercel) | pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend (Vercel) | pública por design (RLS protege) |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions / CI | **secreta** — nunca no cliente |
| `OCR_API_KEY` | Edge Function `extrair-documento` | **secreta** |
| `SUPABASE_DB_URL` | CI (migrações) | **secreta** |

---

## 14. Ordem de aplicação das migrações

1. Extensões (§4).
2. Tabelas na ordem de dependência: `profiles` → `clientes` → `honorarios` → `parcelas` → `documentos` → `lembretes`.
3. Funções e triggers (§6).
4. Habilitar RLS + policies (§7).
5. Storage bucket + policies (§8).
6. Funções de limite (§10).
7. Deploy das Edge Functions (§9) + secrets.
8. Rodar Advisors e o checklist (§12).

---

## 15. Mapeamento com a documentação

| Tabela/recurso | Funcionalidades (inventário) | Spec |
|---|---|---|
| `profiles` | INV-011..014 | F1 |
| `clientes` + Storage + `documentos` | INV-021..027 | F2, F11 |
| `honorarios` | INV-031..042 | F3/F4 |
| `parcelas` + `status_efetivo` | INV-051..052, INV-061..066, INV-081..084 | F4/F5/F7 |
| `lembretes` | INV-071..074 | F6 |
| Edge `public-*` + `link_publico_token` | INV-091..096 | F8 |
| Consultas IR | INV-111..116 | F10 |
| Triggers de limite | INV-135 (planos) | F12 |

> Tudo aqui é planejamento. A execução segue as tasks T-107..T-112 (Fase 1) e as tasks de backend das fases seguintes em [tasks.md](tasks.md).
