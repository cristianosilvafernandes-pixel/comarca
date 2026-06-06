import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { maskCPF } from "@/lib/utils/cpf";
import { maskPhone } from "@/lib/utils/phone";
import { deleteCliente } from "./actions";

export const metadata: Metadata = {
  title: "Clientes — Comarca Honorários",
};

function initials(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

const ERROS: Record<string, string> = {
  tem_honorarios: "Não é possível excluir: este cliente possui honorários. Encerre-os antes.",
  falha_excluir: "Não foi possível excluir o cliente.",
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("clientes")
    .select("id, nome, cpf, whatsapp, email")
    .order("nome");

  const clientes = data ?? [];

  return (
    <div>
      <div className="page-head">
        <h1>Clientes</h1>
        <Link href="/clientes/novo" className="btn btn-primary">
          + Novo cliente
        </Link>
      </div>

      {error && ERROS[error] && <div className="auth-alert error">{ERROS[error]}</div>}

      {clientes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>Nenhum cliente cadastrado</h3>
          <p style={{ margin: "8px 0 16px" }}>Cadastre seu primeiro cliente para criar honorários.</p>
          <Link href="/clientes/novo" className="btn btn-primary">
            Cadastrar cliente
          </Link>
        </div>
      ) : (
        <div className="summary-grid">
          {clientes.map((c) => (
            <div key={c.id} className="card client-card">
              <div className="client-profile-row">
                <div className="client-initials-avatar">{initials(c.nome)}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.nome}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{maskCPF(c.cpf)}</div>
                </div>
              </div>
              <div className="client-details-grid">
                <div>📱 {maskPhone(c.whatsapp.replace(/^\+55/, ""))}</div>
                {c.email && <div>✉️ {c.email}</div>}
              </div>
              <div className="fee-card-actions">
                <Link href={`/clientes/${c.id}/editar`} className="btn btn-secondary">
                  Editar
                </Link>
                <form action={deleteCliente}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="btn btn-danger">
                    Excluir
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
