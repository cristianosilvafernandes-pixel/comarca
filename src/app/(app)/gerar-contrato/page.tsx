import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ContratoForm } from "./ContratoForm";

export const metadata: Metadata = {
  title: "Gerar Contrato — Comarca Honorários",
};

export default async function GerarContratoPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const [{ data: clientes }, { data: advogados }, { data: profile }] = await Promise.all([
    supabase.from("clientes").select("id, nome, cpf, endereco, whatsapp").order("nome"),
    supabase.from("advogados").select("id, nome, oab").eq("ativo", true).order("nome"),
    supabase.from("profiles").select("foro").eq("id", userData.user?.id ?? "").maybeSingle(),
  ]);

  const advsArr = advogados ?? [];
  const defaultAdv = advsArr[0];
  const advogadoNome = defaultAdv?.nome ?? "Advogado";
  const advogadoOab = defaultAdv?.oab ?? null;
  const foro = profile?.foro ?? null;

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="page-head">
        <h1>Geração de Contrato de Honorários</h1>
      </div>
      <p style={{ marginBottom: 16 }}>
        Selecione um cliente, preencha objeto e valor — o modelo é preenchido automaticamente e
        permanece editável.
      </p>

      <ContratoForm
        clientes={clientes ?? []}
        advogados={advsArr}
        advogadoNome={advogadoNome}
        advogadoOab={advogadoOab}
        foro={foro}
        hoje={hoje}
      />
    </div>
  );
}
