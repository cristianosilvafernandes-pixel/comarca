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

  // Upload opcional da foto. undefined = não mexer no foto_url existente.
  let fotoUrl: string | undefined;
  const foto = formData.get("foto") as File | null;
  if (foto && foto.size > 0) {
    if (foto.size > 2_097_152) return { error: "Foto muito grande. Máximo 2 MB." };
    if (!foto.type.startsWith("image/")) return { error: "Apenas imagens são aceitas." };

    const ext = foto.name.split(".").pop() ?? "png";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const bytes = await foto.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from("avatares")
      .upload(path, bytes, { upsert: true, contentType: foto.type });
    if (uploadErr) return { error: "Falha no upload da foto. Tente novamente." };

    fotoUrl = supabase.storage.from("avatares").getPublicUrl(path).data.publicUrl;
  }

  if (id) {
    const { error } = await supabase
      .from("advogados")
      .update({ nome, oab, ...(fotoUrl !== undefined && { foto_url: fotoUrl }) })
      .eq("id", id);
    if (error) return { error: "Não foi possível atualizar o advogado." };
  } else {
    const { error } = await supabase
      .from("advogados")
      .insert({ user_id: user.id, nome, oab, foto_url: fotoUrl ?? null });
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
