# Multi-Advogado (Opção A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que um escritório cadastre múltiplos advogados como sub-perfis, vinculando honorários e clientes a cada advogado com visão filtrada por advogado.

**Architecture:** Nova tabela `advogados` (sub-perfis por conta, FK → `profiles`) + coluna `membro_id` em `honorarios` e `clientes`. Seed migra dados existentes. Filtro por URL param `adv=<id>` nas páginas. CRUD em `/equipe`. Sem login separado — RLS continua por `advogado_id = auth.uid()`.

**Tech Stack:** Supabase (PostgreSQL + RLS), Next.js 16 App Router (server components + server actions), TypeScript strict, `searchParams: Promise<>` pattern, `useActionState` para formulários.

---

## File Map

**Criar:**
- `supabase/migrations/0006_advogados.sql`
- `src/app/(app)/equipe/page.tsx`
- `src/app/(app)/equipe/actions.ts`
- `src/app/(app)/equipe/AdvogadoForm.tsx`
- `src/app/(app)/equipe/novo/page.tsx`
- `src/app/(app)/equipe/[id]/editar/page.tsx`

**Modificar:**
- `src/lib/database.types.ts` — adicionar tabela `advogados` + colunas `membro_id`
- `src/components/Sidebar.tsx` — link "Equipe"
- `src/app/(app)/dashboard/page.tsx` — carregar advogados reais, filtrar por `adv`
- `src/app/(app)/dashboard/DashboardFilters.tsx` — props reais de advogados + URL `adv`
- `src/app/(app)/honorarios/page.tsx` — filtrar por `adv` URL param
- `src/app/(app)/honorarios/novo/page.tsx` — carregar advogados e passar ao form
- `src/app/(app)/honorarios/HonorarioForm.tsx` — select "Advogado responsável"
- `src/app/(app)/honorarios/actions.ts` — incluir `membro_id` no insert
- `src/app/(app)/clientes/page.tsx` — filtrar por `adv` URL param
- `src/app/(app)/clientes/novo/page.tsx` — carregar advogados e passar ao form
- `src/app/(app)/clientes/[id]/editar/page.tsx` — carregar advogados e passar ao form
- `src/app/(app)/clientes/ClienteForm.tsx` — select "Advogado responsável"
- `src/app/(app)/clientes/actions.ts` — incluir `membro_id` no saveCliente

---

## Task 1: Migration — tabela advogados + membro_id + seed

**Files:**
- Create: `supabase/migrations/0006_advogados.sql`

- [ ] **Step 1: Escrever o arquivo de migration**

```sql
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

-- Dono do escritório acessa todos os membros
create policy "advogados_all" on public.advogados
  for all using ((select auth.uid()) = user_id);

-- 2. membro_id em honorarios
alter table public.honorarios
  add column membro_id uuid references public.advogados(id) on delete set null;
create index on public.honorarios (membro_id);

-- 3. membro_id em clientes
alter table public.clientes
  add column membro_id uuid references public.advogados(id) on delete set null;
create index on public.clientes (membro_id);

-- 4. Seed: criar um advogado por profile existente
insert into public.advogados (user_id, nome, oab)
select id, nome, oab
from public.profiles;

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
```

- [ ] **Step 2: Aplicar migration no Supabase**

```bash
# Se tiver Supabase CLI configurado:
pnpm supabase db push

# OU: colar o SQL acima direto no SQL Editor do painel Supabase (supabase.com)
# Projeto: enhiukvvxpzudujctljk
```

- [ ] **Step 3: Verificar no painel Supabase que a tabela `advogados` foi criada e que `honorarios`/`clientes` têm a coluna `membro_id`**

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0006_advogados.sql
git commit -m "feat(db): add advogados table + membro_id FK for multi-lawyer support"
```

---

## Task 2: Atualizar database.types.ts

**Files:**
- Modify: `src/lib/database.types.ts`

> Execução: adicionar manualmente os tipos abaixo ou rodar `pnpm supabase gen types typescript --project-id enhiukvvxpzudujctljk > src/lib/database.types.ts` se o CLI estiver configurado.

- [ ] **Step 1: Adicionar tipo Advogado e exportar**

No arquivo `src/lib/database.types.ts`, dentro do bloco `Tables:`, adicionar após a entrada `documents` (ou em ordem alfabética):

```typescript
      advogados: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          oab: string | null;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          nome: string;
          oab?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          oab?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "advogados_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
```

- [ ] **Step 2: Adicionar `membro_id` na tabela `honorarios`**

Dentro de `honorarios.Row` e `honorarios.Insert`/`Update`, adicionar:
```typescript
// Em Row:
membro_id: string | null;
// Em Insert e Update:
membro_id?: string | null;
```

- [ ] **Step 3: Adicionar `membro_id` na tabela `clientes`**

Da mesma forma em `clientes.Row`, `Insert`, `Update`:
```typescript
membro_id: string | null;
// (Insert/Update)
membro_id?: string | null;
```

- [ ] **Step 4: Exportar tipo Advogado no final do arquivo (junto com outros exports de conveniência, se existirem)**

Localizar os type aliases de conveniência (ex: `export type HonorarioTipo = ...`) e adicionar:
```typescript
export type Advogado = Database["public"]["Tables"]["advogados"]["Row"];
```

- [ ] **Step 5: Build para verificar tipos**

```bash
pnpm build
```

Expected: 0 errors TypeScript.

- [ ] **Step 6: Commit**

```bash
git add src/lib/database.types.ts
git commit -m "feat(types): add advogados table and membro_id columns to database types"
```

---

## Task 3: CRUD /equipe — gerenciar advogados

**Files:**
- Create: `src/app/(app)/equipe/actions.ts`
- Create: `src/app/(app)/equipe/AdvogadoForm.tsx`
- Create: `src/app/(app)/equipe/novo/page.tsx`
- Create: `src/app/(app)/equipe/[id]/editar/page.tsx`
- Create: `src/app/(app)/equipe/page.tsx`

- [ ] **Step 1: Criar `src/app/(app)/equipe/actions.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdvogadoState = { error?: string } | undefined;

export async function saveAdvogado(
  _prev: AdvogadoState,
  formData: FormData,
): Promise<AdvogadoState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const oab = String(formData.get("oab") ?? "").trim() || null;

  if (!nome) return { error: "Nome é obrigatório." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (id) {
    const { error } = await supabase
      .from("advogados")
      .update({ nome, oab })
      .eq("id", id);
    if (error) return { error: "Não foi possível atualizar o advogado." };
  } else {
    const { error } = await supabase
      .from("advogados")
      .insert({ user_id: user.id, nome, oab });
    if (error) return { error: "Não foi possível criar o advogado." };
  }

  revalidatePath("/equipe");
  redirect("/equipe");
}

export async function deleteAdvogado(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("advogados").delete().eq("id", id);
  revalidatePath("/equipe");
  redirect("/equipe");
}
```

- [ ] **Step 2: Criar `src/app/(app)/equipe/AdvogadoForm.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { saveAdvogado, type AdvogadoState } from "./actions";
import type { Advogado } from "@/lib/database.types";

export function AdvogadoForm({ advogado }: { advogado?: Advogado }) {
  const [state, formAction, pending] = useActionState<AdvogadoState, FormData>(
    saveAdvogado,
    undefined,
  );

  return (
    <form action={formAction} className="card" style={{ maxWidth: 480 }}>
      {advogado?.id && <input type="hidden" name="id" value={advogado.id} />}

      {state?.error && <div className="auth-alert error">{state.error}</div>}

      <div className="form-group">
        <label htmlFor="adv-nome">Nome completo *</label>
        <input
          id="adv-nome"
          name="nome"
          className="form-control"
          defaultValue={advogado?.nome ?? ""}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="adv-oab">OAB</label>
        <input
          id="adv-oab"
          name="oab"
          className="form-control"
          defaultValue={advogado?.oab ?? ""}
          placeholder="Ex: OAB/RS 123.456"
        />
      </div>

      <Button type="submit" disabled={pending} style={{ marginTop: 8 }}>
        {pending ? "Salvando…" : advogado?.id ? "Salvar alterações" : "Cadastrar advogado"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Criar `src/app/(app)/equipe/novo/page.tsx`**

```tsx
import type { Metadata } from "next";
import { AdvogadoForm } from "../AdvogadoForm";

export const metadata: Metadata = {
  title: "Novo advogado — Comarca Honorários",
};

export default function NovoAdvogadoPage() {
  return (
    <div>
      <div className="page-head">
        <h1>Novo advogado</h1>
      </div>
      <AdvogadoForm />
    </div>
  );
}
```

- [ ] **Step 4: Criar `src/app/(app)/equipe/[id]/editar/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdvogadoForm } from "../../AdvogadoForm";

export const metadata: Metadata = {
  title: "Editar advogado — Comarca Honorários",
};

export default async function EditarAdvogadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("advogados")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  return (
    <div>
      <div className="page-head">
        <h1>Editar advogado</h1>
      </div>
      <AdvogadoForm advogado={data} />
    </div>
  );
}
```

- [ ] **Step 5: Criar `src/app/(app)/equipe/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteAdvogado } from "./actions";

export const metadata: Metadata = {
  title: "Equipe — Comarca Honorários",
};

function initials(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export default async function EquipePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("advogados")
    .select("id, nome, oab, ativo")
    .order("nome");
  const advogados = data ?? [];

  return (
    <div>
      <div className="page-head">
        <h1>Equipe</h1>
        <Link href="/equipe/novo" className="btn btn-blue">
          + Novo advogado
        </Link>
      </div>

      {advogados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3>Nenhum advogado cadastrado</h3>
          <p style={{ margin: "8px 0 16px" }}>
            Cadastre os advogados do escritório para vincular honorários a cada um.
          </p>
          <Link href="/equipe/novo" className="btn btn-blue">
            Cadastrar advogado
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {advogados.map((adv) => (
            <div key={adv.id} className="card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="client-initials-avatar">{initials(adv.nome)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{adv.nome}</div>
                  {adv.oab && (
                    <div style={{ fontSize: 13, color: "var(--body)", marginTop: 2 }}>
                      {adv.oab}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href={`/equipe/${adv.id}/editar`} className="btn btn-secondary">
                    ✏️ Editar
                  </Link>
                  <form action={deleteAdvogado}>
                    <input type="hidden" name="id" value={adv.id} />
                    <button
                      type="submit"
                      className="btn btn-secondary"
                      style={{ color: "var(--error)" }}
                      onClick={(e) => {
                        if (!confirm("Remover este advogado? Honorários vinculados ficam sem responsável.")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      🗑 Remover
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Build para verificar**

```bash
pnpm build
```

Expected: sem erros TypeScript, sem erros de importação.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(app\)/equipe/
git commit -m "feat(equipe): CRUD de advogados do escritório"
```

---

## Task 4: Sidebar — link Equipe

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Adicionar entrada "Equipe" no array LINKS**

No arquivo `src/components/Sidebar.tsx`, localizar o array `LINKS` e adicionar após `{ href: "/honorarios", ... }`:

```typescript
{
  href: "/equipe",
  label: "Equipe",
  icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 1-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
},
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat(sidebar): add Equipe link"
```

---

## Task 5: Dashboard — filtro real por advogado

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(app)/dashboard/DashboardFilters.tsx`

- [ ] **Step 1: Atualizar `DashboardFilters.tsx` para receber e usar lista real de advogados**

Substituir a interface `Props` e o select de advogado:

```tsx
interface Props {
  periodo: PeriodoTipo;
  de: string;
  ate: string;
  status: string;
  adv: string;
  advogados: { id: string; nome: string }[];
}

export function DashboardFilters({ periodo, de, ate, status, adv, advogados }: Props) {
  const router = useRouter();

  function nav(next: { periodo?: string; de?: string; ate?: string; adv?: string }) {
    const p = new URLSearchParams();
    p.set("periodo", next.periodo ?? periodo);
    if (status && status !== "todos") p.set("status", status);
    const advVal = next.adv ?? adv;
    if (advVal && advVal !== "todos") p.set("adv", advVal);
    const d = next.de ?? de;
    const a = next.ate ?? ate;
    if ((next.periodo ?? periodo) === "customizado") {
      if (d) p.set("de", d);
      if (a) p.set("ate", a);
    }
    router.push(`/dashboard?${p.toString()}`);
  }
  // ...
```

No bloco JSX do select de advogado, substituir por:

```tsx
<select
  className="form-control"
  style={{ width: "auto", minWidth: 180 }}
  value={adv}
  onChange={(e) => nav({ adv: e.target.value })}
>
  <option value="todos">Todos os advogados</option>
  {advogados.map((a) => (
    <option key={a.id} value={a.id}>{a.nome}</option>
  ))}
</select>
```

- [ ] **Step 2: Atualizar `dashboard/page.tsx` — carregar advogados e filtrar por `adv`**

Na função `DashboardPage`, ler o param `adv` de `searchParams` e filtrar:

```typescript
// Dentro do async DashboardPage({ searchParams }):
const { periodo: periodoParam, de, ate, status: statusParam, adv: advParam } = await searchParams;
const advId = advParam ?? "todos";

// Carregar advogados para o dropdown
const { data: advogados } = await supabase
  .from("advogados")
  .select("id, nome")
  .order("nome");

// Query de honorarios — aplicar filtro por membro_id se necessário
let honorariosQuery = supabase
  .from("honorarios")
  .select("id, tipo, cliente_id, membro_id, parcelas(id, valor, vencimento, status_registrado)");
if (advId !== "todos") {
  honorariosQuery = honorariosQuery.eq("membro_id", advId);
}
const { data: honorariosRaw } = await honorariosQuery;
```

Passar `adv` e `advogados` ao `DashboardFilters`:

```tsx
<DashboardFilters
  periodo={periodo}
  de={deStr}
  ate={ateStr}
  status={statusAtivo}
  adv={advId}
  advogados={advogados ?? []}
/>
```

- [ ] **Step 3: Build**

```bash
pnpm build
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/dashboard/
git commit -m "feat(dashboard): filter by real advogado from DB"
```

---

## Task 6: Honorários — select de advogado no form + filtro na listagem

**Files:**
- Modify: `src/app/(app)/honorarios/novo/page.tsx`
- Modify: `src/app/(app)/honorarios/HonorarioForm.tsx`
- Modify: `src/app/(app)/honorarios/actions.ts`
- Modify: `src/app/(app)/honorarios/page.tsx`

- [ ] **Step 1: Atualizar `novo/page.tsx` — carregar advogados e passar ao form**

```typescript
export default async function NovoHonorarioPage() {
  const supabase = await createClient();
  const [{ data: clientes }, { data: advogados }] = await Promise.all([
    supabase.from("clientes").select("id, nome").order("nome"),
    supabase.from("advogados").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  return (
    <div>
      <div className="page-head">
        <h1>Novo honorário</h1>
      </div>
      {!clientes || clientes.length === 0 ? (
        // empty state...
      ) : (
        <HonorarioForm clientes={clientes} advogados={advogados ?? []} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Atualizar `HonorarioForm.tsx` — receber e exibir select de advogado**

Alterar a interface de props:

```typescript
export function HonorarioForm({
  clientes,
  advogados,
}: {
  clientes: { id: string; nome: string }[];
  advogados: { id: string; nome: string }[];
}) {
```

Adicionar o campo no formulário, logo após o select de `cliente_id`:

```tsx
{advogados.length > 1 && (
  <div className="form-group">
    <label htmlFor="membro_id">Advogado responsável</label>
    <select id="membro_id" name="membro_id" className="form-control" defaultValue="">
      <option value="">Selecione…</option>
      {advogados.map((a) => (
        <option key={a.id} value={a.id}>{a.nome}</option>
      ))}
    </select>
  </div>
)}
```

- [ ] **Step 3: Atualizar `actions.ts` — incluir `membro_id` no insert**

Na função `createHonorario`, adicionar `membro_id` ao objeto `base`:

```typescript
const membro_id = str(formData, "membro_id") || null;

const base: HonorarioInsert = {
  cliente_id,
  tipo,
  membro_id,
  // ... demais campos
};
```

- [ ] **Step 4: Atualizar `honorarios/page.tsx` — filtrar por `adv` URL param**

Adicionar `adv` ao destructuring de `searchParams`:

```typescript
export default async function HonorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; adv?: string }>;
}) {
  const { tab, adv: advId } = await searchParams;
  // ...

  // Ao buscar honorários, filtrar por membro_id quando advId definido:
  let query = supabase
    .from("honorarios")
    .select("id, tipo, cliente_id, parcelas(...)");
  if (advId && advId !== "todos") {
    query = query.eq("membro_id", advId);
  }
```

Acima das tabs, adicionar um filtro simples de advogado (se houver mais de um):

```tsx
{advogados.length > 1 && (
  <div style={{ marginBottom: 16 }}>
    {/* Botão "Todos" e um botão por advogado — nav via URL */}
  </div>
)}
```

> Nota: Para manter simples no MVP, o filtro na página de honorários pode ser um `<select>` parecido com o do dashboard. Carregar `advogados` no server component e renderizar.

- [ ] **Step 5: Build**

```bash
pnpm build
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/honorarios/
git commit -m "feat(honorarios): advogado responsável no form + filtro por advogado"
```

---

## Task 7: Clientes — select de advogado no form + filtro na listagem

**Files:**
- Modify: `src/app/(app)/clientes/novo/page.tsx`
- Modify: `src/app/(app)/clientes/[id]/editar/page.tsx`
- Modify: `src/app/(app)/clientes/ClienteForm.tsx`
- Modify: `src/app/(app)/clientes/actions.ts`
- Modify: `src/app/(app)/clientes/page.tsx`

- [ ] **Step 1: Ler `src/app/(app)/clientes/actions.ts` para entender o `saveCliente`**

O padrão esperado: `saveCliente` lê `formData.get("id")` — se presente, faz UPDATE; caso contrário, faz INSERT. Adicionar leitura de `membro_id`:

```typescript
const membro_id = String(formData.get("membro_id") ?? "").trim() || null;
// No INSERT/UPDATE:
// insert: { nome, cpf: onlyDigits(cpf), whatsapp: onlyDigits(whatsapp), email || null, membro_id }
// update: { nome, ..., membro_id }
```

- [ ] **Step 2: Atualizar `novo/page.tsx` — carregar advogados**

```typescript
export default async function NovoClientePage() {
  const supabase = await createClient();
  const { data: advogados } = await supabase
    .from("advogados")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  return (
    <div>
      <div className="page-head"><h1>Novo cliente</h1></div>
      <ClienteForm advogados={advogados ?? []} />
    </div>
  );
}
```

- [ ] **Step 3: Atualizar `[id]/editar/page.tsx` — carregar advogados**

```typescript
const [{ data: cliente }, { data: advogados }] = await Promise.all([
  supabase.from("clientes").select("*").eq("id", id).maybeSingle(),
  supabase.from("advogados").select("id, nome").eq("ativo", true).order("nome"),
]);
if (!cliente) notFound();

return (
  // ...
  <ClienteForm cliente={cliente} advogados={advogados ?? []} />
);
```

- [ ] **Step 4: Atualizar `ClienteForm.tsx` — receber advogados e exibir select**

Alterar props:

```typescript
export function ClienteForm({
  cliente,
  advogados = [],
}: {
  cliente?: Cliente;
  advogados?: { id: string; nome: string }[];
}) {
```

Adicionar campo no formulário (após campo de e-mail):

```tsx
{advogados.length > 1 && (
  <div className="form-group">
    <label htmlFor="membro_id">Advogado responsável</label>
    <select
      id="membro_id"
      name="membro_id"
      className="form-control"
      defaultValue={(cliente as { membro_id?: string | null })?.membro_id ?? ""}
    >
      <option value="">Selecione…</option>
      {advogados.map((a) => (
        <option key={a.id} value={a.id}>{a.nome}</option>
      ))}
    </select>
  </div>
)}
```

- [ ] **Step 5: Atualizar `clientes/page.tsx` — filtrar por `adv` URL param**

Mesmo padrão do honorários:

```typescript
export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; adv?: string }>;
}) {
  const { error, adv: advId } = await searchParams;
  // ...
  let query = supabase
    .from("clientes")
    .select("id, nome, cpf, whatsapp, email, honorarios(...)");
  if (advId && advId !== "todos") {
    query = query.eq("membro_id", advId);
  }
  // Carregar advogados para filtro
  const { data: advogados } = await supabase
    .from("advogados").select("id, nome").order("nome");
```

Adicionar barra de filtro de advogados no topo (similar ao dashboard, mas mais simples):

```tsx
{(advogados ?? []).length > 1 && (
  <div className="card" style={{ display: "flex", gap: 8, padding: "12px 16px", marginBottom: 16, alignItems: "center" }}>
    <span style={{ fontSize: 13, color: "var(--body)" }}>Advogado:</span>
    {[{ id: "todos", nome: "Todos" }, ...(advogados ?? [])].map((a) => (
      <Link
        key={a.id}
        href={a.id === "todos" ? "/clientes" : `/clientes?adv=${a.id}`}
        className={`btn btn-secondary${(!advId && a.id === "todos") || advId === a.id ? " active" : ""}`}
        style={{ fontSize: 13, padding: "4px 12px" }}
      >
        {a.nome}
      </Link>
    ))}
  </div>
)}
```

- [ ] **Step 6: Build**

```bash
pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add src/app/\(app\)/clientes/
git commit -m "feat(clientes): advogado responsável no form + filtro por advogado"
```

---

## Self-Review

### Spec coverage

| Requisito | Task |
|---|---|
| Nova tabela `advogados` + RLS | Task 1 |
| `membro_id` em honorarios/clientes | Task 1 |
| Seed de dados existentes | Task 1 |
| Trigger para novos usuários | Task 1 |
| Tipos TypeScript atualizados | Task 2 |
| CRUD /equipe | Task 3 |
| Link sidebar | Task 4 |
| Dashboard filtro real | Task 5 |
| Honorários form + filtro | Task 6 |
| Clientes form + filtro | Task 7 |

### Gaps identificados
- **AppHeader "Trocar"** — o screenshot original mostrava o advogado ativo e botão "Trocar" no header. Não incluído neste plano pois requer decisão de UX (cookie global vs URL global vs breadcrumb). Pode ser uma Task 8 futura.
- **Relatório IR** (`/relatorio-ir`) — não foi filtrado por advogado. O cliente pode precisar no futuro.
- **Gerar Contrato** — pode ser interessante mostrar o nome do advogado responsável no contrato. Não crítico agora.

### Notas de implementação
- A RLS continua funcionando por `advogado_id = auth.uid()` — o `membro_id` é apenas um atributo de negócio, não de isolamento de segurança.
- O filtro por `membro_id` no Supabase funciona direto com `.eq("membro_id", id)` pois a política RLS já filtra por `advogado_id = auth.uid()`.
- O campo `advogados.length > 1` garante que escritórios com apenas um advogado não vejam o select desnecessário.
