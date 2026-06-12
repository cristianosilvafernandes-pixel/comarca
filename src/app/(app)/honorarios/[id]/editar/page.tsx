import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditHonorarioForm } from "../EditHonorarioForm";
import { PageHeader } from "@/components/ui/PageHeader";
import type { HonorarioTipo } from "@/lib/database.types";

export const metadata: Metadata = {
  title: "Editar Honorário — Comarca Honorários",
};

export default async function EditarHonorarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: hon } = await supabase
    .from("honorarios")
    .select(
      "id, tipo, processo, area, tribunal, parte_contraria, chave_pix, valor_total, valor_mensal, valor_entrada, valor_causa, percentual_exito, clientes:cliente_id(nome)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!hon) notFound();

  const clienteNome = (hon.clientes as { nome: string } | null)?.nome ?? "Cliente";

  return (
    <div>
      <PageHeader
        title={`Editar honorário — ${clienteNome}`}
        action={<a href={`/honorarios/${id}`} className="btn btn-secondary">← Voltar</a>}
      />

      <EditHonorarioForm
        id={hon.id}
        tipo={hon.tipo as HonorarioTipo}
        processo={hon.processo}
        area={hon.area}
        tribunal={hon.tribunal}
        parteContraria={hon.parte_contraria}
        chavePix={hon.chave_pix}
        valorTotal={hon.valor_total}
        valorMensal={hon.valor_mensal}
        valorEntrada={hon.valor_entrada}
        valorCausa={hon.valor_causa}
        percentualExito={hon.percentual_exito}
        cancelHref={`/honorarios/${id}`}
      />
    </div>
  );
}
