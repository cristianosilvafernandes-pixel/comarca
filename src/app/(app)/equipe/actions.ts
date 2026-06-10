"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdvogadoState = { error?: string } | undefined;

export async function saveAdvogado(
  _prev: AdvogadoState,
  formData: FormData,
): Promise<AdvogadoState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const oab = String(formData.get("oab") ?? "").trim() || null;

  if (!nome) return { error: "Nome é obrigatório." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (id) {
    const { error } = await supabase
      .from("advogados")
      .update({ nome, oab })
      .eq("id", id);
    if (error) return { error: "Não foi possível atualizar o advogado." };
  } else {
    const { error } = await supabase
      .from("advogados")
      .insert({ user_id: user.id, nome, oab });
    if (error) return { error: "Não foi possível criar o advogado." };
  }

  revalidatePath("/equipe");
  redirect("/equipe");
}

export async function deleteAdvogado(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("advogados").delete().eq("id", id);
  if (error) redirect("/equipe?error=falha_excluir");
  revalidatePath("/equipe");
  redirect("/equipe");
}
