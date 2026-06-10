"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/domain/dates";
import { onlyDigits } from "@/lib/utils/cpf";
import {
  gerarParcelasFixoParcelado,
  gerarParcelasRecorrente,
  gerarParcelasAdExitum,
  gerarParcelasFixoExitum,
  type ParcelaGerada,
} from "@/lib/domain/parcelas";
import type { HonorarioTipo, Frequencia, Area, Tribunal, Database } from "@/lib/database.types";

type HonorarioInsert = Database["public"]["Tables"]["honorarios"]["Insert"];

export type HonorarioState = { error?: string } | undefined;

const TIPOS: HonorarioTipo[] = ["fixo_parcelado", "ad_exitum", "recorrente", "fixo_exitum"];

function num(formData: FormData, key: string): number {
  return Number(formData.get(key) ?? 0) || 0;
}
function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/** Cria honorário + gera parcelas conforme o tipo (spec F3/F4). */
export async function createHonorario(_prev: HonorarioState, formData: FormData): Promise<HonorarioState> {
  const cliente_id = str(formData, "cliente_id");
  const tipo = str(formData, "tipo") as HonorarioTipo;
  const membro_id = str(formData, "membro_id") || null;

  if (!cliente_id) return { error: "Selecione o cliente." };
  if (!TIPOS.includes(tipo)) return { error: "Tipo de honorário inválido." };

  const supabase = await createClient();

  // chave_pix do honorário cai para a do perfil quando vazia.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("chave_pix")
    .eq("id", user.id)
    .maybeSingle();

  const base: HonorarioInsert = {
    cliente_id,
    tipo,
    membro_id,
    processo: str(formData, "processo") || null,
    area: (str(formData, "area") || null) as Area | null,
    tribunal: (str(formData, "tribunal") || null) as Tribunal | null,
    parte_contraria: str(formData, "parte_contraria") || null,
    chave_pix: str(formData, "chave_pix") || profile?.chave_pix || null,
  };

  // Campos + geração por tipo.
  let parcelas: ParcelaGerada[] = [];
  const extra: Partial<HonorarioInsert> = {};

  if (tipo === "fixo_parcelado") {
    const valorTotal = num(formData, "valor_total");
    const frequencia = (str(formData, "frequencia") || "Mensal") as Frequencia;
    const numParcelas = Math.max(1, Math.min(12, num(formData, "num_parcelas") || 1));
    const dataPrimeira = str(formData, "data_primeira") || todayISO();
    if (valorTotal <= 0) return { error: "Informe o valor total." };

    extra.valor_total = valorTotal;
    extra.frequencia = frequencia;
    parcelas = gerarParcelasFixoParcelado({
      valorTotal,
      numParcelas,
      frequencia,
      dataPrimeira,
      jaPagoHoje: formData.get("ja_pago_hoje") === "on",
    });
  } else if (tipo === "recorrente") {
    const valorMensal = num(formData, "valor_mensal");
    const dataInicio = str(formData, "data_inicio") || todayISO();
    const dataFim = str(formData, "data_fim") || null;
    if (valorMensal <= 0) return { error: "Informe o valor mensal." };

    extra.valor_mensal = valorMensal;
    extra.data_inicio = dataInicio;
    extra.data_fim = dataFim;
    parcelas = gerarParcelasRecorrente({ valorMensal, dataInicio, dataFim });
  } else if (tipo === "ad_exitum") {
    const valorCausa = num(formData, "valor_causa");
    const percentual = num(formData, "percentual_exito");
    if (valorCausa <= 0 || percentual <= 0) return { error: "Informe valor da causa e percentual de êxito." };

    extra.valor_causa = valorCausa;
    extra.percentual_exito = percentual;
    parcelas = gerarParcelasAdExitum();
  } else if (tipo === "fixo_exitum") {
    const valorEntrada = num(formData, "valor_entrada");
    const dataEntrada = str(formData, "data_primeira") || todayISO();
    const valorCausa = num(formData, "valor_causa");
    const percentual = num(formData, "percentual_exito");
    if (valorEntrada <= 0) return { error: "Informe o valor da entrada." };

    extra.valor_entrada = valorEntrada;
    if (valorCausa > 0) extra.valor_causa = valorCausa;
    if (percentual > 0) extra.percentual_exito = percentual;
    parcelas = gerarParcelasFixoExitum({ valorEntrada, dataEntrada });
  }

  // Insere honorário (advogado_id e link_publico_token vêm de trigger/default).
  const { data: hon, error: honErr } = await supabase
    .from("honorarios")
    .insert({ ...base, ...extra })
    .select("id")
    .single();

  if (honErr || !hon) {
    if (honErr?.code === "23514" || honErr?.message.includes("Limite")) {
      return { error: "Limite de honorários do seu plano atingido." };
    }
    return { error: "Não foi possível criar o honorário." };
  }

  // Insere parcelas geradas (advogado_id herdado por trigger do honorário pai).
  if (parcelas.length > 0) {
    const rows = parcelas.map((p) => ({
      honorario_id: hon.id,
      numero: p.numero,
      valor: p.valor,
      vencimento: p.vencimento,
      status_registrado: p.status_registrado,
      data_pagamento: p.data_pagamento ?? null,
    }));
    const { error: parcErr } = await supabase.from("parcelas").insert(rows);
    if (parcErr) {
      // honorário criado mas parcelas falharam — remove para não deixar órfão.
      await supabase.from("honorarios").delete().eq("id", hon.id);
      return { error: "Falha ao gerar as parcelas. Tente novamente." };
    }
  }

  revalidatePath("/honorarios");
  redirect(`/honorarios/${hon.id}`);
}

export type ParcelaPagaState = { error?: string } | undefined;

/**
 * Marca uma parcela como paga (spec F7). Origem contratual (cliente) ou
 * sucumbencial (parte contrária — exige doc do pagador). Serve também para o
 * advogado validar uma parcela em `pago_verificacao`.
 */
export async function marcarParcelaPaga(
  _prev: ParcelaPagaState,
  formData: FormData,
): Promise<ParcelaPagaState> {
  const parcelaId = String(formData.get("parcela_id") ?? "").trim();
  const honorarioId = String(formData.get("honorario_id") ?? "").trim();
  const origem = String(formData.get("origem_pagamento") ?? "").trim();
  const docRaw = String(formData.get("doc_pagador") ?? "");

  if (!parcelaId) return { error: "Parcela inválida." };
  if (origem !== "contratual" && origem !== "sucumbencial") {
    return { error: "Selecione a origem do pagamento." };
  }

  let doc_pagador: string | null = null;
  if (origem === "sucumbencial") {
    const d = onlyDigits(docRaw);
    if (d.length !== 11 && d.length !== 14) {
      return { error: "Informe o CPF (11) ou CNPJ (14) do pagador." };
    }
    doc_pagador = d;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("parcelas")
    .update({
      status_registrado: "pago",
      data_pagamento: todayISO(),
      origem_pagamento: origem,
      doc_pagador,
      confirmado_cliente: true,
    })
    .eq("id", parcelaId);

  if (error) return { error: "Não foi possível marcar como paga." };

  if (honorarioId) revalidatePath(`/honorarios/${honorarioId}`);
  revalidatePath("/honorarios");
  revalidatePath("/dashboard");
  return {};
}

/** Registra o envio de um lembrete (spec F6 — contagem p/ limite de plano). */
export async function registrarLembrete(parcelaId: string): Promise<{ ok: boolean }> {
  if (!parcelaId) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase
    .from("lembretes")
    .insert({ parcela_id: parcelaId, canal: "whatsapp" });
  return { ok: !error };
}
