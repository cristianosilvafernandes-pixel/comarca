import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ContratoForm } from "./ContratoForm";

export const metadata: Metadata = {
  title: "Gerar Contrato — Comarca Honorários",
};

export default async function GerarContratoPage() {
  const supabase = await createClient();

  const [{ data: clientes }, { data: userData }] = await Promise.all([
    supabase.from("clientes").select("id, nome, cpf, endereco, whatsapp").order("nome"),
    supabase.auth.getUser(),
  ]);

  let advogadoNome = "Advogado";
  let advogadoOab: string | null = null;
  let foro: string | null = null;
  if (userData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome, oab, foro")
      .eq("id", userData.user.id)
      .maybeSingle();
    advogadoNome = profile?.nome ?? advogadoNome;
    advogadoOab = profile?.oab ?? null;
    foro = profile?.foro ?? null;
  }

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
        advogadoNome={advogadoNome}
        advogadoOab={advogadoOab}
        foro={foro}
        hoje={hoje}
      />
    </div>
  );
}
