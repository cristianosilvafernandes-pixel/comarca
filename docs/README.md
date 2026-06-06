# Documentação — Comarca Honorários

SaaS para advogados acompanharem e cobrarem honorários sem perder parcelas por esquecimento. Lembretes via WhatsApp, página pública de pagamento PIX, contratos e relatório de IR. **Zero taxa: o advogado recebe 100% direto na sua chave PIX.**

Esta pasta contém a documentação que precede a implementação. **Fase atual: documentação apenas — nenhuma integração (Supabase, Vercel, GitHub remoto, APIs) foi configurada.**

## Documentos

| Documento | Conteúdo |
|---|---|
| [prd.md](prd.md) | Product Requirements: problema, personas, escopo do MVP, regras de negócio, planos. |
| [spec.md](spec.md) | Spec-Driven Development: arquitetura-alvo, modelo de dados, contratos por funcionalidade, RLS. |
| [roadmap.md](roadmap.md) | Fases (0 a 6) e marcos da evolução protótipo → produção. |
| [tasks.md](tasks.md) | Backlog com IDs estáveis (`T-xxx`) por fase. |
| [inventario-funcionalidades.md](inventario-funcionalidades.md) | Matriz de rastreabilidade: toda função/tela/fluxo do protótipo → spec → task. Garantia de paridade total. |
| [doc.md](doc.md) | Guia Supabase: DDL completo, RLS, triggers, Storage, Edge Functions, limites de plano, segurança e LGPD. |
| [edge-functions.md](edge-functions.md) | Código de referência (TS/Deno) das 3 Edge Functions: `public-honorario`, `public-confirmar`, `extrair-documento`. |
| [DESIGN.md](../DESIGN.md) | Design system fundado no Vercel Geist: tokens de cor/tipografia/espaçamento, componentes, status de parcela, dark mode. |

## Ordem de leitura sugerida

1. **prd.md** — o quê e por quê.
2. **spec.md** — como, em detalhe técnico.
3. **roadmap.md** — em que ordem.
4. **tasks.md** — tarefas executáveis.

## Stack-alvo

Frontend na **Vercel** · Backend/Auth/Dados/Storage no **Supabase** (Postgres + RLS + Edge Functions) · Repo/CI no **GitHub** · WhatsApp via `wa.me` (v1) · OCR/IA para extração de documento.

## Protótipo de origem

`../prototipo/` — HTML/CSS/JS estático com dados em `localStorage` (sem backend). É a referência funcional e de design a ser portada.
