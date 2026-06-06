# Spec — Comarca Honorários (Spec-Driven Development)

> Especificação técnica que serve de fonte da verdade para a implementação.
> Versão 1.0 · Junho/2026 · Acompanha [prd.md](prd.md) · Status: Draft

---

## 0. Como ler este documento (SDD)

Este projeto segue **Spec-Driven Development**: a spec é escrita e revisada **antes** do código. Cada funcionalidade descrita aqui é a referência contra a qual as tasks ([tasks.md](tasks.md)) e os testes são validados. Mudança de comportamento começa por mudança nesta spec.

Cada seção de funcionalidade tem o formato:
- **Contexto** — por que existe.
- **Comportamento** — o que deve acontecer (em formato testável `Dado / Quando / Então`).
- **Contrato** — dados, API e/ou esquema envolvidos.

---

## 1. Arquitetura-alvo

```
┌─────────────────────────────────────────────────────────────┐
│  Cliente (browser / PWA)                                      │
│  App web responsivo · hospedado na Vercel                     │
└───────────────┬───────────────────────────┬──────────────────┘
                │ Supabase JS SDK            │ link público (token)
                ▼                            ▼
┌─────────────────────────────┐   ┌──────────────────────────────┐
│  Supabase                   │   │  Página pública de pagamento  │
│  - Auth (e-mail/senha)      │   │  (rota sem login, SSR/edge)   │
│  - Postgres + RLS           │   └──────────────────────────────┘
│  - Storage (documentos)     │
│  - Edge Functions:          │
│      · extrair-documento    │──▶ Provedor de OCR/IA
│      · gerar-qrcode-pix     │
│      · confirmar-pagto-pub  │
└─────────────────────────────┘
```

**Princípios de arquitetura**
- Isolamento de dados por advogado via **Row Level Security**.
- A página pública não usa a sessão do advogado; lê dados por um **token opaco** via Edge Function com `service_role` restrita.
- Nenhum segredo no cliente além da `anon key` pública do Supabase.
- Status de parcela é **derivado** (calculado) sempre que possível, não persistido como fonte da verdade — exceto `pago` e `pago_verificacao`, que são fatos registrados.

### 1.1. Decisões de stack (ADR resumido)

| Decisão | Escolha | Motivo |
|---|---|---|
| Hospedagem do frontend | Vercel | Deploy por push, previews por PR, bom DX. |
| Backend gerenciado | Supabase | Postgres + Auth + Storage + RLS + Edge Functions num só lugar; sem servidor próprio. |
| Framework frontend | Next.js (App Router) | SSR para a página pública, integra com Vercel e Supabase. *(a confirmar na fase de setup)* |
| Linguagem | TypeScript | Tipagem ponta a ponta com tipos gerados do schema Supabase. |
| Estilo | A definir no setup (manter design system do protótipo) | Reaproveitar as CSS variables existentes. |
| Envio de WhatsApp | Link `wa.me` (manual) | Sem custo/aprovação Meta no MVP. |

> Decisões marcadas *(a confirmar)* são candidatas a ADR próprio na fase de setup. Esta fase não fixa o framework em código.

---

## 2. Modelo de dados (Postgres)

Convenções: nomes em `snake_case`, chaves primárias `uuid`, timestamps `timestamptz`, valores monetários em `numeric(12,2)`. Toda tabela de domínio tem coluna `advogado_id` para RLS.

### 2.1. `profiles` (advogado)
Estende `auth.users` do Supabase.

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid (PK, = auth.users.id) | |
| `nome` | text | obrigatório |
| `oab` | text | ex.: "OAB/RS 107.295" |
| `chave_pix` | text | usada na página pública |
| `plano` | text enum (`free`,`essencial`,`profissional`) | default `free` |
| `created_at` | timestamptz | default now() |

### 2.2. `clientes`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid (PK) | |
| `advogado_id` | uuid (FK → profiles.id) | RLS |
| `nome` | text | obrigatório |
| `cpf` | text | obrigatório, validar dígitos |
| `whatsapp` | text | obrigatório, E.164 normalizado |
| `email` | text | opcional |
| `endereco` | text | opcional |
| `created_at` | timestamptz | |

### 2.3. `honorarios`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid (PK) | |
| `advogado_id` | uuid (FK) | RLS |
| `cliente_id` | uuid (FK → clientes.id) | obrigatório |
| `processo` | text | opcional |
| `area` | text enum (`Trabalhista`,`Cível`,`Família`,`Criminal`,`Previdenciário`,`Tributário`,`Consumidor`,`Outro`) | |
| `tribunal` | text enum (`TJRS`,`TJSP`,`TJRJ`,`TRF4`,`TST`,`STJ`,`Outro`) | |
| `parte_contraria` | text | opcional |
| `tipo` | text enum (`fixo_parcelado`,`ad_exitum`,`recorrente`,`fixo_exitum`) | obrigatório |
| `frequencia` | text enum (`Mensal`,`Quinzenal`,`Única`) | para fixo_parcelado |
| `valor_total` | numeric(12,2) | conforme tipo |
| `valor_causa` | numeric(12,2) | para êxito |
| `percentual_exito` | numeric(5,2) | para êxito |
| `valor_entrada` | numeric(12,2) | para fixo+êxito |
| `valor_mensal` | numeric(12,2) | para recorrente |
| `data_inicio` | date | para recorrente |
| `data_fim` | date | recorrente, opcional |
| `valor_resultado` | numeric(12,2) | valor obtido na causa — preenchido ao registrar êxito |
| `data_exito` | date | data do êxito/acordo |
| `encerrado_sem_exito` | boolean | default false; true quando a causa é perdida/encerrada sem cobrança |
| `chave_pix` | text | PIX específico do honorário (default = `profiles.chave_pix`) |
| `link_publico_token` | text (único, indexado) | token opaco da página pública |
| `created_at` | timestamptz | |

### 2.4. `parcelas`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid (PK) | |
| `honorario_id` | uuid (FK → honorarios.id) | cascade delete |
| `advogado_id` | uuid (FK) | RLS (desnormalizado p/ política) |
| `numero` | int | sequencial dentro do honorário |
| `valor` | numeric(12,2) | obrigatório |
| `vencimento` | date | obrigatório |
| `status_registrado` | text enum (`em_aberto`,`pago`,`pago_verificacao`) | default `em_aberto` |
| `data_pagamento` | date | preenchida ao marcar pago |
| `origem_pagamento` | text enum (`contratual`,`sucumbencial`) | quem pagou: cliente (contratual) ou parte contrária (sucumbencial) |
| `doc_pagador` | text | CPF/CNPJ do pagador — preenchido só quando `sucumbencial` |
| `confirmado_cliente` | boolean | default false; `true` quando o cliente confirma na página pública |
| `created_at` | timestamptz | |

> **Status efetivo** (`pendente`/`vencendo`/`atrasado`) é derivado de `status_registrado` + `vencimento` em relação à data atual — ver §3.2. Não é coluna.

### 2.5. `documentos` (uploads para extração)

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid (PK) | |
| `advogado_id` | uuid (FK) | RLS |
| `storage_path` | text | caminho no bucket Supabase Storage |
| `status_extracao` | text enum (`pendente`,`processando`,`concluido`,`erro`) | |
| `dados_extraidos` | jsonb | resultado do OCR/IA |
| `created_at` | timestamptz | |

### 2.6. `lembretes` (registro de uso para limites de plano)

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid (PK) | |
| `advogado_id` | uuid (FK) | RLS |
| `parcela_id` | uuid (FK) | |
| `canal` | text (`whatsapp`) | |
| `enviado_em` | timestamptz | usado para contagem mensal |

### 2.7. Diagrama de relações

```
profiles 1──N clientes 1──N honorarios 1──N parcelas
   │                          │                 │
   └──N documentos            └─ link_publico   └──N lembretes
```

---

## 3. Funcionalidades (comportamento + contrato)

### F1 — Autenticação e perfil
**Contexto:** cada advogado tem seus próprios dados, isolados.

**Comportamento**
- Dado um visitante, Quando se cadastra com e-mail/senha válidos, Então é criado um `auth.user` e um `profiles` correspondente com `plano = free`.
- Dado um advogado logado, Quando edita nome/OAB/chave PIX/**foro**, Então `profiles` é atualizado.
- Dado um advogado sem chave PIX, Quando tenta gerar uma página pública de pagamento, Então o sistema exige a chave PIX antes.
- O **foro** (ex.: "Pelotas/RS") é configurável no perfil e usado como default na geração de contrato (F9), resolvendo a pendência P-02.

**Contrato:** Supabase Auth (`signUp`, `signInWithPassword`, `signOut`). Trigger `on auth.users insert` cria `profiles`.

---

### F2 — Clientes (CRUD)
**Comportamento**
- Criar exige nome, CPF, WhatsApp. CPF validado; WhatsApp normalizado para E.164.
- Listar retorna apenas clientes do advogado autenticado (RLS).
- Excluir cliente com honorários: bloquear ou exigir confirmação (não cascatear silenciosamente).
- Respeitar limite de clientes do plano (§6.3 do PRD).

**Contrato:** tabela `clientes`. Acesso via Supabase SDK com RLS.

---

### F3/F4 — Honorários e parcelas
**Comportamento por tipo**
- `fixo_parcelado`: Dado `valor_total`, `n` parcelas (1–12) e `frequencia` (`Mensal`/`Quinzenal`/`Única`), Então gerar `n` parcelas de valor `valor_total/n` (ajustar centavos na última) com vencimentos conforme a frequência a partir da data da 1ª parcela. Quando `1x`, ofertar a opção **"marcar como já pago hoje"** (cria a parcela já com `status_registrado=pago`).
- `ad_exitum`: registrar `valor_causa` e `percentual_exito`; não gerar parcelas por data — gerar uma cobrança quando o advogado marcar o êxito.
- `recorrente`: gerar parcelas mensais de `valor_mensal` entre `data_inicio` e `data_fim` (ou em aberto, gerando o mês corrente + próximos).
- `fixo_exitum`: gerar parcela(s) da `valor_entrada` + cobrança de êxito futura.

**Regras**
- Respeitar limite de honorários ativos do plano.
- Excluir honorário remove suas parcelas (cascade) — com confirmação.

#### Ciclo de vida do honorário de êxito (resolve P-04)
Honorários de êxito (`ad_exitum` e a parte de êxito do `fixo_exitum`) **não têm vencimento fixo** — dependem do resultado da causa. Modelo:

1. **Aguardando êxito** (estado derivado): no cadastro, `ad_exitum` registra `percentual_exito` + `valor_causa` (estimativa, só informativo) e **não gera parcela cobrável**; `fixo_exitum` gera apenas a parcela da `valor_entrada`. O honorário fica com o estado derivado `aguardando_exito` (nenhuma parcela de êxito existe ainda) e **não dispara lembretes**.
2. **Registrar êxito** (ação do advogado, pós-sentença/acordo): abre o modal "Registrar êxito" → informa `valor_resultado` (valor efetivamente obtido), `data_exito` e o `vencimento` da cobrança (default: hoje + 15 dias). O sistema calcula `valor_exito = round(percentual_exito/100 × valor_resultado, 2)` e **cria uma parcela** com esse valor e vencimento. A partir daí o honorário segue o fluxo normal (lembrete, página pública, marcar pago).
3. **Sem êxito / causa perdida:** ação "Encerrar sem êxito" marca o honorário como encerrado, sem gerar cobrança.

> Estado derivado `aguardando_exito` = honorário `ad_exitum`/`fixo_exitum` cujo êxito ainda não foi registrado (sem parcela de êxito). Não é coluna; é calculado.

**Contrato:** tabelas `honorarios` (+ campos `valor_resultado`, `data_exito`) + `parcelas`. Geração de parcelas e cálculo do valor de êxito em função pura testável.

---

### F5 — Dashboard
**Comportamento**
- Resumo: somatórios de valor por grupo — **Pendentes** (em aberto, status efetivo pendente/vencendo), **Urgentes** (atrasado + vencendo), **Confirmados** (pago).
- Filtro por período: `este_mes`, `este_ano`, `todos`, `customizado` (intervalo de datas) — aplicado sobre `vencimento`.
- Filtro por status: `todos`, `pendente`, `vencendo`, `atrasado`, `pago`.
- Badges de contagem em "vencendo" e "atrasados".

**Cálculo de status efetivo (§3.2 referência)**
```
se status_registrado == 'pago'              -> 'pago'
se status_registrado == 'pago_verificacao'  -> 'pago_verificacao'
se vencimento < hoje                         -> 'atrasado'
se 0 <= (vencimento - hoje) <= 2 dias        -> 'vencendo'
senão                                        -> 'pendente'
```

---

### F6 — Lembrete WhatsApp
**Comportamento**
- Dado uma parcela, Quando o advogado aciona "enviar lembrete", Então o sistema monta uma mensagem pré-formatada e editável e abre `https://wa.me/<numero>?text=<mensagem>`.
- Antes de abrir o WhatsApp, a mensagem é copiada para a área de transferência.
- Campo opcional **código de barras de boleto**: quando preenchido, adiciona uma linha "Boleto: <código>" à mensagem.
- Cada envio cria um registro em `lembretes` (para contagem de limite mensal).
- Dado que o limite mensal do plano foi atingido, Quando tenta enviar, Então bloquear e sugerir upgrade.

**Mensagem (template):** saudação com nome do cliente, "lembrete amigável de honorário", processo + (área - tribunal), parcela `n/total`, valor, vencimento, linha de boleto (se houver), chave PIX do honorário, **link público de pagamento** (`/h/:token`), e assinatura do advogado (nome + OAB). O número de WhatsApp é normalizado com prefixo `55`.

---

### F7 — Marcar como pago (confirmação de recebimento)
**Comportamento**
- Advogado marca parcela como paga informando a **origem do pagamento**:
  - `contratual` — pago pelo cliente (honorário contratual).
  - `sucumbencial` — pago pela parte contrária (honorário sucumbencial); neste caso exige **CPF/CNPJ do pagador** (`doc_pagador`).
- `data_pagamento` default = hoje. `status_registrado` → `pago`.
- Parcela confirmada na página pública entra como `pago_verificacao` (`confirmado_cliente=true`); o advogado a valida para virar `pago`.
- A origem alimenta o agrupamento e os totais do relatório de IR (ver F10).

---

### F8 — Página pública de pagamento (sem login)
**Contexto:** o cliente do advogado acessa por link, sem conta.

**Comportamento**
- Dado um `link_publico_token` válido, Quando o cliente abre a página, Então vê: advogado (nome/OAB), cliente, processo, parcela em aberto mais próxima, valor, vencimento, chave PIX e QR Code.
- Quando o cliente clica "confirmar pagamento", Então a parcela vira `pago_verificacao` e o advogado é notificado.
- A página **não** expõe demais dados do advogado nem outras parcelas/clientes.

**Contrato (Edge Functions, sem sessão de usuário)**
```
GET  /public/honorario/:token      -> dados mínimos da parcela em aberto
POST /public/honorario/:token/confirmar
       body: { numero_parcela }    -> marca pago_verificacao
```
- Implementadas como Edge Functions com `service_role`, validando o token e retornando somente o necessário. RLS não se aplica (sem usuário) — o gating é o token + a função.

---

### F9 — Geração de contrato
**Comportamento**
- Selecionar cliente, objeto da prestação e valor → preencher um template editável de "Contrato de Prestação de Serviços Advocatícios" com: dados do cliente (nome, CPF, endereço), dados do advogado (nome/OAB do `profiles`), objeto, valor, **foro** e data de hoje, com blocos de assinatura.
- O **foro** (protótipo: fixo "Pelotas/RS") passa a ser configurável no perfil do advogado (pendência P-02 do inventário).
- Ações: "enviar por WhatsApp" (abre `wa.me/55<numero>` com o texto) e "baixar" (PDF na implementação real; no protótipo é simulado — "em breve PDF com assinatura digital").
- Disclaimer: o template não substitui revisão jurídica.

**Contrato:** template versionado no repositório; merge de campos no cliente.

---

### F10 — Relatório IR
**Comportamento**
- Filtro por ano de apuração (ano de `data_pagamento`, fallback `vencimento`).
- Lista parcelas com `status_registrado = pago` no ano, com cliente, CPF/CNPJ, categoria fiscal, origem, valor recebido e data.
- **Categoria fiscal** (derivada do tipo + parcela):
  - `fixo_parcelado` → **Contratual**
  - `ad_exitum` → **Êxito**
  - `recorrente` → **Recorrente**
  - `fixo_exitum` → parcela 1 = **Contratual**; demais = **Êxito**
- Agrupar em 4 grupos: **Contratual / Êxito / Sucumbencial / Recorrente**, com total por grupo.
- **CPF/CNPJ exibido:** o do cliente; quando `origem_pagamento = sucumbencial`, usar `doc_pagador`.
- Totais ao final: **total geral apurado** + **total por origem** (Contratual e Sucumbencial separados).
- Exportar CSV: separador `;`, BOM UTF-8, vírgula decimal, nome `Apuracao_IR_Comarca_{ano}.csv`, colunas `Cliente;CPF/CNPJ;Tipo de Honorario;Origem;Valor Recebido;Data Recebimento`.

**Contrato:** consulta agregada sobre `parcelas` + `honorarios` + `clientes`. Funções de categorização, agregação e geração de CSV são puras e testáveis (§5).

---

### F11 — Importação por documento (OCR/IA)
**Comportamento**
- Upload de PDF/DOC (procuração, contrato) → `documentos` + arquivo no Storage.
- Edge Function `extrair-documento` chama provedor de OCR/IA e grava `dados_extraidos` (**nome, CPF, WhatsApp, e-mail, endereço** — os mesmos campos pré-preenchidos no mock do protótipo).
- O formulário de novo cliente pré-preenche com os dados extraídos; advogado revisa e confirma.
- Custo/limite de extração pode variar por plano.

**Contrato (Edge Function)**
```
POST /documentos/extrair  body: { storage_path } -> { dados_extraidos }
```

---

### F12 — Planos e limites
**Comportamento**
- Limites de clientes, honorários ativos e lembretes/mês conforme tabela do PRD §6.3.
- Verificação de limite ocorre no servidor (RLS/Edge/policy) — não confiar só no cliente.
- Upgrade/downgrade altera `profiles.plano`. *(Cobrança/billing fica fora do MVP de integração; documentar gancho para provedor de pagamento de assinatura.)*

---

## 4. Segurança e RLS

- **Toda** tabela de domínio tem policy: `advogado_id = auth.uid()` para `select/insert/update/delete`.
- `parcelas` carrega `advogado_id` desnormalizado para policy direta e performance.
- Página pública **não** usa `anon` direto nas tabelas; passa por Edge Function que filtra por token.
- `link_publico_token`: 128 bits, gerado server-side, único, sem informação derivável.
- Storage: bucket privado; acesso por URL assinada de curta duração.
- LGPD: rota/fluxo de exclusão de cliente e de conta (apaga dados pessoais).

---

## 5. Tipos derivados e testes

- Gerar tipos TypeScript do schema Supabase (`generate_typescript_types`) e versioná-los.
- **Funções puras testáveis** (independentes de backend): cálculo de status efetivo, geração de parcelas por tipo, máscara/validação de CPF e telefone, formatação monetária/data, montagem da mensagem de lembrete, agregação do relatório IR e geração do CSV.
- Cada funcionalidade da §3 tem testes derivados dos `Dado/Quando/Então`.

---

## 6. O que NÃO está nesta fase

Esta spec descreve o destino. **Nenhuma integração é criada agora** — sem provisionar Supabase, sem deploy Vercel, sem chaves de OCR, sem repositório remoto configurado. A implementação segue o [roadmap.md](roadmap.md) e as [tasks.md](tasks.md).
