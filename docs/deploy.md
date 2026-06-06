# Runbook de Deploy & Configuração — Comarca Honorários

> Passos finais para colocar o app no ar. Tudo que exige clique/credencial sua,
> em ordem. Projeto Supabase: **`enhiukvvxpzudujctljk`**.

---

## 0. Pré-requisitos
- Supabase CLI logado: `supabase login`
- Conta Vercel
- `.env.local` já preenchido (URL + anon/publishable key). **Nunca commitar** (`.gitignore` cobre `.env*`).

---

## 1. Aplicar migrações pendentes

Migrações versionadas em `supabase/migrations/`. Falta aplicar a **0005** (limites de honorários e lembretes).

```bash
supabase link --project-ref enhiukvvxpzudujctljk
supabase db push          # aplica migrations não aplicadas (0005)
```

> A 0004 (bucket Storage `documentos`) foi aplicada fora do versionamento (painel/MCP).
> Se `db push` reclamar de histórico, aplique 0005 manualmente pelo SQL Editor
> (cole o conteúdo de `supabase/migrations/0005_limites_honorarios_lembretes.sql`).

Verificar:
```sql
select tgname from pg_trigger
where tgname in ('trg_limite_honorarios','trg_limite_lembretes');
-- deve retornar 2 linhas
```

---

## 2. Redeploy das Edge Functions

Há um **fix** local em `public-honorario` (extração de token aceita path e query)
ainda não publicado.

```bash
supabase functions deploy public-honorario
# (as outras já estão ACTIVE; redeploy se mudar algo)
# supabase functions deploy public-confirmar
# supabase functions deploy extrair-documento
```

---

## 3. Secrets das Edge Functions

`SUPABASE_URL`/`ANON`/`SERVICE_ROLE` são injetados pelo runtime. Faltam os manuais:

```bash
# CORS da página pública: domínios que podem chamar as functions do browser.
supabase secrets set ALLOWED_ORIGINS="https://SEU_DOMINIO.vercel.app,http://localhost:3000"

# OCR (F11 — extração de documento). Só necessário quando ativar o upload.
supabase secrets set OCR_API_URL="https://..." OCR_API_KEY="..."
```

> Sem `ALLOWED_ORIGINS`, chamadas **diretas do browser** às functions são bloqueadas
> por CORS. A página pública `/h/:token` contorna isso (chama server-side via
> `src/lib/public-api.ts` + route handler de confirmação), então funciona mesmo sem
> esse secret — mas configure para qualquer chamada client-side futura.

---

## 4. Configuração de Auth (painel Supabase → Authentication)

- **Email provider**: ON (senha). Desabilitar provedores não usados.
- **Confirm email**: ON.
- **Leaked password protection**: ON. Senha mínima 8.
- **Secure email/password change**: ON. Refresh token rotation: ON.
- **Site URL**: `https://SEU_DOMINIO.vercel.app`
- **Redirect URLs** (allow list): adicionar
  - `https://SEU_DOMINIO.vercel.app/auth/confirm`
  - `http://localhost:3000/auth/confirm` (dev)
  - previews: `https://*-SEU_PROJETO.vercel.app/auth/confirm`

> O cadastro usa `emailRedirectTo = ${SITE_URL}/auth/confirm`. Sem a redirect URL
> liberada, o link de confirmação falha.

---

## 5. Deploy na Vercel

1. **Import** do repositório GitHub na Vercel (framework Next.js detectado).
2. **Environment Variables** (Production + Preview):
   | Var | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://enhiukvvxpzudujctljk.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon key do projeto) |
   | `NEXT_PUBLIC_SITE_URL` | `https://SEU_DOMINIO.vercel.app` |
3. **Deploy**.
4. Pós-deploy: volte ao passo 4 e ajuste **Site URL / Redirect URLs** para o domínio real.

> `NEXT_PUBLIC_*` são públicas por design (RLS protege). `SERVICE_ROLE`/`OCR_*`
> **nunca** vão para a Vercel — só nas Edge Functions (passo 3).

---

## 6. Smoke test pós-deploy

```bash
DOM=https://SEU_DOMINIO.vercel.app
curl -s -o /dev/null -w "%{http_code}\n" $DOM/                # 200 landing
curl -s -o /dev/null -w "%{http_code}\n" $DOM/login           # 200
curl -s -o /dev/null -w "%{http_code}\n" $DOM/dashboard       # 307 -> /login (guard)
curl -s -o /dev/null -w "%{http_code}\n" $DOM/h/<token32hex>  # 200 (ou "não encontrado")
```

- Criar conta → confirmar e-mail → login → cadastrar cliente/honorário.
- Abrir link público `/h/:token` de um honorário, confirmar pagamento → `pago_verificacao`.
- Marcar pago no painel → some de Urgentes; aparece em Confirmados.
- Relatório IR → exportar CSV.

---

## 7. Checklist de segurança (doc.md §12)

- [ ] RLS ON em todas as tabelas de domínio; 4 policies `advogado_id = auth.uid()`.
- [ ] Nenhuma policy `using (true)` em tabela de domínio.
- [ ] Bucket `documentos` privado; download só por URL assinada.
- [ ] `service_role` ausente do frontend e do repositório.
- [ ] Página pública não acessa tabelas com `anon` — só via Edge Functions.
- [ ] `link_publico_token` 128 bits, único, indexado.
- [ ] Funções `security definer` com `search_path = ''`.
- [ ] Limites de plano por trigger (clientes ✓, honorários ✓, lembretes ✓ — após 0005).
- [ ] Rodar **Supabase Advisors** (Security + Performance) → 0 alertas.
- [ ] Backups/PITR no projeto de produção.

---

## 8. O que ainda é desenvolvimento (não bloqueia deploy)

- **F11** upload de documento + OCR: edge `extrair-documento` pronta; falta a UI no
  fluxo de cliente + secrets `OCR_*`.
- Tratamento de erro `23514` (limite) nas actions de honorário/lembrete (mensagem amigável).
- Billing de assinatura (provedor de pagamento) para a troca de plano.
