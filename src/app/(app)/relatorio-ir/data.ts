import { createClient } from "@/lib/supabase/server";
import type { ParcelaIR } from "@/lib/domain/ir";
import type { HonorarioTipo, OrigemPagamento } from "@/lib/database.types";

type HonInfo = {
  tipo: HonorarioTipo;
  membro_id: string | null;
  parceiro_id: string | null;
  parceiro_percentual: number | null;
  clientes: { nome: string; cpf: string | null } | null;
};

type SucRow = {
  valor: number;
  doc_adversario: string;
  data_recebimento: string | null;
  honorarios: HonInfo | null;
};

type Row = {
  numero: number;
  valor: number;
  vencimento: string;
  data_pagamento: string | null;
  origem_pagamento: OrigemPagamento | null;
  doc_pagador: string | null;
  honorarios: HonInfo | null;
};

/** Fração do valor que pertence ao advogado filtrado. */
function frac(hon: HonInfo, membroIds: string[]): number {
  if (membroIds.length !== 1 || !hon.parceiro_id || hon.parceiro_percentual == null) return 1;
  const [advId] = membroIds;
  if (hon.parceiro_id === advId) return hon.parceiro_percentual / 100;
  if (hon.membro_id === advId) return (100 - hon.parceiro_percentual) / 100;
  return 1;
}

/** Busca sucumbenciais RECEBIDOS e converte em ParcelaIR com origem='sucumbencial'. */
export async function fetchSucumbenciaisIR(membroIds: string[] = []): Promise<ParcelaIR[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sucumbenciais")
    .select(
      "valor, doc_adversario, data_recebimento, honorarios:honorario_id(tipo, membro_id, parceiro_id, parceiro_percentual, clientes:cliente_id(nome, cpf))",
    )
    .eq("status", "recebido");

  const rows = (data ?? []) as unknown as SucRow[];

  return rows
    .filter((r) => r.honorarios && r.data_recebimento)
    .filter((r) => {
      if (membroIds.length === 0) return true;
      const h = r.honorarios!;
      return (h.membro_id != null && membroIds.includes(h.membro_id)) ||
             (h.parceiro_id != null && membroIds.includes(h.parceiro_id));
    })
    .map((r) => ({
      clienteNome: r.honorarios!.clientes?.nome ?? "—",
      clienteCpf: r.honorarios!.clientes?.cpf ?? "—",
      tipo: r.honorarios!.tipo,
      numero: 1,
      origem: "sucumbencial" as OrigemPagamento,
      docPagador: r.doc_adversario,
      valor: r.valor * frac(r.honorarios!, membroIds),
      dataPagamento: r.data_recebimento,
      vencimento: r.data_recebimento!,
    }));
}

/** Busca parcelas PAGAS do advogado (RLS). membroIds filtra por sub-perfis. */
export async function fetchParcelasIR(membroIds: string[] = []): Promise<ParcelaIR[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parcelas")
    .select(
      "numero, valor, vencimento, data_pagamento, origem_pagamento, doc_pagador, honorarios:honorario_id(tipo, membro_id, parceiro_id, parceiro_percentual, clientes:cliente_id(nome, cpf))",
    )
    .eq("status_registrado", "pago");

  const rows = (data ?? []) as unknown as Row[];

  return rows
    .filter((r) => r.honorarios)
    .filter((r) => {
      if (membroIds.length === 0) return true;
      const h = r.honorarios!;
      return (h.membro_id != null && membroIds.includes(h.membro_id)) ||
             (h.parceiro_id != null && membroIds.includes(h.parceiro_id));
    })
    .map((r) => ({
      clienteNome: r.honorarios!.clientes?.nome ?? "—",
      clienteCpf: r.honorarios!.clientes?.cpf ?? "—",
      tipo: r.honorarios!.tipo,
      numero: r.numero,
      origem: r.origem_pagamento,
      docPagador: r.doc_pagador,
      valor: r.valor * frac(r.honorarios!, membroIds),
      dataPagamento: r.data_pagamento,
      vencimento: r.vencimento,
    }));
}
