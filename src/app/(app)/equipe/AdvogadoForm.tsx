"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
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

      {state?.error && <Alert>{state.error}</Alert>}

      <FormField label="Nome completo *" htmlFor="adv-nome">
        <input
          id="adv-nome"
          name="nome"
          className="form-control"
          defaultValue={advogado?.nome ?? ""}
          required
        />
      </FormField>

      <FormField label="OAB" htmlFor="adv-oab">
        <input
          id="adv-oab"
          name="oab"
          className="form-control"
          defaultValue={advogado?.oab ?? ""}
          placeholder="Ex: OAB/RS 123.456"
        />
      </FormField>

      <Button type="submit" disabled={pending} style={{ marginTop: 8 }}>
        {pending ? "Salvando…" : advogado?.id ? "Salvar alterações" : "Cadastrar advogado"}
      </Button>
    </form>
  );
}
