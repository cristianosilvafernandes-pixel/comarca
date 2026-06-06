"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PerfilState = { error?: string; success?: boolean } | undefined;

/** Atualiza o perfil do advogado (nome, OAB, chave PIX, foro). Spec F1 / INV-014. */
export async function updateProfile(_prev: PerfilState, formData: FormData): Promise<PerfilState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const oab = String(formData.get("oab") ?? "").trim();
  const chavePix = String(formData.get("chave_pix") ?? "").trim();
  const foro = String(formData.get("foro") ?? "").trim();

  if (nome.length < 2) return { error: "Informe seu nome." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase
    .from("profiles")
    .update({
      nome,
      oab: oab || null,
      chave_pix: chavePix || null,
      foro: foro || null,
    })
    .eq("id", user.id);

  if (error) return { error: "Não foi possível salvar o perfil." };

  revalidatePath("/perfil");
  revalidatePath("/", "layout"); // atualiza nome/OAB no cabeçalho
  return { success: true };
}
