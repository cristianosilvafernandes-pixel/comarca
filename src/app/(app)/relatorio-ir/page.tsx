import type { Metadata } from "next";
import { fetchParcelasIR } from "./data";
import { YearSelect } from "./YearSelect";
import { agregarRelatorioIR, anoApuracao } from "@/lib/domain/ir";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Relatório IR — Comarca Honorários",
};

export default async function RelatorioIRPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const { ano: anoParam } = await searchParams;
  const parcelas = await fetchParcelasIR();

  const anoAtual = new Date().getUTCFullYear();
  const anosDisponiveis = Array.from(
    new Set([anoAtual, ...parcelas.map(anoApuracao)]),
  ).sort((a, b) => b - a);

  const ano = anoParam ? Number(anoParam) : anosDisponiveis[0];
  const rel = agregarRelatorioIR(parcelas, ano);
  const temLancamentos = rel.totalGeral > 0;

  return (
    <div>
      <div className="page-head">
        <h1>Relatório de Rendimentos (IR)</h1>
        <a className="btn btn-primary" href={`/relatorio-ir/csv?ano=${ano}`}>
          ⬇ Exportar CSV
        </a>
      </div>

      <div className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <label style={{ marginBottom: 0 }}>Ano de apuração:</label>
        <YearSelect anos={anosDisponiveis} ano={ano} />
      </div>

      {!temLancamentos ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧾</div>
          <h3>Sem rendimentos em {ano}</h3>
          <p style={{ marginTop: 8 }}>
            Marque parcelas como pagas para que apareçam aqui na apuração do ano.
          </p>
        </div>
      ) : (
        <>
          {rel.grupos.map((g) => (
            <div className="card" key={g.categoria} style={{ padding: 0, overflowX: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--gray-border)" }}>
                <strong>{g.categoria}</strong>
                <strong>{formatCurrency(g.total)}</strong>
              </div>
              {g.linhas.length === 0 ? (
                <div style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 13 }}>
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
            </div>
          ))}

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--text-muted)" }}>Total contratual</span>
              <span>{formatCurrency(rel.totalPorOrigem.contratual)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--text-muted)" }}>Total sucumbencial</span>
              <span>{formatCurrency(rel.totalPorOrigem.sucumbencial)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--gray-border)", paddingTop: 8, fontWeight: 700 }}>
              <span>Total geral apurado em {ano}</span>
              <span className="valor">{formatCurrency(rel.totalGeral)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
