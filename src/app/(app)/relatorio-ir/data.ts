import { createClient } from "@/lib/supabase/server";
import type { ParcelaIR } from "@/lib/domain/ir";
import type { HonorarioTipo, OrigemPagamento } from "@/lib/database.types";

type Row = {
  numero: number;
  valor: number;
  vencimento: string;
  data_pagamento: string | null;
  origem_pagamento: OrigemPagamento | null;
  doc_pagador: string | null;
  honorarios: {
    tipo: HonorarioTipo;
    membro_id: string | null;
    clientes: { nome: string; cpf: string } | null;
  } | null;
};

/** Busca parcelas PAGAS do advogado (RLS). membroIds filtra por sub-perfis. */
export async function fetchParcelasIR(membroIds: string[] = []): Promise<ParcelaIR[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parcelas")
    .select(
      "numero, valor, vencimento, data_pagamento, origem_pagamento, doc_pagador, honorarios:honorario_id(tipo, membro_id, clientes:cliente_id(nome, cpf))",
    )
    .eq("status_registrado", "pago");

  const rows = (data ?? []) as unknown as Row[];

  return rows
    .filter((r) => r.honorarios)
    .filter((r) => membroIds.length === 0 || (r.honorarios!.membro_id != null && membroIds.includes(r.honorarios!.membro_id)))
    .map((r) => ({
      clienteNome: r.honorarios!.clientes?.nome ?? "—",
      clienteCpf: r.honorarios!.clientes?.cpf ?? "—",
      tipo: r.honorarios!.tipo,
      numero: r.numero,
      origem: r.origem_pagamento,
      docPagador: r.doc_pagador,
      valor: r.valor,
      dataPagamento: r.data_pagamento,
      vencimento: r.vencimento,
    }));
}
