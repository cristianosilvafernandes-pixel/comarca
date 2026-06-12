import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

/**
 * Extração dos dados do cliente a partir de um documento (procuração/contrato).
 * Roda no servidor (Vercel/Node) — a ANTHROPIC_API_KEY fica nas env vars da Vercel,
 * nunca no client nem no git. Baixa o arquivo do Storage no contexto do advogado
 * (RLS por pasta {advogado_id}/) e chama o Claude com saída estruturada.
 *
 * Suporta PDF e imagens (nativo no Claude). Outros formatos (.doc/.docx) caem no
 * preenchimento manual — o formulário trata o fallback.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

type Dados = {
  nome: string;
  cpf: string;
  whatsapp: string;
  email: string;
  endereco: string;
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["nome", "cpf", "whatsapp", "email", "endereco"],
  properties: {
    nome: { type: "string", description: "Nome completo do cliente" },
    cpf: { type: "string", description: "CPF só com dígitos, ou vazio" },
    whatsapp: { type: "string", description: "Telefone/WhatsApp só com dígitos, ou vazio" },
    email: { type: "string", description: "E-mail, ou vazio" },
    endereco: { type: "string", description: "Endereço completo, ou vazio" },
  },
} as const;

const INSTRUCAO =
  "Você extrai os dados do CLIENTE de um documento jurídico (procuração, contrato de honorários, " +
  "declaração). O cliente é o OUTORGANTE/CONTRATANTE — nunca o advogado (outorgado/contratado) nem o " +
  "escritório. Retorne nome, CPF, WhatsApp/telefone, e-mail e endereço do cliente. Use string vazia " +
  "para qualquer campo ausente. CPF e telefone apenas com dígitos.";

const IMAGE_TYPES: Record<string, "image/png" | "image/jpeg" | "image/webp" | "image/gif"> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

function montarConteudo(ext: string, base64: string): Anthropic.ContentBlockParam | null {
  if (ext === "pdf") {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } };
  }
  if (IMAGE_TYPES[ext]) {
    return { type: "image", source: { type: "base64", media_type: IMAGE_TYPES[ext], data: base64 } };
  }
  return null; // .doc/.docx e outros → fallback manual
}

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
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Confere que o arquivo está na pasta do próprio advogado.
  if (!storagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "extracao_indisponivel" }, { status: 503 });

  const ext = storagePath.split(".").pop()?.toLowerCase() ?? "";

  // Baixa os bytes do arquivo (RLS: só a própria pasta).
  const { data: blob, error: dlErr } = await supabase.storage.from("documentos").download(storagePath);
  if (dlErr || !blob) return NextResponse.json({ error: "download_falhou" }, { status: 502 });

  const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");
  const conteudo = montarConteudo(ext, base64);
  if (!conteudo) {
    // Formato não suportado para extração automática.
    return NextResponse.json({ error: "formato_nao_suportado" }, { status: 422 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: [{ type: "text", text: INSTRUCAO }, conteudo] }],
    });

    const texto = resp.content.find((b) => b.type === "text");
    if (!texto || texto.type !== "text") {
      return NextResponse.json({ error: "extracao_falhou" }, { status: 502 });
    }
    const dados = JSON.parse(texto.text) as Dados;
    return NextResponse.json({ status: "concluido", dados_extraidos: dados }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "extracao_falhou" }, { status: 502 });
  }
}
