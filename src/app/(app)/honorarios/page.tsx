import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { resolveStatus, statusLabel } from "@/lib/utils/status";

export const metadata: Metadata = {
  title: "Honorários — Comarca Honorários",
};

const TIPO_LABEL: Record<string, string> = {
  fixo_parcelado: "Fixo parcelado",
  recorrente: "Recorrente",
  ad_exitum: "Ad êxitum",
  fixo_exitum: "Fixo + êxito",
};

type Parcela = { numero: number; valor: number; vencimento: string; status_registrado: "em_aberto" | "pago" | "pago_verificacao" };

export default async function HonorariosPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("honorarios")
    .select("id, tipo, processo, valor_total, valor_mensal, clientes:cliente_id(nome), parcelas(numero, valor, vencimento, status_registrado)")
    .order("created_at", { ascending: false });

  const honorarios = data ?? [];

  return (
    <div>
      <div className="page-head">
        <h1>Honorários</h1>
        <Link href="/honorarios/novo" className="btn btn-primary">
          + Novo honorário
        </Link>
      </div>

      {honorarios.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h3>Nenhum honorário ainda</h3>
          <p style={{ margin: "8px 0 16px" }}>Cadastre um honorário para gerar parcelas e cobrar.</p>
          <Link href="/honorarios/novo" className="btn btn-primary">
            Cadastrar honorário
          </Link>
        </div>
      ) : (
        <div className="summary-grid">
          {honorarios.map((h) => {
            const parcelas = (h.parcelas ?? []) as Parcela[];
            const cliente = (h.clientes as { nome: string } | null)?.nome ?? "—";
            const emAberto = parcelas
              .filter((p) => p.status_registrado === "em_aberto")
              .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
            const proxima = emAberto[0];
            const st = proxima ? resolveStatus(proxima.status_registrado, proxima.vencimento) : null;

            return (
              <Link key={h.id} href={`/honorarios/${h.id}`} className="card" style={{ display: "block" }}>
                <div className="fee-card-title">{cliente}</div>
                <div className="fee-card-process">{TIPO_LABEL[h.tipo] ?? h.tipo}{h.processo ? ` · ${h.processo}` : ""}</div>
                <div className="fee-card-middle">
                  <span className="fee-card-meta">
                    {proxima
                      ? `Próx.: ${formatCurrency(proxima.valor)} em ${formatDate(proxima.vencimento)}`
                      : "Sem parcelas em aberto"}
                  </span>
                  {st && <span className={`badge badge-${st}`}>{statusLabel(st)}</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {parcelas.length} parcela(s)
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
