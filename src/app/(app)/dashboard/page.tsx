import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resolveStatus } from "@/lib/utils/status";
import { formatCurrency } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Painel — Comarca Honorários",
};

type ParcelaRow = {
  valor: number;
  vencimento: string;
  status_registrado: "em_aberto" | "pago" | "pago_verificacao";
};

function resumir(parcelas: ParcelaRow[]) {
  let pendentes = 0,
    urgentes = 0,
    confirmados = 0;
  let nPendentes = 0,
    nUrgentes = 0,
    nConfirmados = 0;

  for (const p of parcelas) {
    const s = resolveStatus(p.status_registrado, p.vencimento);
    if (s === "pendente" || s === "vencendo") {
      pendentes += p.valor;
      nPendentes++;
    }
    if (s === "atrasado" || s === "vencendo") {
      urgentes += p.valor;
      nUrgentes++;
    }
    if (s === "pago") {
      confirmados += p.valor;
      nConfirmados++;
    }
  }
  return { pendentes, urgentes, confirmados, nPendentes, nUrgentes, nConfirmados };
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("parcelas")
    .select("valor, vencimento, status_registrado");

  const parcelas = (data ?? []) as ParcelaRow[];
  const r = resumir(parcelas);
  const vazio = parcelas.length === 0;

  return (
    <div>
      <div className="page-head">
        <h1>Painel</h1>
        <Link href="/honorarios/novo" className="btn btn-primary">
          + Novo honorário
        </Link>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon" style={{ background: "var(--primary-light)" }}>
            ⏳
          </div>
          <div className="summary-info">
            <span className="val">{formatCurrency(r.pendentes)}</span>
            <span className="label">Pendentes</span>
            <span className="desc">{r.nPendentes} parcela(s) em aberto</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon" style={{ background: "var(--warning-light)" }}>
            🔥
          </div>
          <div className="summary-info">
            <span className="val">{formatCurrency(r.urgentes)}</span>
            <span className="label">Urgentes</span>
            <span className="desc">{r.nUrgentes} vencendo / atrasada(s)</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon" style={{ background: "var(--success-light)" }}>
            ✅
          </div>
          <div className="summary-info">
            <span className="val">{formatCurrency(r.confirmados)}</span>
            <span className="label">Confirmados</span>
            <span className="desc">{r.nConfirmados} parcela(s) paga(s)</span>
          </div>
        </div>
      </div>

      {vazio && (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h3>Nenhum honorário ainda</h3>
          <p style={{ margin: "8px 0 16px" }}>
            Cadastre seu primeiro honorário para começar a acompanhar parcelas e enviar lembretes.
          </p>
          <Link href="/honorarios/novo" className="btn btn-primary">
            Cadastrar honorário
          </Link>
        </div>
      )}
    </div>
  );
}
