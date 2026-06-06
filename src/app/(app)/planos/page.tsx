import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { changePlano } from "./actions";
import { LIMITES } from "@/lib/domain/planos";
import type { Plano } from "@/lib/database.types";

export const metadata: Metadata = {
  title: "Planos — Comarca Honorários",
};

const PLANOS: { id: Plano; nome: string; preco: string }[] = [
  { id: "free", nome: "Grátis", preco: "R$0" },
  { id: "essencial", nome: "Essencial", preco: "R$19" },
  { id: "profissional", nome: "Profissional", preco: "R$37" },
];

function fmtLimite(n: number): string {
  return n === Infinity ? "Ilimitado" : String(n);
}

export default async function PlanosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { count: nClientes }, { count: nHonorarios }] = await Promise.all([
    supabase.from("profiles").select("plano").eq("id", user.id).maybeSingle(),
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase.from("honorarios").select("*", { count: "exact", head: true }),
  ]);

  const atual = (profile?.plano ?? "free") as Plano;
  const lim = LIMITES[atual];

  return (
    <div>
      <div className="page-head">
        <h1>Planos</h1>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <strong>Uso atual ({PLANOS.find((p) => p.id === atual)?.nome})</strong>
        <div style={{ display: "flex", gap: 24, marginTop: 8, flexWrap: "wrap", color: "var(--text-muted)" }}>
          <span>Clientes: {nClientes ?? 0} / {fmtLimite(lim.clientes)}</span>
          <span>Honorários: {nHonorarios ?? 0} / {fmtLimite(lim.honorarios)}</span>
          <span>Lembretes/mês: {fmtLimite(lim.lembretes)}</span>
        </div>
      </div>

      <div className="summary-grid">
        {PLANOS.map((p) => {
          const l = LIMITES[p.id];
          const ehAtual = p.id === atual;
          return (
            <div key={p.id} className="card" style={ehAtual ? { borderColor: "var(--primary)" } : undefined}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3>{p.nome}</h3>
                {ehAtual && <span className="badge badge-pago">Atual</span>}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, margin: "8px 0" }}>
                {p.preco}
                <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-muted)" }}>/mês</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", fontSize: 14 }}>
                <li>✓ {fmtLimite(l.clientes)} clientes</li>
                <li>✓ {fmtLimite(l.honorarios)} honorários ativos</li>
                <li>✓ {fmtLimite(l.lembretes)} lembretes/mês</li>
              </ul>
              {ehAtual ? (
                <button className="btn btn-secondary" disabled>
                  Plano atual
                </button>
              ) : (
                <form action={changePlano}>
                  <input type="hidden" name="plano" value={p.id} />
                  <button type="submit" className="btn btn-primary">
                    Mudar para {p.nome}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
        Cobrança de assinatura ainda não está integrada (fora do MVP). A troca de plano altera os
        limites imediatamente. Sem taxa sobre o PIX — você sempre recebe 100% na sua conta.
      </p>
    </div>
  );
}
