import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Proxy server-side da extração OCR → Edge Function `extrair-documento` (F11).
 * Passa o JWT da sessão do advogado (o edge valida e confere a pasta do usuário).
 * Evita CORS de browser e mantém o token fora do client.
 */
export async function POST(request: NextRequest) {
  let body: { storage_path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const storagePath = (body.storage_path ?? "").trim();
  if (!storagePath) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/functions/v1/extrair-documento`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ storage_path: storagePath }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "extracao_falhou" },
        { status: res.status === 502 ? 502 : 400 },
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: "network" }, { status: 502 });
  }
}
