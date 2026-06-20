import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/utils/initials";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { DeleteButton } from "./DeleteButton";

export const metadata: Metadata = {
  title: "Equipe — Comarca Honorários",
};

export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("advogados")
    .select("id, nome, oab, ativo")
    .order("nome");
  const advogados = data ?? [];

  return (
    <div>
      <PageHeader
        title="Equipe"
        action={
          <Link href="/equipe/novo" className="btn btn-primary">
            + Novo advogado
          </Link>
        }
      />

      {error === "falha_excluir" && (
        <Alert>Não foi possível remover o advogado.</Alert>
      )}

      {advogados.length === 0 ? (
        <EmptyState
          icon="👤"
          title="Nenhum advogado cadastrado"
          description="Cadastre os advogados do escritório para vincular honorários a cada um."
          action={
            <Link href="/equipe/novo" className="btn btn-primary">
              Cadastrar advogado
            </Link>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {advogados.map((adv) => (
            <div key={adv.id} className="card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="client-initials-avatar">{initials(adv.nome)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{adv.nome}</div>
                  {adv.oab && (
                    <div style={{ fontSize: 14, color: "var(--body)", marginTop: 2 }}>
                      {adv.oab}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href={`/equipe/${adv.id}/editar`} className="btn btn-secondary">
                    Editar
                  </Link>
                  <DeleteButton id={adv.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
