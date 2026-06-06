# Supabase Edge Functions — Implementação de Referência

> Código (TypeScript/Deno) das 3 Edge Functions do projeto.
> Versão 1.0 · Junho/2026 · Detalha §9 de [doc.md](doc.md) · Spec F8/F11
>
> **Documentação / código de referência.** Nada é deployado agora. Implementar na Fase 4 (públicas, T-406/T-407) e Fase 5 (extração, T-509).

---

## 0. Visão geral e segurança

| Função | Método | Auth | Usa | Spec | Task |
|---|---|---|---|---|---|
| `public-honorario` | GET | Pública (token) | `service_role` | F8 | T-406 |
| `public-confirmar` | POST | Pública (token) | `service_role` | F8 | T-407 |
| `extrair-documento` | POST | Autenticada (JWT) | JWT do usuário + OCR | F11 | T-509 |

**Regras invioláveis**
- `service_role` só existe dentro da função (segredo do servidor). Nunca retornar dados além do mínimo.
- As funções públicas validam o **token opaco** (128 bits) e devolvem 404 genérico para qualquer falha — sem vazar se o token existe.
- `extrair-documento` valida o JWT e confere que o `storage_path` pertence ao usuário antes de processar.
- CORS restrito aos domínios da Vercel (sem `*` em produção).
- Rate-limit por IP/token nas funções públicas.

---

## 1. Estrutura de pastas

```
supabase/
└── functions/
    ├── _shared/
    │   ├── cors.ts
    │   ├── supabase.ts
    │   └── ratelimit.ts
    ├── public-honorario/
    │   └── index.ts
    ├── public-confirmar/
    │   └── index.ts
    └── extrair-documento/
        └── index.ts
```

---

## 2. Utilitários compartilhados (`_shared`)

### 2.1. `_shared/cors.ts`

```ts
// Origens permitidas — em produção, NUNCA usar "*".
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function corsHeaders(origin: string | null): HeadersInit {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function handlePreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req.headers.get("Origin")) });
  }
  return null;
}

export function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}
```

### 2.2. `_shared/supabase.ts`

```ts
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

// Cliente admin — ignora RLS. Usar SOMENTE no servidor, com filtros explícitos.
export function adminClient(): SupabaseClient {
  return createClient(URL, SERVICE_ROLE, { auth: { persistSession: false } });
}

// Cliente no contexto do usuário — respeita RLS via JWT do header Authorization.
export function userClient(authHeader: string): SupabaseClient {
  return createClient(URL, ANON, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}
```

### 2.3. `_shared/ratelimit.ts`

```ts
// Rate-limit simples em memória (por instância). Para produção robusta,
// trocar por uma tabela/Redis. Suficiente como primeira barreira.
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
```

---

## 3. `public-honorario` (GET)

Retorna os dados mínimos da parcela em aberto mais próxima, dado um token. Sem login.

```ts
// supabase/functions/public-honorario/index.ts
import { adminClient } from "../_shared/supabase.ts";
import { handlePreflight, json } from "../_shared/cors.ts";
import { rateLimit, clientIp } from "../_shared/ratelimit.ts";

function statusEfetivo(p: { status_registrado: string; vencimento: string }): string {
  if (p.status_registrado === "pago") return "pago";
  if (p.status_registrado === "pago_verificacao") return "pago_verificacao";
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(p.vencimento + "T00:00:00");
  if (venc < hoje) return "atrasado";
  const dias = Math.ceil((venc.getTime() - hoje.getTime()) / 86_400_000);
  return dias >= 0 && dias <= 2 ? "vencendo" : "pendente";
}

Deno.serve(async (req) => {
  const pre = handlePreflight(req); if (pre) return pre;
  const origin = req.headers.get("Origin");
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405, origin);

  // token do path: /public-honorario/<token>  OU  ?token=<token>
  const url = new URL(req.url);
  const token = url.pathname.split("/").pop() || url.searchParams.get("token") || "";
  if (!/^[a-f0-9]{32}$/.test(token)) return json({ error: "not_found" }, 404, origin);

  if (!rateLimit(`pub:${clientIp(req)}:${token}`, 30, 60_000)) {
    return json({ error: "rate_limited" }, 429, origin);
  }

  const db = adminClient();

  // Busca o honorário pelo token + dados estritamente necessários.
  const { data: hon, error } = await db
    .from("honorarios")
    .select(`
      id, processo, chave_pix, advogado_id, cliente_id,
      profiles:advogado_id ( nome, oab ),
      clientes:cliente_id ( nome ),
      parcelas ( numero, valor, vencimento, status_registrado )
    `)
    .eq("link_publico_token", token)
    .maybeSingle();

  // 404 genérico para qualquer falha — não revela existência do token.
  if (error || !hon || !hon.parcelas?.length) return json({ error: "not_found" }, 404, origin);

  const ordenadas = [...hon.parcelas].sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const aberta = ordenadas.find(
    (p) => p.status_registrado !== "pago" && p.status_registrado !== "pago_verificacao",
  ) ?? ordenadas[ordenadas.length - 1];

  const total = hon.parcelas.length;

  // Payload mínimo. NADA de IDs internos, advogado_id, cliente_id, e-mail, etc.
  return json({
    advogado: { nome: hon.profiles?.nome, oab: hon.profiles?.oab },
    cliente: hon.clientes?.nome,
    processo: hon.processo ?? "Não informado",
    parcela: { numero: aberta.numero, total },
    valor: aberta.valor,
    vencimento: aberta.vencimento,
    chave_pix: hon.chave_pix,
    status: statusEfetivo(aberta),
  }, 200, origin);
});
```

---

## 4. `public-confirmar` (POST)

Cliente declara que pagou → parcela vira `pago_verificacao`. Idempotente.

```ts
// supabase/functions/public-confirmar/index.ts
import { adminClient } from "../_shared/supabase.ts";
import { handlePreflight, json } from "../_shared/cors.ts";
import { rateLimit, clientIp } from "../_shared/ratelimit.ts";

Deno.serve(async (req) => {
  const pre = handlePreflight(req); if (pre) return pre;
  const origin = req.headers.get("Origin");
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, origin);

  let body: { token?: string; numero_parcela?: number };
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400, origin); }

  const token = body.token ?? "";
  const numero = Number(body.numero_parcela);
  if (!/^[a-f0-9]{32}$/.test(token) || !Number.isInteger(numero)) {
    return json({ error: "not_found" }, 404, origin);
  }

  if (!rateLimit(`conf:${clientIp(req)}:${token}`, 10, 60_000)) {
    return json({ error: "rate_limited" }, 429, origin);
  }

  const db = adminClient();

  const { data: hon } = await db
    .from("honorarios").select("id").eq("link_publico_token", token).maybeSingle();
  if (!hon) return json({ error: "not_found" }, 404, origin);

  // Só promove parcela ainda em aberto -> pago_verificacao (não regride pago).
  const { data: updated, error } = await db
    .from("parcelas")
    .update({ status_registrado: "pago_verificacao", confirmado_cliente: true })
    .eq("honorario_id", hon.id)
    .eq("numero", numero)
    .eq("status_registrado", "em_aberto")
    .select("numero")
    .maybeSingle();

  if (error) return json({ error: "not_found" }, 404, origin);

  // Idempotente: se já estava confirmado/pago, devolve ok mesmo sem update.
  // TODO: notificar o advogado (insert em tabela de notificações / e-mail).
  return json({ ok: true, ja_confirmado: !updated }, 200, origin);
});
```

---

## 5. `extrair-documento` (POST, autenticada)

Recebe `storage_path`, confere posse via RLS, chama OCR/IA, grava `dados_extraidos`.

```ts
// supabase/functions/extrair-documento/index.ts
import { adminClient, userClient } from "../_shared/supabase.ts";
import { handlePreflight, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const pre = handlePreflight(req); if (pre) return pre;
  const origin = req.headers.get("Origin");
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, origin);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401, origin);

  let body: { storage_path?: string };
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400, origin); }
  const path = body.storage_path ?? "";
  if (!path) return json({ error: "bad_request" }, 400, origin);

  // Cliente no contexto do usuário — valida o JWT e identifica o advogado.
  const supa = userClient(authHeader);
  const { data: userData, error: userErr } = await supa.auth.getUser();
  if (userErr || !userData.user) return json({ error: "unauthorized" }, 401, origin);
  const advogadoId = userData.user.id;

  // Confere que o arquivo está na pasta do próprio usuário.
  if (!path.startsWith(`${advogadoId}/`)) return json({ error: "forbidden" }, 403, origin);

  const admin = adminClient();

  // Registra o documento como "processando".
  const { data: doc, error: insErr } = await admin
    .from("documentos")
    .insert({ advogado_id: advogadoId, storage_path: path, status_extracao: "processando" })
    .select("id").single();
  if (insErr) return json({ error: "db_error" }, 500, origin);

  try {
    // URL assinada de curta duração para o provedor de OCR ler o arquivo.
    const { data: signed, error: signErr } = await admin
      .storage.from("documentos").createSignedUrl(path, 60);
    if (signErr || !signed) throw new Error("signed_url");

    // Chamada ao provedor de OCR/IA (placeholder — adaptar ao provedor escolhido).
    const ocrResp = await fetch(Deno.env.get("OCR_API_URL")!, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OCR_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file_url: signed.signedUrl,
        // Campos esperados (mesmos do mock do protótipo):
        fields: ["nome", "cpf", "whatsapp", "email", "endereco"],
      }),
    });
    if (!ocrResp.ok) throw new Error("ocr_failed");
    const dados = await ocrResp.json(); // { nome, cpf, whatsapp, email, endereco }

    await admin.from("documentos")
      .update({ status_extracao: "concluido", dados_extraidos: dados })
      .eq("id", doc.id);

    return json({ status: "concluido", dados_extraidos: dados }, 200, origin);
  } catch (_e) {
    await admin.from("documentos")
      .update({ status_extracao: "erro" }).eq("id", doc.id);
    return json({ error: "extracao_falhou" }, 502, origin);
  }
});
```

> O frontend usa `dados_extraidos` para pré-preencher o formulário de novo cliente; o advogado **revisa e confirma** antes de salvar (spec F11, INV-024).

---

## 6. Segredos e configuração

```bash
# Definir os segredos das funções (uma vez por ambiente):
supabase secrets set \
  SUPABASE_URL="https://<ref>.supabase.co" \
  SUPABASE_ANON_KEY="<anon>" \
  SUPABASE_SERVICE_ROLE_KEY="<service_role>" \
  ALLOWED_ORIGINS="https://comarca.app,https://comarca.vercel.app" \
  OCR_API_URL="https://<provedor-ocr>/extract" \
  OCR_API_KEY="<chave-ocr>"
```

> `SUPABASE_*` em geral já estão disponíveis no runtime das Edge Functions; setar explicitamente garante consistência local/remota.

### 6.1. JWT nas funções públicas

As funções `public-*` precisam aceitar requisições **sem** JWT. No deploy, marcar como sem verificação de JWT:

```bash
supabase functions deploy public-honorario --no-verify-jwt
supabase functions deploy public-confirmar  --no-verify-jwt
supabase functions deploy extrair-documento   # exige JWT (padrão)
```

> Como `--no-verify-jwt` abre a função, a segurança recai 100% sobre a validação do **token opaco** + rate-limit + payload mínimo. Por isso o token é de 128 bits e o retorno é 404 genérico.

---

## 7. Testes (mínimos por função)

- `public-honorario`: token válido → payload mínimo; token inexistente/ malformado → 404; parcela paga → status correto; nunca retorna `advogado_id`/`email`.
- `public-confirmar`: em aberto → `pago_verificacao`; já pago → idempotente `ja_confirmado: true`; token inválido → 404; rate-limit → 429.
- `extrair-documento`: sem JWT → 401; path de outro usuário → 403; OCR ok → `concluido` + dados; OCR falha → `erro` + 502.

---

## 8. Deploy (resumo)

```bash
supabase functions deploy public-honorario --no-verify-jwt
supabase functions deploy public-confirmar  --no-verify-jwt
supabase functions deploy extrair-documento

supabase functions list   # conferir status
```

> Tudo aqui é referência de implementação. Execução nas tasks T-406/T-407 (Fase 4) e T-509 (Fase 5) do [tasks.md](tasks.md).
