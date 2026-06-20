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
  // Último segmento só vale se for um token (32 hex); senão cai p/ a query —
  // antes o segmento "public-honorario" era truthy e a query nunca era lida.
  const url = new URL(req.url);
  const ultimoSeg = url.pathname.split("/").filter(Boolean).pop() ?? "";
  const token = /^[a-f0-9]{32}$/.test(ultimoSeg) ? ultimoSeg : (url.searchParams.get("token") ?? "");
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
      profiles:advogado_id ( nome ),
      membro:membro_id ( nome, oab ),
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

  const advNome = hon.membro?.nome ?? hon.profiles?.nome ?? null;
  const advOab = hon.membro?.oab ?? null;

  // Payload mínimo. NADA de IDs internos, advogado_id, cliente_id, e-mail, etc.
  return json({
    advogado: { nome: advNome, oab: advOab },
    cliente: hon.clientes?.nome,
    processo: hon.processo ?? "Não informado",
    parcela: { numero: aberta.numero, total },
    valor: aberta.valor,
    vencimento: aberta.vencimento,
    chave_pix: hon.chave_pix,
    status: statusEfetivo(aberta),
  }, 200, origin);
});
