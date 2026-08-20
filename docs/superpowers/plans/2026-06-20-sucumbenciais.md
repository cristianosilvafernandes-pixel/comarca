# Honorários Sucumbenciais — Entidade Própria — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar tabela `sucumbenciais` e toda a UI/lógica para registrar, acompanhar e incluir honorários sucumbenciais no Relatório IR como categoria separada.

**Architecture:** Nova tabela `sucumbenciais` (FK → honorarios, RLS por advogado_id via trigger). Server actions próprias em `sucumbenciais.ts`. UI: seção "Sucumbenciais" inline na página `/honorarios/[id]`. IR: `fetchSucumbenciaisIR()` converte sucumbenciais em `ParcelaIR` (origem=sucumbencial → grupo "Sucumbencial") e os mesclamos com as parcelas existentes.

**Tech Stack:** Next.js 16 App Router, Server Actions, Supabase (PostgreSQL + RLS), TypeScript, useActionState.

---

## Arquivo Map

| Ação | Arquivo |
|------|---------|
| CREATE | `supabase/migrations/0012_sucumbenciais.sql` |
| MODIFY | `src/lib/database.types.ts` |
| CREATE | `src/app/(app)/honorarios/sucumbenciais.ts` |
| CREATE | `src/app/(app)/honorarios/[id]/SucumbenciaisSection.tsx` |
| MODIFY | `src/app/(app)/honorarios/[id]/page.tsx` |
| MODIFY | `src/app/(app)/relatorio-ir/data.ts` |
| MODIFY | `src/app/(app)/relatorio-ir/page.tsx` |
| MODIFY | `src/app/(app)/relatorio-ir/csv/route.ts` |

---

## Task 1: Migration — tabela sucumbenciais

**Files:**
- Create: `supabase/migrations/0012_sucumbenciais.sql`

- [ ] **Step 1: Escrever migration**

```sql
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
```

- [ ] **Step 2: Aplicar migration via Supabase CLI**

```bash
cd /Users/leovbranco/Code/comarca
npx supabase db push
```

Esperado: output `Applying migration 0012_sucumbenciais.sql...` sem erro.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0012_sucumbenciais.sql
git commit -m "feat(db): tabela sucumbenciais com RLS e trigger advogado_id"
```

---

## Task 2: Tipos TypeScript

**Files:**
- Modify: `src/lib/database.types.ts`

- [ ] **Step 1: Adicionar tipo `StatusSucumbencial` e tabela**

Após a linha `export type StatusRegistrado = ...` adicionar:

```typescript
export type StatusSucumbencial = "aguardando" | "recebido";
```

Dentro de `Database["public"]["Tables"]`, adicionar após a tabela `parcelas`:

```typescript
      sucumbenciais: {
        Row: {
          id: string;
          honorario_id: string;
          advogado_id: string;
          valor: number;
          doc_adversario: string;
          status: StatusSucumbencial;
          data_recebimento: string | null;
          divisao_parceiro_id: string | null;
          divisao_parceiro_pct: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          honorario_id: string;
          advogado_id?: string;
          valor: number;
          doc_adversario: string;
          status?: StatusSucumbencial;
          data_recebimento?: string | null;
          divisao_parceiro_id?: string | null;
          divisao_parceiro_pct?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sucumbenciais"]["Insert"]>;
        Relationships: [];
      };
```

- [ ] **Step 2: Verificar typecheck**

```bash
npm run typecheck 2>&1 | head -30
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/database.types.ts
git commit -m "feat(types): adicionar tabela sucumbenciais ao database.types.ts"
```

---

## Task 3: Server actions de sucumbenciais

**Files:**
- Create: `src/app/(app)/honorarios/sucumbenciais.ts`

- [ ] **Step 1: Criar arquivo de actions**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { onlyDigits } from "@/lib/utils/cpf";
import { todayISO } from "@/lib/domain/dates";
import type { StatusSucumbencial } from "@/lib/database.types";

export type SucumbencialState = { error?: string } | undefined;

/** Registra um honorário sucumbencial vinculado a um honorário. */
export async function registrarSucumbencial(
  _prev: SucumbencialState,
  formData: FormData,
): Promise<SucumbencialState> {
  const honorarioId = String(formData.get("honorario_id") ?? "").trim();
  const valorRaw = Number(formData.get("valor") ?? 0);
  const docRaw = String(formData.get("doc_adversario") ?? "");
  const status = (String(formData.get("status") ?? "aguardando")) as StatusSucumbencial;
  const dataRecebimento =
    status === "recebido"
      ? String(formData.get("data_recebimento") ?? "").trim() || todayISO()
      : null;
  const dividir = formData.get("dividir_parceiro") === "on";
  const parceiroId = dividir ? String(formData.get("divisao_parceiro_id") ?? "").trim() || null : null;
  const parceiroPct = dividir
    ? Math.max(0, Math.min(100, Number(formData.get("divisao_parceiro_pct") ?? 0) || 0))
    : null;

  if (!honorarioId) return { error: "Honorário inválido." };
  if (!valorRaw || valorRaw <= 0) return { error: "Informe o valor sucumbencial." };

  const digits = onlyDigits(docRaw);
  if (digits.length !== 11 && digits.length !== 14) {
    return { error: "Informe o CPF (11 dígitos) ou CNPJ (14 dígitos) da parte adversária." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sucumbenciais").insert({
    honorario_id: honorarioId,
    valor: valorRaw,
    doc_adversario: digits,
    status,
    data_recebimento: dataRecebimento,
    divisao_parceiro_id: parceiroId,
    divisao_parceiro_pct: parceiroPct,
  });

  if (error) return { error: "Não foi possível registrar o sucumbencial." };

  revalidatePath(`/honorarios/${honorarioId}`);
  revalidatePath("/relatorio-ir");
  return {};
}

/** Marca sucumbencial como recebido com data de hoje. */
export async function marcarSucumbencialRecebido(
  sucId: string,
  honorarioId: string,
): Promise<{ error?: string }> {
  if (!sucId) return { error: "Sucumbencial inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sucumbenciais")
    .update({ status: "recebido", data_recebimento: todayISO() })
    .eq("id", sucId);

  if (error) return { error: "Não foi possível atualizar o status." };

  revalidatePath(`/honorarios/${honorarioId}`);
  revalidatePath("/relatorio-ir");
  return {};
}

/** Remove um registro de sucumbencial. */
export async function deleteSucumbencial(
  sucId: string,
  honorarioId: string,
): Promise<{ error?: string }> {
  if (!sucId) return { error: "Sucumbencial inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("sucumbenciais").delete().eq("id", sucId);

  if (error) return { error: "Não foi possível excluir." };

  revalidatePath(`/honorarios/${honorarioId}`);
  return {};
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
npm run typecheck 2>&1 | grep -E "sucumbencial|error TS" | head -20
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/honorarios/sucumbenciais.ts
git commit -m "feat(honorarios): server actions de sucumbenciais (registrar/receber/deletar)"
```

---

## Task 4: UI — SucumbenciaisSection

**Files:**
- Create: `src/app/(app)/honorarios/[id]/SucumbenciaisSection.tsx`

- [ ] **Step 1: Criar componente**

```typescript
"use client";

import { useActionState, useState, useTransition } from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { maskCPF } from "@/lib/utils/cpf";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  registrarSucumbencial,
  marcarSucumbencialRecebido,
  deleteSucumbencial,
  type SucumbencialState,
} from "../sucumbenciais";
import type { StatusSucumbencial } from "@/lib/database.types";

export interface SucumbencialRow {
  id: string;
  valor: number;
  doc_adversario: string;
  status: StatusSucumbencial;
  data_recebimento: string | null;
  divisao_parceiro_pct: number | null;
  parceiro: { nome: string } | null;
}

interface Props {
  honorarioId: string;
  sucumbenciais: SucumbencialRow[];
  advogados: { id: string; nome: string }[];
}

function StatusBadge({ status }: { status: StatusSucumbencial }) {
  return status === "recebido" ? (
    <span className="badge badge-pago">Recebido</span>
  ) : (
    <span className="badge badge-vencendo">Aguardando</span>
  );
}

function SucumbencialItem({
  suc,
  honorarioId,
}: {
  suc: SucumbencialRow;
  honorarioId: string;
}) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div
      style={{
        background: "var(--gray-bg)",
        borderRadius: 8,
        padding: "12px 16px",
        marginBottom: 8,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>{formatCurrency(suc.valor)}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          Parte adversária: {suc.doc_adversario}
        </div>
        {suc.data_recebimento && (
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Recebido em: {formatDate(suc.data_recebimento)}
          </div>
        )}
        {suc.parceiro && suc.divisao_parceiro_pct != null && (
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Divisão: {suc.parceiro.nome} {suc.divisao_parceiro_pct}% · Titular{" "}
            {100 - suc.divisao_parceiro_pct}%
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <StatusBadge status={suc.status} />
        <div style={{ display: "flex", gap: 6 }}>
          {suc.status === "aguardando" && (
            <Button
              type="button"
              variant="success"
              disabled={isPending}
              onClick={() =>
                startTransition(() => void marcarSucumbencialRecebido(suc.id, honorarioId))
              }
            >
              {isPending ? "Salvando…" : "Marcar recebido"}
            </Button>
          )}
          {!confirm ? (
            <Button type="button" variant="secondary" onClick={() => setConfirm(true)}>
              Excluir
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="danger"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => void deleteSucumbencial(suc.id, honorarioId))
                }
              >
                Confirmar
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirm(false)}>
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RegistrarForm({
  honorarioId,
  advogados,
  onClose,
}: {
  honorarioId: string;
  advogados: { id: string; nome: string }[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<SucumbencialState, FormData>(
    registrarSucumbencial,
    undefined,
  );
  const [status, setStatus] = useState<StatusSucumbencial>("aguardando");
  const [dividir, setDividir] = useState(false);
  const [doc, setDoc] = useState("");

  return (
    <form
      action={async (fd) => {
        await formAction(fd);
        if (!state?.error) onClose();
      }}
      style={{
        background: "var(--primary-light)",
        border: "1px solid var(--gray-border)",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <input type="hidden" name="honorario_id" value={honorarioId} />

      {state?.error && <Alert style={{ marginBottom: 8 }}>{state.error}</Alert>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label className="form-label">Valor (R$) *</label>
          <input
            name="valor"
            type="number"
            step="0.01"
            min="0.01"
            className="form-control"
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <label className="form-label">CPF/CNPJ da parte adversária *</label>
          <input
            name="doc_adversario"
            className="form-control"
            value={doc}
            onChange={(e) => setDoc(maskCPF(e.target.value))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            required
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label className="form-label">Status *</label>
          <select
            name="status"
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusSucumbencial)}
          >
            <option value="aguardando">Aguardando pagamento</option>
            <option value="recebido">Já recebido</option>
          </select>
        </div>
        {status === "recebido" && (
          <div>
            <label className="form-label">Data do recebimento *</label>
            <input
              name="data_recebimento"
              type="date"
              className="form-control"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
        )}
      </div>

      {advogados.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 0 }}>
            <input
              type="checkbox"
              name="dividir_parceiro"
              checked={dividir}
              onChange={(e) => setDividir(e.target.checked)}
            />
            Dividir com advogado parceiro
          </label>
          {dividir && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 8,
              }}
            >
              <div>
                <label className="form-label">Advogado parceiro</label>
                <select name="divisao_parceiro_id" className="form-control">
                  {advogados.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">% do parceiro</label>
                <input
                  name="divisao_parceiro_pct"
                  type="number"
                  min="1"
                  max="99"
                  className="form-control"
                  placeholder="Ex: 40"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Salvando…" : "Registrar sucumbencial"}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function SucumbenciaisSection({ honorarioId, sucumbenciais, advogados }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>⚖️ Sucumbencial ({sucumbenciais.length})</h3>
        {!showForm && (
          <Button type="button" variant="secondary" onClick={() => setShowForm(true)}>
            + Registrar sucumbencial
          </Button>
        )}
      </div>

      {showForm && (
        <RegistrarForm
          honorarioId={honorarioId}
          advogados={advogados}
          onClose={() => setShowForm(false)}
        />
      )}

      {sucumbenciais.length === 0 && !showForm && (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Nenhum honorário sucumbencial registrado.
        </p>
      )}

      {sucumbenciais.map((suc) => (
        <SucumbencialItem key={suc.id} suc={suc} honorarioId={honorarioId} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
npm run typecheck 2>&1 | grep -E "SucumbenciaisSection|error TS" | head -20
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/honorarios/\[id\]/SucumbenciaisSection.tsx
git commit -m "feat(honorarios): componente SucumbenciaisSection com form inline"
```

---

## Task 5: Integrar SucumbenciaisSection na página do honorário

**Files:**
- Modify: `src/app/(app)/honorarios/[id]/page.tsx`

- [ ] **Step 1: Adicionar fetch de sucumbenciais e advogados ao page.tsx**

No bloco `Promise.all` que já existe (linha com `supabase.from("honorarios").select...`), acrescentar duas queries paralelas. Substituir o bloco `Promise.all` existente por:

```typescript
  const [{ data: hon }, { data: userData }, { data: sucumbenciais }, { data: advogados }] = await Promise.all([
    supabase
      .from("honorarios")
      .select(
        "id, tipo, processo, area, tribunal, parte_contraria, valor_total, valor_mensal, valor_causa, percentual_exito, valor_entrada, chave_pix, link_publico_token, parceiro_percentual, parceiro:parceiro_id(nome), clientes:cliente_id(nome, whatsapp), parcelas(id, numero, valor, vencimento, status_registrado, data_pagamento)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.auth.getUser(),
    supabase
      .from("sucumbenciais")
      .select("id, valor, doc_adversario, status, data_recebimento, divisao_parceiro_pct, parceiro:divisao_parceiro_id(nome)")
      .eq("honorario_id", id)
      .order("created_at"),
    supabase.from("advogados").select("id, nome").eq("ativo", true).order("nome"),
  ]);
```

- [ ] **Step 2: Adicionar import e renderização da seção**

No topo do arquivo, após os imports existentes, adicionar:

```typescript
import { SucumbenciaisSection, type SucumbencialRow } from "./SucumbenciaisSection";
```

Antes do `return (`, adicionar:

```typescript
  const sucRows = (sucumbenciais ?? []) as unknown as SucumbencialRow[];
  const advRows = (advogados ?? []) as { id: string; nome: string }[];
```

No JSX, adicionar após o bloco de botões `<div style={{ display: "flex", gap: 12, marginTop: 24... }}>`:

```tsx
      <SucumbenciaisSection
        honorarioId={hon.id}
        sucumbenciais={sucRows}
        advogados={advRows}
      />
```

- [ ] **Step 3: Verificar typecheck**

```bash
npm run typecheck 2>&1 | head -30
```

Esperado: 0 erros.

- [ ] **Step 4: Testar manualmente no browser**

Navegue para `http://localhost:3000/honorarios/<qualquer-id>`. Verifique:
- Seção "⚖️ Sucumbencial (0)" aparece
- Botão "+ Registrar sucumbencial" abre form inline
- Formulário tem campos: Valor, CPF/CNPJ, Status, (divisão se houver advogados)
- Salvar registra e lista o sucumbencial
- "Marcar recebido" atualiza status
- "Excluir" pede confirmação e remove

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/honorarios/\[id\]/page.tsx
git commit -m "feat(honorarios): integrar SucumbenciaisSection na página de detalhe"
```

---

## Task 6: IR — incluir sucumbenciais no relatório

**Files:**
- Modify: `src/app/(app)/relatorio-ir/data.ts`
- Modify: `src/app/(app)/relatorio-ir/page.tsx`
- Modify: `src/app/(app)/relatorio-ir/csv/route.ts`

- [ ] **Step 1: Adicionar `fetchSucumbenciaisIR` em data.ts**

Adicionar ao final de `src/app/(app)/relatorio-ir/data.ts`:

```typescript
type SucRow = {
  valor: number;
  doc_adversario: string;
  data_recebimento: string | null;
  honorarios: {
    membro_id: string | null;
    clientes: { nome: string; cpf: string } | null;
  } | null;
};

/**
 * Busca sucumbenciais RECEBIDOS do advogado (RLS).
 * Converte para ParcelaIR com origem='sucumbencial' para que
 * agregarRelatorioIR os coloque no grupo "Sucumbencial".
 */
export async function fetchSucumbenciaisIR(membroIds: string[] = []): Promise<ParcelaIR[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sucumbenciais")
    .select(
      "valor, doc_adversario, data_recebimento, honorarios:honorario_id(membro_id, clientes:cliente_id(nome, cpf))",
    )
    .eq("status", "recebido")
    .not("data_recebimento", "is", null);

  const rows = (data ?? []) as unknown as SucRow[];

  return rows
    .filter((r) => r.honorarios && r.data_recebimento)
    .filter(
      (r) =>
        membroIds.length === 0 ||
        (r.honorarios!.membro_id != null && membroIds.includes(r.honorarios!.membro_id)),
    )
    .map((r) => ({
      clienteNome: r.honorarios!.clientes?.nome ?? "—",
      clienteCpf: r.honorarios!.clientes?.cpf ?? "—",
      tipo: "ad_exitum" as const,   // não importa — grupoExibicao usa origem='sucumbencial'
      numero: 1,
      origem: "sucumbencial" as const,
      docPagador: r.doc_adversario,
      valor: r.valor,
      dataPagamento: r.data_recebimento,
      vencimento: r.data_recebimento!,
    }));
}
```

- [ ] **Step 2: Atualizar page.tsx do relatorio-ir**

Adicionar import no topo de `src/app/(app)/relatorio-ir/page.tsx`:

```typescript
import { fetchParcelasIR, fetchSucumbenciaisIR } from "./data";
```

Substituir no `Promise.all`:

```typescript
  const [parcelas, sucParcelas, { data: advogados }] = await Promise.all([
    fetchParcelasIR(advIds),
    fetchSucumbenciaisIR(advIds),
    supabase.from("advogados").select("id, nome").eq("ativo", true).order("nome"),
  ]);
```

Substituir a linha `const rel = agregarRelatorioIR(parcelas, ano);` por:

```typescript
  const rel = agregarRelatorioIR([...parcelas, ...sucParcelas], ano);
```

E ajustar `anosDisponiveis`:

```typescript
  const anosDisponiveis = Array.from(
    new Set([anoAtual, ...[...parcelas, ...sucParcelas].map(anoApuracao)]),
  ).sort((a, b) => b - a);
```

- [ ] **Step 3: Atualizar csv/route.ts**

Ler o arquivo e adicionar `fetchSucumbenciaisIR` ao import e mesclagem. O arquivo atual provavelmente tem:

```typescript
import { fetchParcelasIR } from "../data";
// ...
const parcelas = await fetchParcelasIR(advIds);
const rel = agregarRelatorioIR(parcelas, ano);
```

Alterar para:

```typescript
import { fetchParcelasIR, fetchSucumbenciaisIR } from "../data";
// ...
const [parcelas, sucParcelas] = await Promise.all([
  fetchParcelasIR(advIds),
  fetchSucumbenciaisIR(advIds),
]);
const rel = agregarRelatorioIR([...parcelas, ...sucParcelas], ano);
```

- [ ] **Step 4: Verificar typecheck**

```bash
npm run typecheck 2>&1 | head -30
```

Esperado: 0 erros.

- [ ] **Step 5: Testar manualmente**

1. Registre um sucumbencial em um honorário, status "recebido"
2. Navegue para `http://localhost:3000/relatorio-ir`
3. Verifique grupo "Sucumbencial" aparece com o valor e doc_adversario
4. Clique "Exportar CSV" e abra o arquivo — deve ter linha com `Tipo=Sucumbencial`

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/relatorio-ir/data.ts \
        src/app/\(app\)/relatorio-ir/page.tsx \
        src/app/\(app\)/relatorio-ir/csv/route.ts
git commit -m "feat(ir): incluir sucumbenciais no relatório IR como categoria própria"
```

---

## Self-Review

**Spec coverage:**
- ✅ Tabela `sucumbenciais` com RLS e trigger
- ✅ Valor, doc da parte contrária, status aguardando/recebido, data
- ✅ Divisão entre advogados (parceiro + %)
- ✅ Seção "Sucumbencial" na tela de detalhes do honorário
- ✅ "Marcar como recebido" com data
- ✅ Excluir sucumbencial
- ✅ Relatório IR inclui sucumbenciais como grupo "Sucumbencial"
- ✅ CSV do IR inclui sucumbenciais

**Placeholder scan:** Nenhum TBD, TODO ou "similar ao task N".

**Type consistency:**
- `SucumbencialRow` definido em `SucumbenciaisSection.tsx` e importado em `page.tsx`
- `SucumbencialState` exportado de `sucumbenciais.ts` e importado em `SucumbenciaisSection.tsx`
- `fetchSucumbenciaisIR` exportado de `data.ts`, importado em `page.tsx` e `csv/route.ts`
- `StatusSucumbencial` exportado de `database.types.ts`, usado em `sucumbenciais.ts` e `SucumbenciaisSection.tsx`
