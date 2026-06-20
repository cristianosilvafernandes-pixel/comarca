import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ContratoForm } from "./ContratoForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Gerar Contrato — Comarca Honorários",
};

export default async function GerarContratoPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const [{ data: clientes }, { data: advogados }, { data: profile }] = await Promise.all([
    supabase.from("clientes").select("id, nome, cpf, endereco, whatsapp").order("nome"),
    supabase.from("advogados").select("id, nome, oab").eq("ativo", true).order("nome"),
    supabase.from("profiles").select("foro, nome").eq("id", userData.user?.id ?? "").maybeSingle(),
  ]);

  const advsArr = advogados ?? [];
  const foro = profile?.foro ?? null;
  const escritorioNome = profile?.nome ?? null;

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title="Geração de Contrato de Honorários" />
      <p style={{ marginBottom: 16 }}>
        Selecione um cliente, preencha objeto e valor — o modelo é preenchido automaticamente e
        permanece editável.
      </p>

      <ContratoForm
        clientes={clientes ?? []}
        advogados={advsArr}
        foro={foro}
        hoje={hoje}
        escritorioNome={escritorioNome}
      />
    </div>
  );
}
