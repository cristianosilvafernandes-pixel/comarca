import { headers } from "next/headers";

/**
 * Base URL absoluta do app. Usa NEXT_PUBLIC_SITE_URL quando definida;
 * senão deriva do header `host` da request. Server-only (usa next/headers).
 *
 * Centraliza a regra para o link público (/h/:token) nunca ficar relativo —
 * antes a página de detalhe caía para "" e quebrava o link copiado.
 */
export async function resolveBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}
