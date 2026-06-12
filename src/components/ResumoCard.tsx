import { formatCurrency } from "@/lib/utils/format";

/**
 * Bloco "Resumo" financeiro padrão da aplicação (sem avatar).
 * Mostra nome do escritório/advogado + pendente, recebido e clientes ativos.
 */
export function ResumoCard({
  nome,
  somaAberto,
  somaRecebido,
  clientesAtivos,
}: {
  nome: string;
  somaAberto: number;
  somaRecebido: number;
  clientesAtivos: number;
}) {
  return (
    <>
      <p className="details-section-title" style={{ marginTop: 0 }}>
        Resumo
      </p>
      <div className="adv-cards-row">
        <div className="adv-card">
          <div className="adv-info">
            <span className="adv-nome">{nome}</span>
            <span className="adv-stat">
              Pendente:{" "}
              <strong style={{ color: "var(--ink)" }}>{formatCurrency(somaAberto)}</strong>
            </span>
            <span className="adv-stat">
              Recebido:{" "}
              <strong style={{ color: somaRecebido > 0 ? "var(--success)" : "var(--body)" }}>
                {formatCurrency(somaRecebido)}
              </strong>
            </span>
            <span className="adv-stat">
              Clientes Ativos: <strong>{clientesAtivos}</strong>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
