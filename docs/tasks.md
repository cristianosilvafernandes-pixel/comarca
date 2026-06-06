# Tasks — Comarca Honorários

> Backlog de tarefas derivado de [roadmap.md](roadmap.md), [spec.md](spec.md) e [inventario-funcionalidades.md](inventario-funcionalidades.md).
> IDs estáveis (`T-xxx`) para referência em commits/PRs. Status: ☐ aberta · ◐ em andamento · ☑ concluída.
> **Garantia de paridade:** cada `INV-xxx` do inventário aponta para uma task aqui. Migração só fecha com todos os `INV` cobertos.

Legenda de tipo: `setup` · `db` · `backend` · `frontend` · `test` · `infra` · `docs`.

---

## Fase 0 — Documentação

| ID | Tipo | Tarefa | Dep. |
|---|---|---|---|
| T-001 | docs | ☑ Analisar protótipo e extrair funcionalidades | — |
| T-002 | docs | ☑ Escrever `prd.md` | T-001 |
| T-003 | docs | ☑ Escrever `spec.md` (modelo de dados + contratos) | T-001 |
| T-004 | docs | ☑ Escrever `roadmap.md` | T-002 |
| T-005 | docs | ☑ Escrever `tasks.md` | T-004 |
| T-006 | docs | ☐ Revisar e aprovar documentação com o dono do produto | T-002..005 |

---

## Fase 1 — Fundação

| ID | Tipo | Tarefa | Dep. |
|---|---|---|---|
| T-101 | docs | ☐ ADR: escolher framework frontend (Next.js App Router candidato) | T-006 |
| T-102 | infra | ☐ Criar repositório GitHub + `.gitignore`, README, licença | T-006 |
| T-103 | infra | ☐ Branch protection + convenção de commits/PR | T-102 |
| T-104 | setup | ☐ Scaffold do app frontend + TypeScript | T-101 |
| T-105 | frontend | ☐ Migrar design system do protótipo (CSS variables, tipografia, botões, cards, modais) | T-104 |
| T-106 | frontend | ☐ Extrair componentes base (Button, Card, Modal, Tabs, Toast, Badge, FormControl) | T-105 |
| T-107 | infra | ☐ Criar projeto Supabase (ambiente dev) | T-102 |
| T-108 | db | ☐ Migração inicial: `profiles`, `clientes`, `honorarios`, `parcelas`, `documentos`, `lembretes` | T-107 |
| T-109 | db | ☐ Habilitar RLS + policies `advogado_id = auth.uid()` em todas as tabelas | T-108 |
| T-110 | db | ☐ Trigger `on auth.users insert` → cria `profiles` (plano free) | T-108 |
| T-111 | setup | ☐ Gerar tipos TypeScript do schema e versionar | T-108 |
| T-112 | setup | ☐ Cliente Supabase no frontend (anon key, env vars) | T-104, T-107 |
| T-113 | infra | ☐ Deploy Vercel + previews por PR + env vars | T-104 |
| T-114 | infra | ☐ CI GitHub Actions: lint, type-check, testes | T-104 |
| T-115 | test | ☐ Setup de testes (unitário + E2E) | T-104 |
| T-150 | frontend | ☐ Migrar landing page (hero, problema, como funciona, features, preços, FAQ) — INV-131..136 | T-105 |

---

## Fase 2 — Auth + Clientes

| ID | Tipo | Tarefa | Dep. |
|---|---|---|---|
| T-201 | frontend | ☐ Tela de login/cadastro (porta do protótipo) | T-106 |
| T-202 | backend | ☐ Fluxo Auth: signUp/signIn/signOut com Supabase Auth | T-112 |
| T-203 | frontend | ☐ Tela/perfil do advogado: nome, OAB, chave PIX, **foro** (P-02) | T-202 |
| T-204 | backend | ☐ Persistir/editar `profiles` (inclui `foro`) | T-110 |
| T-205 | test | ☐ Função pura: validação de CPF | T-115 |
| T-206 | test | ☐ Função pura: normalização de WhatsApp (E.164) | T-115 |
| T-207 | frontend | ☐ Tela de Clientes (lista + cards) | T-201 |
| T-208 | frontend | ☐ Modal Novo/Editar Cliente com máscaras e validações | T-207 |
| T-209 | backend | ☐ CRUD de clientes via SDK (com RLS) | T-109 |
| T-210 | backend | ☐ Enforcement de limite de clientes por plano | T-209 |
| T-211 | backend | ☐ Excluir cliente com checagem de honorários vinculados | T-209 |
| T-212 | test | ☐ Testes do fluxo de clientes (Dado/Quando/Então da spec F2) | T-209 |

---

## Fase 3 — Honorários + Parcelas + Dashboard

| ID | Tipo | Tarefa | Dep. |
|---|---|---|---|
| T-301 | test | ☐ Função pura: geração de parcelas `fixo_parcelado` | T-115 |
| T-302 | test | ☐ Função pura: geração `recorrente` (início/fim) | T-115 |
| T-303 | test | ☐ Função pura: regras `ad_exitum` e `fixo_exitum` | T-115 |
| T-304 | test | ☐ Função pura: cálculo de status efetivo (pendente/vencendo/atrasado) | T-115 |
| T-305 | frontend | ☐ Modal Novo Honorário (seletor de tipo + campos condicionais) | T-208 |
| T-306 | backend | ☐ Persistir honorário + parcelas (transação) | T-209 |
| T-307 | backend | ☐ Enforcement de limite de honorários ativos por plano | T-306 |
| T-308 | frontend | ☐ Dashboard: cards de resumo (pendentes/urgentes/confirmados) | T-306 |
| T-309 | frontend | ☐ Dashboard: filtro por período (mês/ano/todos/customizado) | T-308 |
| T-310 | frontend | ☐ Dashboard: tabs de status + badges de contagem | T-308 |
| T-311 | frontend | ☐ Lista de honorários/parcelas (fee cards com cor por status) | T-308 |
| T-312 | frontend | ☐ Tela de detalhes do honorário/cliente | T-311 |
| T-313 | frontend | ☐ Ação "marcar como pago" + origem do recebimento | T-311 |
| T-314 | backend | ☐ Persistir pagamento (`status_registrado=pago`, data, origem) | T-313 |
| T-315 | test | ☐ Testes de dashboard/agregações (spec F5) | T-308 |
| T-316 | frontend | ☐ Ação "Registrar êxito" (valor resultado, data, vencimento) → gera parcela de êxito; "Encerrar sem êxito" (P-04) | T-305 |
| T-317 | test | ☐ Função pura: cálculo `valor_exito = percentual × valor_resultado` + estado derivado `aguardando_exito` | T-115 |

---

## Fase 4 — Cobrança + Página pública

| ID | Tipo | Tarefa | Dep. |
|---|---|---|---|
| T-401 | test | ☐ Função pura: montagem da mensagem de lembrete | T-115 |
| T-402 | frontend | ☐ Modal de lembrete (mensagem editável) + abrir `wa.me` | T-311 |
| T-403 | backend | ☐ Registrar envio em `lembretes` | T-402 |
| T-404 | backend | ☐ Enforcement de limite mensal de lembretes por plano | T-403 |
| T-405 | db | ☐ Coluna/índice `link_publico_token` + geração server-side (128 bits) | T-108 |
| T-406 | backend | ☐ Edge Function `GET /public/honorario/:token` (dados mínimos) | T-405 |
| T-407 | backend | ☐ Edge Function `POST /public/.../confirmar` → `pago_verificacao` | T-405 |
| T-408 | frontend | ☐ Página pública (sem login): dados, PIX, QR Code, confirmar | T-406 |
| T-409 | backend | ☐ Geração de QR Code PIX (payload BR Code) | T-408 |
| T-410 | frontend | ☐ Fluxo do advogado: validar confirmação pendente → `pago` | T-313 |
| T-411 | test | ☐ Testes da página pública e do gating por token (spec F8) | T-406 |

---

## Fase 5 — Contrato + IR + Importação por documento

| ID | Tipo | Tarefa | Dep. |
|---|---|---|---|
| T-501 | frontend | ☐ Tela Gerar Contrato (seletor cliente, objeto, valor, texto editável) | T-207 |
| T-502 | backend | ☐ Template de contrato versionado + merge de campos + **foro configurável** (P-02) | T-501 |
| T-503 | frontend | ☐ Enviar contrato por WhatsApp + download PDF | T-502 |
| T-504 | test | ☐ Função pura: agregação do relatório IR por ano/tipo | T-115 |
| T-505 | frontend | ☐ Tela Relatório IR (filtro por ano + tabela) | T-504 |
| T-506 | backend | ☐ Exportação CSV (encoding/separador pt-BR) | T-505 |
| T-507 | infra | ☐ Bucket de Storage privado + URLs assinadas | T-107 |
| T-508 | frontend | ☐ Upload de documento na criação de cliente | T-507 |
| T-509 | backend | ☐ Edge Function `extrair-documento` (provedor OCR/IA) | T-507 |
| T-510 | frontend | ☐ Pré-preencher formulário com `dados_extraidos` (revisão do advogado) | T-509 |
| T-511 | test | ☐ Testes de IR/CSV e do fluxo de extração (spec F10/F11) | T-504 |

---

## Fase 6 — Planos, billing e endurecimento

| ID | Tipo | Tarefa | Dep. |
|---|---|---|---|
| T-601 | frontend | ☐ Tela de planos (Free/Essencial/Profissional) | T-203 |
| T-602 | backend | ☐ Enforcement central de limites no servidor | T-210, T-307, T-404 |
| T-603 | infra | ☐ Integração de billing de assinatura (provedor de pagamento) | T-601 |
| T-604 | backend | ☐ LGPD: exclusão de cliente e de conta (apaga dados pessoais) | T-209 |
| T-605 | docs | ☐ Política de privacidade + termos | T-604 |
| T-606 | infra | ☐ Observabilidade: logs, alertas, Supabase advisors | T-113 |
| T-607 | test | ☐ Revisão de RLS + testes E2E críticos | T-109 |
| T-608 | infra | ☐ Hardening de performance (dashboard < 2s com 100 honorários) | T-308 |

---

## Notas

- IDs nunca são reaproveitados; tarefas canceladas viram `☒ (cancelada)` mantendo o ID.
- Cada PR referencia o `T-xxx` que implementa.
- Critério de pronto de uma task: comportamento bate com a spec, testes passam, RLS validado quando aplicável.
