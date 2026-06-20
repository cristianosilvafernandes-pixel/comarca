import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fetchParcelasIR, fetchSucumbenciaisIR } from "./data";
import { YearSelect } from "./YearSelect";
import { AdvogadoFilter } from "@/components/AdvogadoFilter";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { parseAdv } from "@/lib/utils/adv-filter";
import { agregarRelatorioIR, anoApuracao } from "@/lib/domain/ir";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Relatório IR — Comarca Honorários",
};

export default async function RelatorioIRPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; adv?: string }>;
}) {
  const sp = await searchParams;
  const advRaw = sp.adv || "";
  const advIds = parseAdv(advRaw);

  const supabase = await createClient();
  const [parcelasContrato, sucumbenciais, { data: advogados }] = await Promise.all([
    fetchParcelasIR(advIds),
    fetchSucumbenciaisIR(advIds),
    supabase.from("advogados").select("id, nome").eq("ativo", true).order("nome"),
  ]);
  const parcelas = [...parcelasContrato, ...sucumbenciais];

  const anoAtual = new Date().getUTCFullYear();
  const anosDisponiveis = Array.from(
    new Set([anoAtual, ...parcelas.map(anoApuracao)]),
  ).sort((a, b) => b - a);

  const ano = sp.ano ? Number(sp.ano) : anosDisponiveis[0];
  const rel = agregarRelatorioIR(parcelas, ano);
  const temLancamentos = rel.totalGeral > 0;

  const advParam = advRaw ? `&adv=${encodeURIComponent(advRaw)}` : "";

  return (
    <div>
      <PageHeader
        title="Relatório de Rendimentos (IR)"
        action={
          <a className="btn btn-primary" href={`/relatorio-ir/csv?ano=${ano}${advParam}`}>
            ⬇ Exportar CSV
          </a>
        }
      />

      <AdvogadoFilter advogados={advogados ?? []} selected={advIds} />

      <Card style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <label style={{ marginBottom: 0 }}>Ano de apuração:</label>
        <YearSelect anos={anosDisponiveis} ano={ano} adv={advRaw || undefined} />
      </Card>

      {!temLancamentos ? (
        <EmptyState
          icon="🧾"
          title={`Sem rendimentos em ${ano}`}
          description="Marque parcelas como pagas para que apareçam aqui na apuração do ano."
        />
      ) : (
        <>
          {rel.grupos.map((g) => (
            <Card key={g.categoria} style={{ padding: 0, overflowX: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--gray-border)" }}>
                <strong>{g.categoria}</strong>
                <strong>{formatCurrency(g.total)}</strong>
              </div>
              {g.linhas.length === 0 ? (
                <div style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 14 }}>
                  Nenhum lançamento neste grupo.
                </div>
              ) : (
                <table className="relatorio-tabela">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>CPF/CNPJ</th>
                      <th>Origem</th>
                      <th style={{ textAlign: "right" }}>Valor</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.linhas.map((l, i) => (
                      <tr key={`${l.cliente}-${i}`}>
                        <td>{l.cliente}</td>
                        <td>{l.doc}</td>
                        <td>{l.origem === "sucumbencial" ? "Sucumbencial" : "Contratual"}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(l.valor)}</td>
                        <td>{formatDate(l.data)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          ))}

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--text-muted)" }}>Total contratual</span>
              <span>{formatCurrency(rel.totalPorOrigem.contratual)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--text-muted)" }}>Total sucumbencial</span>
              <span>{formatCurrency(rel.totalPorOrigem.sucumbencial)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--gray-border)", paddingTop: 8, fontWeight: 600 }}>
              <span>Total geral apurado em {ano}</span>
              <span className="valor">{formatCurrency(rel.totalGeral)}</span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
