"use client";

import { useActionState } from "react";
import { updateProfile, type PerfilState } from "./actions";
import type { Plano } from "@/lib/database.types";

interface Props {
  nome: string;
  oab: string | null;
  chavePix: string | null;
  foro: string | null;
  plano: Plano;
}

const PLANO_LABEL: Record<Plano, string> = {
  free: "Grátis",
  essencial: "Essencial",
  profissional: "Profissional",
};

export function PerfilForm({ nome, oab, chavePix, foro, plano }: Props) {
  const [state, formAction, pending] = useActionState<PerfilState, FormData>(updateProfile, undefined);

  return (
    <form action={formAction} className="card" style={{ maxWidth: 560 }}>
      {state?.error && <div className="auth-alert error">{state.error}</div>}
      {state?.success && <div className="auth-alert success">Perfil atualizado.</div>}

      <div className="form-group">
        <label htmlFor="nome">Nome completo *</label>
        <input id="nome" name="nome" className="form-control" required defaultValue={nome} placeholder="Dr. João da Silva" />
      </div>

      <div className="form-group">
        <label htmlFor="oab">OAB</label>
        <input id="oab" name="oab" className="form-control" defaultValue={oab ?? ""} placeholder="OAB/RS 107.295" />
      </div>

      <div className="form-group">
        <label htmlFor="chave_pix">Chave PIX</label>
        <input id="chave_pix" name="chave_pix" className="form-control" defaultValue={chavePix ?? ""} placeholder="CPF, e-mail, telefone ou aleatória" />
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
          Usada na página pública de pagamento e nos lembretes. Você recebe 100% direto nela.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="foro">Foro (comarca/UF)</label>
        <input id="foro" name="foro" className="form-control" defaultValue={foro ?? ""} placeholder="Pelotas/RS" />
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
          Usado no contrato de honorários.
        </p>
      </div>

      <div className="form-group">
        <label>Plano atual</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 600 }}>{PLANO_LABEL[plano]}</span>
          <a href="/planos" style={{ fontSize: 14, color: "var(--link)" }}>
            Gerenciar plano →
          </a>
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Salvando…" : "Salvar perfil"}
      </button>
    </form>
  );
}
