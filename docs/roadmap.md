# Roadmap — Comarca Honorários

> Plano de evolução do protótipo HTML para produto em produção.
> Versão 1.0 · Junho/2026 · Acompanha [prd.md](prd.md) e [spec.md](spec.md)

---

## Princípios de sequenciamento

1. **Documentação primeiro** (fase atual) — nada de integração.
2. **Fundação antes de feature** — repo, tipos, schema e auth antes de telas.
3. **Vertical slices** — entregar uma funcionalidade ponta a ponta (dados + UI + teste) antes da próxima.
4. **Spec-driven** — toda fase valida contra [spec.md](spec.md).

---

## Fase 0 — Documentação ✅ (atual)

**Objetivo:** alinhar o que será construído, sem escrever código de integração.

- [x] Análise do protótipo.
- [x] `prd.md`, `spec.md`, `roadmap.md`, `tasks.md`.
- [ ] Revisão e aprovação dos documentos pelo dono do produto.

**Entrega:** pasta `docs/` completa e aprovada.
**Sem:** Supabase, Vercel, GitHub remoto, chaves de API.

---

## Fase 1 — Fundação do projeto

**Objetivo:** esqueleto técnico pronto para receber features.

- Repositório GitHub, branch protection, convenções de commit.
- Scaffold do frontend (framework definido em ADR) + design system migrado do protótipo (CSS variables, componentes).
- Projeto Supabase (dev), migrações iniciais do schema (§2 da spec).
- RLS habilitado em todas as tabelas de domínio.
- Geração de tipos TypeScript do schema.
- Deploy contínuo na Vercel com preview por PR.
- CI no GitHub Actions (lint, type-check, testes).

**Entrega:** app vazio que builda, deploya e fala com o Supabase de dev.

---

## Fase 2 — Auth + Clientes (primeiro slice vertical)

**Objetivo:** primeiro fluxo real ponta a ponta.

- F1: cadastro/login, perfil do advogado (nome, OAB, PIX), trigger de `profiles`.
- F2: CRUD de clientes com validações e RLS.
- Limites de plano para clientes (F12 parcial).
- Testes das funções puras (CPF, telefone, formatações).

**Entrega:** advogado cria conta, faz login e gere seus clientes.

---

## Fase 3 — Honorários, parcelas e dashboard (núcleo do produto)

**Objetivo:** o coração funcional.

- F3/F4: cadastro de honorários nos 4 tipos + geração de parcelas.
- Cálculo de status efetivo (função pura testada).
- F5: dashboard com resumos, filtros por período e status, badges.
- F7: marcar como pago (com origem).

**Entrega:** advogado acompanha recebíveis e marca pagamentos.

---

## Fase 4 — Cobrança e página pública

**Objetivo:** fechar o loop de cobrança.

- F6: lembrete WhatsApp via `wa.me` + registro em `lembretes` + limite mensal.
- F8: página pública de pagamento (Edge Functions por token, QR Code PIX, confirmar pagamento → `pago_verificacao`).
- Notificação ao advogado de confirmação pendente.

**Entrega:** advogado envia lembrete; cliente confirma pagamento por link.

---

## Fase 5 — Contrato, relatório IR e importação por documento

**Objetivo:** ferramentas de apoio que aumentam retenção.

- F9: geração de contrato a partir de template + envio WhatsApp + download (PDF).
- F10: relatório IR por ano + exportação CSV.
- F11: upload de documento + Edge Function de extração OCR/IA + pré-preenchimento de cliente.

**Entrega:** advogado gera contratos, fecha o IR e cadastra cliente por documento.

---

## Fase 6 — Planos, billing e endurecimento

**Objetivo:** monetização e prontidão para produção.

- F12 completo: enforcement de limites no servidor; tela de planos.
- Integração de billing de assinatura (provedor de pagamento) — *fora do escopo de integração da fase 0, planejado aqui*.
- LGPD: exclusão de dados/conta; política de privacidade.
- Observabilidade (logs, alertas), advisors de segurança Supabase, revisão de RLS.
- Hardening de performance e testes E2E.

**Entrega:** produto cobrável, seguro e monitorado.

---

## Marcos

| Marco | Fases | Resultado |
|---|---|---|
| **M0 — Docs aprovadas** | 0 | Escopo congelado para implementação. |
| **M1 — Fundação** | 1 | Pipeline e backend de dev de pé. |
| **M2 — MVP utilizável** | 2–3 | Advogado gere clientes e honorários. |
| **M3 — MVP de cobrança** | 4 | Loop de lembrete + confirmação fechado. |
| **M4 — Feature-complete** | 5 | Paridade com o protótipo, com backend real. |
| **M5 — Produção/monetização** | 6 | Cobrança, LGPD, observabilidade. |

> Sem datas fixadas nesta versão. Estimativas entram após a aprovação da Fase 0 e a definição do framework (ADR da Fase 1).
