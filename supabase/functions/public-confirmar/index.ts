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
