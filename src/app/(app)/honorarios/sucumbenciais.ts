"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { onlyDigits } from "@/lib/utils/cpf";
import { todayISO } from "@/lib/domain/dates";
import type { StatusSucumbencial } from "@/lib/database.types";

export type SucumbencialState = { error?: string } | undefined;

/** Registra um honorário sucumbencial vinculado a um honorário. */
export async function registrarSucumbencial(
  _prev: SucumbencialState,
  formData: FormData,
): Promise<SucumbencialState> {
  const honorarioId = String(formData.get("honorario_id") ?? "").trim();
  const valorRaw = Number(formData.get("valor") ?? 0);
  const docRaw = String(formData.get("doc_adversario") ?? "");
  const status = String(formData.get("status") ?? "aguardando") as StatusSucumbencial;
  const dataRecebimento =
    status === "recebido"
      ? String(formData.get("data_recebimento") ?? "").trim() || todayISO()
      : null;
  const dividir = formData.get("dividir_parceiro") === "on";
  const parceiroId = dividir
    ? String(formData.get("divisao_parceiro_id") ?? "").trim() || null
    : null;
  const parceiroPct = dividir
    ? Math.max(0, Math.min(100, Number(formData.get("divisao_parceiro_pct") ?? 0) || 0))
    : null;

  if (!honorarioId) return { error: "Honorário inválido." };
  if (!valorRaw || valorRaw <= 0) return { error: "Informe o valor sucumbencial." };

  const digits = onlyDigits(docRaw);
  if (digits.length !== 11 && digits.length !== 14) {
    return { error: "Informe o CPF (11 dígitos) ou CNPJ (14 dígitos) da parte adversária." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sucumbenciais").insert({
    honorario_id: honorarioId,
    valor: valorRaw,
    doc_adversario: digits,
    status,
    data_recebimento: dataRecebimento,
    divisao_parceiro_id: parceiroId,
    divisao_parceiro_pct: parceiroPct,
  });

  if (error) return { error: "Não foi possível registrar o sucumbencial." };

  revalidatePath(`/honorarios/${honorarioId}`);
  revalidatePath("/relatorio-ir");
  return {};
}

/** Marca sucumbencial como recebido com data de hoje. */
export async function marcarSucumbencialRecebido(
  sucId: string,
  honorarioId: string,
): Promise<{ error?: string }> {
  if (!sucId) return { error: "Sucumbencial inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sucumbenciais")
    .update({ status: "recebido", data_recebimento: todayISO() })
    .eq("id", sucId);

  if (error) return { error: "Não foi possível atualizar o status." };

  revalidatePath(`/honorarios/${honorarioId}`);
  revalidatePath("/relatorio-ir");
  return {};
}

/** Remove um registro de sucumbencial. */
export async function deleteSucumbencial(
  sucId: string,
  honorarioId: string,
): Promise<{ error?: string }> {
  if (!sucId) return { error: "Sucumbencial inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("sucumbenciais").delete().eq("id", sucId);

  if (error) return { error: "Não foi possível excluir." };

  revalidatePath(`/honorarios/${honorarioId}`);
  return {};
}
