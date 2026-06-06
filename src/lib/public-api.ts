/**
 * Helpers server-side para as Edge Functions públicas (sem sessão de usuário).
 * Chamadas feitas no servidor → sem CORS de browser. Spec F8 / doc §9.
 */

export interface PublicHonorario {
  advogado: { nome: string | null; oab: string | null };
  cliente: string | null;
  processo: string;
  parcela: { numero: number; total: number };
  valor: number;
  vencimento: string;
  chave_pix: string | null;
  status: "pago" | "pago_verificacao" | "atrasado" | "vencendo" | "pendente";
}

function functionsBase(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente");
  return `${url.replace(/\/$/, "")}/functions/v1`;
}

function authHeaders(): Record<string, string> {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return { apikey: anon, Authorization: `Bearer ${anon}` };
}

/** GET dados mínimos da parcela em aberto. Retorna null se token inválido/inexistente. */
export async function getPublicHonorario(token: string): Promise<PublicHonorario | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  try {
    const res = await fetch(`${functionsBase()}/public-honorario/${token}`, {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicHonorario;
  } catch {
    return null;
  }
}

/** POST confirma o pagamento (cliente) → pago_verificacao. */
export async function confirmarPagamentoPublico(
  token: string,
  numeroParcela: number,
): Promise<{ ok: boolean; ja_confirmado?: boolean; error?: string }> {
  try {
    const res = await fetch(`${functionsBase()}/public-confirmar`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ token, numero_parcela: numeroParcela }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      ja_confirmado?: boolean;
      error?: string;
    };
    if (!res.ok) return { ok: false, error: data.error ?? "falha" };
    return { ok: Boolean(data.ok), ja_confirmado: data.ja_confirmado };
  } catch {
    return { ok: false, error: "network" };
  }
}
