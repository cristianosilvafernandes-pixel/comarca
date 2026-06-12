"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PerfilState = { error?: string; success?: boolean } | undefined;

/** Atualiza o perfil do advogado (nome, OAB, chave PIX, foro). Spec F1 / INV-014. */
export async function updateProfile(_prev: PerfilState, formData: FormData): Promise<PerfilState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  const site = String(formData.get("site") ?? "").trim();
  const chavePix = String(formData.get("chave_pix") ?? "").trim();
  const foro = String(formData.get("foro") ?? "").trim();

  if (nome.length < 2) return { error: "Informe o nome do escritório." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase
    .from("profiles")
    .update({
      nome,
      cnpj: cnpj || null,
      telefone: telefone || null,
      endereco: endereco || null,
      site: site || null,
      chave_pix: chavePix || null,
      foro: foro || null,
    })
    .eq("id", user.id);

  if (error) return { error: "Não foi possível salvar o perfil." };

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { success: true };
}

/** Faz upload da logo do escritório e salva a URL no perfil. */
export async function uploadLogo(_prev: PerfilState, formData: FormData): Promise<PerfilState> {
  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return { error: "Selecione um arquivo." };
  if (file.size > 1_048_576) return { error: "Arquivo muito grande. Máximo 1 MB." };
  if (!file.type.startsWith("image/")) return { error: "Apenas imagens são aceitas." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${user.id}/logo.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadErr } = await supabase.storage
    .from("logos")
    .upload(path, bytes, { upsert: true, contentType: file.type });

  if (uploadErr) return { error: "Falha no upload. Tente novamente." };

  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(path);

  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ logo_url: `${publicUrl}?t=${Date.now()}` })
    .eq("id", user.id);

  if (dbErr) return { error: "Upload realizado mas não foi possível salvar a URL." };

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { success: true };
}
