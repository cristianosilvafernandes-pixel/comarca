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

  const [{ data: advogados }, { data: profile }, { data: honorarios }] = await Promise.all([
    supabase.from("advogados").select("id, nome, oab").eq("ativo", true).order("nome"),
    supabase
      .from("profiles")
      .select("foro, nome, chave_pix, endereco, logo_url")
      .eq("id", userData.user?.id ?? "")
      .maybeSingle(),
    supabase
      .from("honorarios")
      .select(
        "id, processo, area, parte_contraria, tipo, frequencia, valor_total, valor_mensal, valor_entrada, valor_causa, percentual_exito, chave_pix, clientes(id, nome, cpf, endereco, email, whatsapp)",
      )
      .order("created_at", { ascending: false }),
  ]);

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title="Geração de Contrato de Honorários" />
      <p style={{ marginBottom: 20, color: "var(--body)", fontSize: 14 }}>
        Preencha os passos abaixo para gerar o instrumento contratual customizado.
      </p>

      <ContratoForm
        advogados={advogados ?? []}
        honorarios={honorarios ?? []}
        perfilForo={profile?.foro ?? null}
        perfilChavePix={profile?.chave_pix ?? null}
        perfilEndereco={profile?.endereco ?? null}
        escritorioNome={profile?.nome ?? null}
        logoUrl={profile?.logo_url ?? null}
        hoje={hoje}
      />
    </div>
  );
}
