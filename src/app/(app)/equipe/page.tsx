import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteAdvogado } from "./actions";

export const metadata: Metadata = {
  title: "Equipe — Comarca Honorários",
};

function initials(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export default async function EquipePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("advogados")
    .select("id, nome, oab, ativo")
    .order("nome");
  const advogados = data ?? [];

  return (
    <div>
      <div className="page-head">
        <h1>Equipe</h1>
        <Link href="/equipe/novo" className="btn btn-blue">
          + Novo advogado
        </Link>
      </div>

      {advogados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3>Nenhum advogado cadastrado</h3>
          <p style={{ margin: "8px 0 16px" }}>
            Cadastre os advogados do escritório para vincular honorários a cada um.
          </p>
          <Link href="/equipe/novo" className="btn btn-blue">
            Cadastrar advogado
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {advogados.map((adv) => (
            <div key={adv.id} className="card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="client-initials-avatar">{initials(adv.nome)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{adv.nome}</div>
                  {adv.oab && (
                    <div style={{ fontSize: 13, color: "var(--body)", marginTop: 2 }}>
                      {adv.oab}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href={`/equipe/${adv.id}/editar`} className="btn btn-secondary">
                    ✏️ Editar
                  </Link>
                  <form action={deleteAdvogado}>
                    <input type="hidden" name="id" value={adv.id} />
                    <button
                      type="submit"
                      className="btn btn-secondary"
                      style={{ color: "var(--error)" }}
                      onClick={(e) => {
                        if (!confirm("Remover este advogado? Honorários vinculados ficam sem responsável.")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      🗑 Remover
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
