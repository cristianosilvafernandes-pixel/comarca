"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { saveAdvogado, type AdvogadoState } from "./actions";
import type { Advogado } from "@/lib/database.types";

export function AdvogadoForm({ advogado }: { advogado?: Advogado }) {
  const [state, formAction, pending] = useActionState<AdvogadoState, FormData>(
    saveAdvogado,
    undefined,
  );

  return (
    <form action={formAction} className="card" style={{ maxWidth: 480 }}>
      {advogado?.id && <input type="hidden" name="id" value={advogado.id} />}

      {state?.error && <div className="auth-alert error">{state.error}</div>}

      <div className="form-group">
        <label htmlFor="adv-nome">Nome completo *</label>
        <input
          id="adv-nome"
          name="nome"
          className="form-control"
          defaultValue={advogado?.nome ?? ""}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="adv-oab">OAB</label>
        <input
          id="adv-oab"
          name="oab"
          className="form-control"
          defaultValue={advogado?.oab ?? ""}
          placeholder="Ex: OAB/RS 123.456"
        />
      </div>

      <Button type="submit" disabled={pending} style={{ marginTop: 8 }}>
        {pending ? "Salvando…" : advogado?.id ? "Salvar alterações" : "Cadastrar advogado"}
      </Button>
    </form>
  );
}
