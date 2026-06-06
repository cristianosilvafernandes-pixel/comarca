# PRD — Comarca Honorários

> Product Requirements Document
> Versão 1.0 · Junho/2026 · Status: Draft

---

## 1. Visão geral

**Comarca Honorários** é um SaaS para advogados autônomos e pequenos escritórios no Brasil acompanharem e cobrarem honorários sem perder parcelas por esquecimento. O produto envia lembretes via WhatsApp, gera contratos, mantém uma página pública de confirmação de pagamento via PIX e produz relatórios de rendimentos para o Imposto de Renda.

**Frase-âncora:** *"Advogado não perde honorário por falta de cliente. Perde por falta de cobrança."*

### 1.1. Diferencial central

- **Zero taxa de transação.** O Comarca nunca toca no dinheiro. O cliente paga direto na chave PIX do advogado, que recebe 100% na própria conta.
- **Sem custódia financeira.** Não há conta bancária integrada, gateway de pagamento ou intermediação. O status muda quando o advogado ou o cliente confirma o pagamento.
- **Foco em lembrança, não em cobrança agressiva.** Mensagens educadas, tom profissional, "lembrete amigável — não é cobrança formal".

---

## 2. Problema

Advogados perdem honorários por motivos operacionais, não por inadimplência real:

- Esquecem de cobrar a 2ª e a 3ª parcela de honorários parcelados.
- Honorários de êxito ficam meses sem cobrança após a vitória na causa.
- Usam planilhas que ninguém revisa e que não enviam lembretes.
- Estão focados em audiências e deixam vencimentos passarem.

O cliente, por sua vez, frequentemente "esquece" e não há um mecanismo neutro e educado que o lembre.

---

## 3. Personas

| Persona | Descrição | Dor principal |
|---|---|---|
| **Advogado autônomo** (primário) | Profissional solo, OAB ativa, gere 10–50 clientes, recebe via PIX. | Perde parcelas por falta de acompanhamento. |
| **Pequeno escritório** (secundário) | 2–5 advogados, volume maior de processos. | Falta de visão consolidada de recebíveis. |
| **Cliente do advogado** (terciário, não-paga) | Pessoa física que deve honorários. | Não tem lembrete claro nem forma fácil de confirmar pagamento. |

---

## 4. Objetivos e métricas de sucesso

### 4.1. Objetivos de produto
1. Reduzir honorários esquecidos/atrasados dos usuários.
2. Tornar o cadastro de cliente + honorário em menos de 60 segundos.
3. Aumentar a taxa de pagamento no prazo via lembrete antecipado (2 dias antes).

### 4.2. Métricas (North Star + suporte)
- **North Star:** valor de honorários marcados como pagos por usuário ativo/mês.
- Ativação: % de usuários que cadastram ≥3 clientes na 1ª semana.
- Engajamento: lembretes enviados / lembretes disponíveis.
- Retenção: retenção mensal de contas pagas.
- Conversão: free → pago.

---

## 5. Escopo do MVP

### 5.1. Dentro do escopo (replicar o protótipo, agora com backend real)

| # | Funcionalidade | Descrição |
|---|---|---|
| F1 | **Autenticação** | Cadastro/login por e-mail e senha. Perfil do advogado (nome, OAB, chave PIX). |
| F2 | **Clientes** | CRUD de clientes (nome, CPF, WhatsApp, e-mail, endereço). |
| F3 | **Honorários** | Cadastro de honorário vinculado a cliente, com 4 tipos (ver §6). |
| F4 | **Parcelas e status** | Geração de parcelas; status dinâmico (pendente, vencendo, atrasado, pago, pago em verificação). |
| F5 | **Dashboard** | Cards de resumo (pendentes, urgentes, confirmados), filtro por período e por status. |
| F6 | **Lembretes WhatsApp** | Mensagem pré-formatada e editável, aberta via link `wa.me` (envio manual pelo advogado). |
| F7 | **Marcar como pago** | Confirmação manual com origem do recebimento (PIX direto ou outra). |
| F8 | **Página pública de pagamento** | Página sem login, por link, com dados da parcela, chave PIX, QR Code e botão "confirmar pagamento". |
| F9 | **Geração de contrato** | Template de contrato de honorários editável; envio por WhatsApp. |
| F10 | **Relatório IR** | Rendimentos recebidos por ano, agrupados por tipo; exportação CSV. |
| F11 | **Importação por documento** | Upload de procuração/contrato com extração automática de dados do cliente (OCR/IA). |
| F12 | **Planos e limites** | Free / Essencial / Profissional com limites de clientes, honorários e lembretes. |

### 5.2. Fora do escopo do MVP (futuro)
- Envio automático de WhatsApp sem ação do advogado (requer WhatsApp Business API + aprovação Meta).
- Conciliação bancária / confirmação automática de PIX (webhook de PSP).
- App mobile nativo (o protótipo é responsivo/PWA-ready).
- Multiusuário com papéis dentro de um escritório.
- Assinatura digital de contrato.

---

## 6. Regras de negócio

### 6.1. Tipos de honorário
1. **Valor fixo parcelado** — valor total dividido em N parcelas com vencimentos.
2. **Ad exitum (êxito)** — percentual sobre valor da causa; lembrete ativado por gatilho de evento, não por data fixa.
3. **Recorrente** — valor mensal com data de início e (opcional) data de fim.
4. **Fixo + êxito** — entrada fixa + percentual de êxito sobre o resultado.

### 6.2. Status de parcela (cálculo dinâmico)
- `pago` — confirmado pelo advogado.
- `pago_verificacao` — cliente confirmou na página pública; aguarda validação do advogado.
- `atrasado` — vencimento < hoje e não pago.
- `vencendo` — vence em 0 a 2 dias.
- `pendente` — vence em mais de 2 dias.

### 6.2.1. Origem do pagamento e categorias fiscais (IR)
- **Origem:** `contratual` (pago pelo cliente) ou `sucumbencial` (pago pela parte contrária — exige CPF/CNPJ do pagador).
- **Categorias fiscais no relatório de IR:** Contratual, Êxito, Sucumbencial, Recorrente. Para `fixo_exitum`, a 1ª parcela é Contratual e as demais Êxito. Totais por grupo, total geral e totais por origem.

### 6.3. Limites por plano

| Recurso | Grátis (R$0) | Essencial (R$19/mês) | Profissional (R$37/mês) |
|---|---|---|---|
| Clientes | 3 | 10 | Ilimitado |
| Honorários ativos | 5 | 20 | Ilimitado |
| Lembretes/mês | 10 | 50 | Ilimitado |

### 6.4. Princípios financeiros (não-negociáveis)
- O Comarca **não** acessa conta bancária do advogado.
- O Comarca **não** cobra taxa sobre o PIX recebido.
- O pagamento ocorre fora da plataforma; o sistema apenas registra status.

---

## 7. Requisitos não-funcionais

- **Idioma:** pt-BR, com formatação monetária e de data brasileira.
- **Privacidade/LGPD:** dados sensíveis de clientes (CPF, contato). Consentimento, isolamento por usuário, direito a exclusão.
- **Segurança:** isolamento de dados por advogado (RLS); página pública acessível só por token não-adivinhável.
- **Responsividade:** mobile-first; o advogado opera majoritariamente do celular.
- **Performance:** dashboard carrega em < 2 s com até 100 honorários.
- **Disponibilidade:** alvo 99,5%.

---

## 8. Premissas e riscos

| Item | Tipo | Observação |
|---|---|---|
| Envio de WhatsApp é manual via `wa.me` no MVP | Premissa | Evita custo e aprovação da WhatsApp Business API na v1. |
| OCR/extração de documento usa IA | Premissa | Define custo por extração; pode ser limitado por plano. |
| Confirmação de pagamento é declaratória | Risco | Sem conciliação bancária, há risco de divergência; mitigado por status "em verificação". |
| Conformidade da geração de contrato | Risco | Template não substitui revisão jurídica; deixar disclaimer. |

---

## 9. Stack-alvo (referência — detalhada na spec)

- **Frontend:** app web responsivo hospedado na **Vercel**.
- **Backend/Dados/Auth/Storage:** **Supabase** (Postgres + Auth + Storage + Edge Functions + RLS).
- **Repositório/CI:** **GitHub** + GitHub Actions.
- **Integrações externas:** WhatsApp via `wa.me` (v1); provedor de OCR/IA para extração de documento; geração de QR Code PIX.

> Esta fase entrega **apenas documentação**. Nenhuma integração é configurada agora.
