"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidCPF, onlyDigits } from "@/lib/utils/cpf";
import { normalizeWhatsApp } from "@/lib/utils/phone";

export type ClienteState = { error?: string } | undefined;

/** Cria ou atualiza um cliente (id presente = update). Spec F2. */
export async function saveCliente(_prev: ClienteState, formData: FormData): Promise<ClienteState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const cpfRaw = String(formData.get("cpf") ?? "");
  const whatsappRaw = String(formData.get("whatsapp") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();

  if (nome.length < 2) return { error: "Informe o nome do cliente." };
  if (!isValidCPF(cpfRaw)) return { error: "CPF inválido." };
  const whatsapp = normalizeWhatsApp(whatsappRaw);
  if (!whatsapp) return { error: "WhatsApp inválido. Use DDD + número." };

  const membro_id = String(formData.get("membro_id") ?? "").trim() || null;

  const supabase = await createClient();
  const payload = {
    nome,
    cpf: onlyDigits(cpfRaw),
    whatsapp,
    email: email || null,
    endereco: endereco || null,
    membro_id,
  };

  const { error } = id
    ? await supabase.from("clientes").update(payload).eq("id", id)
    : await supabase.from("clientes").insert(payload);

  if (error) {
    // 23514 = check_violation (limite de plano via trigger)
    if (error.code === "23514" || error.message.includes("Limite de clientes")) {
      return { error: "Limite de clientes do seu plano atingido. Faça upgrade para adicionar mais." };
    }
    if (error.code === "23505") return { error: "Já existe um cliente com esse dado." };
    return { error: "Não foi possível salvar o cliente." };
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

/** Exclui cliente. Bloqueado pelo banco se houver honorários (FK restrict). */
export async function deleteCliente(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/clientes");

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").delete().eq("id", id);

  if (error) {
    // 23503 = foreign_key_violation (cliente tem honorários)
    if (error.code === "23503") {
      redirect("/clientes?error=tem_honorarios");
    }
    redirect("/clientes?error=falha_excluir");
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}
