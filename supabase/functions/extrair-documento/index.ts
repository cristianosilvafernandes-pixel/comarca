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
  } catch {
    await admin.from("documentos")
      .update({ status_extracao: "erro" }).eq("id", doc.id);
    return json({ error: "extracao_falhou" }, 502, origin);
  }
});
