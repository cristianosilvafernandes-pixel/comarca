# Inventário de Funcionalidades & Matriz de Rastreabilidade

> Garantia de paridade total: **toda** funcionalidade, tela, fluxo e regra do protótipo mapeada para a spec e para as tasks.
> Versão 1.0 · Junho/2026 · Fonte: `prototipo/comarca_honorarios_v1.html` (3397 linhas) + `Pagina_Comarca_honorarios_v01.html` (landing).

---

## 0. Como usar este documento

Este inventário é a **lista de verificação de paridade**. A migração só é considerada completa quando **todos** os itens abaixo estiverem implementados e validados contra a [spec.md](spec.md). Cada item tem um ID (`INV-xxx`), o nome da função/elemento no protótipo, o comportamento esperado, a seção da spec e a(s) task(s) correspondente(s).

> **Nota sobre arquitetura:** o protótipo é um SPA de arquivo único com `localStorage` e roteamento por hash. A migração para Supabase + Vercel **muda a arquitetura técnica** (persistência, auth, multiusuário, RLS) mas **preserva integralmente** as funcionalidades, telas, fluxos, regras de negócio e a UX listadas aqui. Paridade é de **comportamento e experiência**, não de implementação.

---

## 1. Rotas (roteamento por hash → rotas reais)

| INV | Rota protótipo (hash) | Tela | Equivalente alvo | Spec | Task |
|---|---|---|---|---|---|
| INV-001 | `#/login` | screen-login | `/login` | F1 | T-201 |
| INV-002 | `#/dashboard` | screen-dashboard | `/dashboard` | F5 | T-308 |
| INV-003 | `#/clientes` | screen-clientes | `/clientes` | F2 | T-207 |
| INV-004 | `#/novo-cliente` | modal-novo-cliente | `/clientes` + modal | F2 | T-208 |
| INV-005 | `#/novo-honorario/:clienteId` | modal-novo-honorario | modal | F3 | T-305 |
| INV-006 | `#/honorario/:id` | screen-honorario-detalhes | `/honorario/:id` | F4 | T-312 |
| INV-007 | `#/relatorio-ir` | screen-relatorio-ir | `/relatorio-ir` | F10 | T-505 |
| INV-008 | `#/gerar-contrato` | screen-contratos | `/gerar-contrato` | F9 | T-501 |
| INV-009 | `#/h/:token` | screen-public (sem login) | `/h/:token` (SSR/edge) | F8 | T-408 |
| INV-010 | Guard de sessão (`sessionStorage`) + redirect p/ login | router() | Supabase Auth + guard | F1 | T-202 |

---

## 2. Autenticação & perfil

| INV | Função/elemento protótipo | Comportamento | Spec | Task |
|---|---|---|---|---|
| INV-011 | `handleLoginSubmit` | Login por e-mail/senha + "lembrar de mim" | F1 | T-202 |
| INV-012 | "Criar conta grátis" | Cadastro de novo advogado (plano free) | F1 | T-202 |
| INV-013 | `logout` | Encerrar sessão | F1 | T-202 |
| INV-014 | Cabeçalho: nome + OAB + avatar (iniciais) | Perfil do advogado exibido | F1 | T-203 |

> Dados do advogado hoje hardcoded ("Dr. Yago Caldeira, OAB/RS 107.295") viram campos editáveis em `profiles`.

---

## 3. Clientes

| INV | Função/elemento | Comportamento | Spec | Task |
|---|---|---|---|---|
| INV-021 | `handleSaveCliente` | Criar/editar cliente (nome, CPF, WhatsApp, e-mail, endereço) | F2 | T-209 |
| INV-022 | `editarCliente` | Editar cliente existente | F2 | T-208 |
| INV-023 | `renderClientes` | Lista de clientes (card + avatar de iniciais + resumo de honorários) | F2 | T-207 |
| INV-024 | `handleDocUpload` (mock OCR, 1,5 s) | Upload de procuração/contrato → extrai **nome, CPF, WhatsApp, e-mail, endereço** → pré-preenche form | F11 | T-509, T-510 |
| INV-025 | `resetUploadZone` | Estados da zona de upload (default/loading/success) | F11 | T-508 |
| INV-026 | `applyMasks` | Máscaras de CPF e telefone | F2 | T-208 |
| INV-027 | Botão "Novo Honorário" a partir do cliente | Atalho para criar honorário do cliente | F3 | T-305 |

---

## 4. Honorários — cadastro e os 4 tipos

| INV | Elemento | Comportamento | Spec | Task |
|---|---|---|---|---|
| INV-031 | Seção 1: Dados do processo | Processo (opcional), Área (8 opções), Tribunal (7 opções), Parte contrária (opcional) | F3 | T-305 |
| INV-032 | `setNhTipo` | Alterna campos dinâmicos conforme o tipo | F3 | T-305 |
| INV-033 | Tipo **fixo_parcelado** | Valor total, nº parcelas (1–12), **frequência (Mensal/Quinzenal/Única)**, data da 1ª parcela | F3 | T-301 |
| INV-034 | `calcValParcela` | Cálculo do valor por parcela (visual) | F3 | T-301 |
| INV-035 | **À-vista marcável como já pago** (`nh-a-vista-pago`, aparece em 1x) | Cria honorário já quitado hoje | F3 | T-306 |
| INV-036 | Tipo **ad_exitum** | Percentual + valor estimado da causa; `calcValEstExitum`; parcela de sucesso lançada manualmente após sentença | F3 | T-303 |
| INV-037 | Tipo **recorrente** | Valor mensal, data início, data fim, checkbox "sem data fim" (`toggleRecorrenteDataFim`) | F3 | T-302 |
| INV-038 | Tipo **fixo_exitum** | Valor de entrada (vira parcela inicial) + percentual de êxito (apurado no encerramento) | F3 | T-303 |
| INV-039 | Seção 3: **Chave PIX por honorário** (`nh-pix`) | PIX específico do honorário | F3 | T-306 |
| INV-040 | `handleSaveHonorario` + geração de parcelas | Persiste honorário + gera parcelas conforme tipo | F4 | T-306 |
| INV-041 | `modal-confirmacao-honorario` | Popup de sucesso com resumo + "ver dashboard" / "novo honorário" + aviso de lembrete 2 dias antes | F3 | T-305 |
| INV-042 | `excluirHonorarioIndividual` | Excluir honorário (com confirmação) | F4 | T-306 |

---

## 5. Parcelas & status

| INV | Função | Comportamento | Spec | Task |
|---|---|---|---|---|
| INV-051 | `resolveStatus` | Status efetivo: `pago` / `pago_verificacao` / `atrasado` (venc < hoje) / `vencendo` (0–2 dias) / `pendente` | F4 | T-304 |
| INV-052 | Campos da parcela | numero, valor, vencimento, status, dataPagamento, **origemPagamento**, **docPagador**, **confirmado_cliente** | §2.4 | T-306 |

---

## 6. Dashboard

| INV | Elemento | Comportamento | Spec | Task |
|---|---|---|---|---|
| INV-061 | 3 summary cards | **Pendentes**, **Urgentes** (atraso+vencendo), **Confirmados** — com valor R$ + contagem | F5 | T-308 |
| INV-062 | `changePeriodFilter` / `checkPeriod` | Filtro por período: este mês / este ano / todos / **customizado (data de–até)** | F5 | T-309 |
| INV-063 | `filterDashboard` + tabs | Tabs: Todos / Pendentes / Vencendo / Atrasados / Pagos + **badges de contagem** | F5 | T-310 |
| INV-064 | `renderDashboard` (fee-cards) | Cards com borda colorida por status + ações | F5 | T-311 |
| INV-065 | FAB "Novo honorário" | Botão flutuante | F5 | T-311 |
| INV-066 | `renderHonorarioDetalhes` | Tela de detalhes do cliente + processos + parcelas | F4 | T-312 |

---

## 7. Lembrete WhatsApp

| INV | Função | Comportamento | Spec | Task |
|---|---|---|---|---|
| INV-071 | `openModalLembrete` | Abre modal com destinatário + WhatsApp | F6 | T-402 |
| INV-072 | `generateLembreteMessageText` | Monta mensagem: saudação, processo, (área-tribunal), parcela n/total, valor, vencimento, **boleto (opcional)**, chave PIX, **link público**, assinatura advogado | F6 | T-401 |
| INV-073 | Campo **código de barras de boleto** (`lembrete-boleto-codigo`) | Linha de boleto opcional na mensagem | F6 | T-402 |
| INV-074 | `btn-enviar-whatsapp` | Copia mensagem p/ clipboard + abre `wa.me/55<numero>?text=` | F6 | T-402 |

---

## 8. Confirmação de recebimento (advogado)

| INV | Função | Comportamento | Spec | Task |
|---|---|---|---|---|
| INV-081 | `marcarComoPago` | Abre modal de confirmação da parcela | F7 | T-313 |
| INV-082 | `toggleRecebimentoOrigem` | **Origem: contratual (cliente) vs sucumbencial (parte contrária)** | F7 | T-313 |
| INV-083 | Campo `cr-pagador-doc` (só sucumbencial) | **CPF/CNPJ do pagador** quando sucumbencial | F7 | T-313 |
| INV-084 | `handleExecuteRecebimento` | Grava `status=pago`, `dataPagamento=hoje`, `origemPagamento`, `docPagador` | F7 | T-314 |

---

## 9. Página pública de pagamento (sem login)

| INV | Função | Comportamento | Spec | Task |
|---|---|---|---|---|
| INV-091 | `renderPublicView` | Mostra **parcela em aberto mais próxima**; advogado/OAB, cliente, processo, parcela n/total, valor, vencimento, chave PIX | F8 | T-408 |
| INV-092 | 3 estados | **Aguardando** / **Em análise** (`pago_verificacao`) / **Pago** — badge + texto distintos | F8 | T-408 |
| INV-093 | `copyPixKey` + QR Code | Copiar chave PIX + QR Code (fake no protótipo → BR Code real) | F8 | T-409 |
| INV-094 | `executePublicConfirmPayment` | Cliente confirma → `status=pago_verificacao` + `confirmado_cliente=true` | F8 | T-407 |
| INV-095 | Link inválido/expirado | Tela de erro "Lembrete não encontrado" | F8 | T-406 |
| INV-096 | Rodapé "lembrete amigável, não é cobrança formal" | Disclaimer | F8 | T-408 |

---

## 10. Geração de contrato

| INV | Função | Comportamento | Spec | Task |
|---|---|---|---|---|
| INV-101 | `populateContratosClienteSelect` | Seletor de cliente | F9 | T-501 |
| INV-102 | `loadContratoTemplate` | Template editável: objeto, valor, dados do cliente, **foro Pelotas/RS**, data de hoje, blocos de assinatura | F9 | T-502 |
| INV-103 | `enviarContratoWhatsApp` | Abre `wa.me/55<numero>` com o texto | F9 | T-503 |
| INV-104 | `baixarContratoSimulado` | Hoje: alerta "em breve PDF c/ assinatura digital" → **download PDF real** | F9 | T-503 |

---

## 11. Relatório de IR

| INV | Função | Comportamento | Spec | Task |
|---|---|---|---|---|
| INV-111 | `populateYearSelect` | Seletor de ano de apuração | F10 | T-505 |
| INV-112 | `renderRelatorioIR` | Lista parcelas **pagas** no ano, agrupadas em **4 categorias: Contratual / Êxito / Sucumbencial / Recorrente** | F10 | T-504 |
| INV-113 | Regra `fixo_exitum` no IR | Parcela 1 = Contratual; demais = Êxito | F10 | T-504 |
| INV-114 | Origem sucumbencial no IR | Usa `docPagador` como CPF/CNPJ na linha | F10 | T-504 |
| INV-115 | Totais | Total por grupo + **total geral** + **total por origem (contratual/sucumbencial)** | F10 | T-504 |
| INV-116 | `exportarRelatorioCSV` | CSV: separador `;`, BOM `﻿`, vírgula decimal, arquivo `Apuraçao_IR_Comarca_{ano}.csv` | F10 | T-506 |

---

## 12. Utilitários, UI e infraestrutura do protótipo

| INV | Item | Comportamento | Spec | Task |
|---|---|---|---|---|
| INV-121 | `formatCurrency` / `formatDate` / `parseCurrencyToFloat` / `calculateDaysDifference` | Formatação e parsing pt-BR | §5 | T-205/206 |
| INV-122 | `showToast` | Notificações toast | UI | T-106 |
| INV-123 | `toggleSidebar` + sidebar responsiva | Navegação lateral / drawer mobile | UI | T-105 |
| INV-124 | Design system (CSS variables, cores de status, cards, modais, badges, FAB, upload-zone) | Aparência idêntica | §1.1 | T-105 |
| INV-125 | Empty states | Estados vazios em listas | UI | T-311 |
| INV-126 | Persistência (`localStorage`/`sessionStorage`) | → Postgres (Supabase) + Auth | §1, §2 | T-108 |

---

## 13. Landing page (`Pagina_Comarca_honorarios_v01.html`)

| INV | Seção | Conteúdo | Task |
|---|---|---|---|
| INV-131 | Hero | "Nunca mais perca um honorário esquecido" + CTA | T-501* |
| INV-132 | Problema | "Por que advogados perdem honorários" | — |
| INV-133 | Como funciona | 4 passos (cadastrar → lembrar → cobrar → marcar pago) | — |
| INV-134 | Features | Parcelas no radar / Honorário de êxito / Inadimplência zerada | — |
| INV-135 | **Preços** | Grátis R$0 (3/5/10) · Essencial R$19 (10/20/50) · Profissional R$37 (ilimitado) | T-601 |
| INV-136 | FAQ | Taxa PIX, conta bancária, planilha, acesso bancário | — |

> A landing precisa de uma task própria de migração (atualmente fora do backlog técnico). Ver pendência P-03 abaixo.

---

## 14. Pendências / lacunas a decidir

| ID | Pendência | Impacto |
|---|---|---|
| P-01 | Dados do advogado hardcoded no protótipo (Yago Caldeira) → tornar dinâmicos via `profiles` | Já coberto (T-203/204) |
| P-01 | ✅ **Resolvida.** Dados do advogado vêm de `profiles` (nome/OAB/PIX/foro), editáveis no perfil. | T-203/T-204 |
| P-02 | ✅ **Resolvida.** `foro` é campo de `profiles`, configurável no perfil e default no contrato. | spec F1/F9, T-203/T-502 |
| P-03 | ✅ **Resolvida.** Task de migração da landing criada. | T-150 |
| P-04 | ✅ **Resolvida.** Ciclo de vida do êxito definido: estado derivado `aguardando_exito` → ação "Registrar êxito" gera a parcela; "Encerrar sem êxito". | spec F3/F4, T-316/T-317 |
| P-05 | ✅ **Resolvida.** Design system = **Vercel Geist** (Geist Sans/Mono, monocromático + azul #0070f3, cantos arredondados 6/8/12px, dark mode nativo). Substituiu o IBM Carbon. | DESIGN.md |

---

## 15. Resumo de cobertura

- **Rotas:** 10/10 mapeadas.
- **Telas + modais:** 9 telas + 6 modais → todas mapeadas.
- **Funções JS:** 47/47 mapeadas.
- **Regras de negócio (tipos, status, IR, origem):** mapeadas, com correções aplicadas à spec.
- **Landing page:** mapeada (task T-150).
- **Pendências P-01..P-05:** todas resolvidas.

Critério de "migração completa": todos os `INV-xxx` implementados e validados.
