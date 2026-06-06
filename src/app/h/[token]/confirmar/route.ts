import { NextResponse, type NextRequest } from "next/server";
import { confirmarPagamentoPublico } from "@/lib/public-api";

/**
 * Proxy server-side da confirmação pública → Edge Function `public-confirmar`.
 * Evita CORS de browser (ALLOWED_ORIGINS pode não estar setado) e mantém a
 * chamada à function no servidor.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let body: { numero_parcela?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const numero = Number(body.numero_parcela);
  if (!Number.isInteger(numero)) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const result = await confirmarPagamentoPublico(token, numero);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
