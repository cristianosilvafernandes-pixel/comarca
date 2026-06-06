"use client";

import { useActionState, useState } from "react";
import { maskCPF } from "@/lib/utils/cpf";
import { marcarParcelaPaga, type ParcelaPagaState } from "./actions";

interface Props {
  parcelaId: string;
  honorarioId: string;
  status: "em_aberto" | "pago" | "pago_verificacao";
  dataPagamento?: string | null;
}

export function ParcelaActions({ parcelaId, honorarioId, status, dataPagamento }: Props) {
  const [open, setOpen] = useState(false);
  const [origem, setOrigem] = useState<"contratual" | "sucumbencial">("contratual");
  const [doc, setDoc] = useState("");
  const [state, formAction, pending] = useActionState<ParcelaPagaState, FormData>(
    marcarParcelaPaga,
    undefined,
  );

  if (status === "pago") {
    return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{dataPagamento ?? "pago"}</span>;
  }

  const cta = status === "pago_verificacao" ? "Validar" : "Marcar pago";

  if (!open) {
    return (
      <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
        {cta}
      </button>
    );
  }

  return (
    <form action={formAction} style={{ display: "grid", gap: 8, minWidth: 220 }}>
      <input type="hidden" name="parcela_id" value={parcelaId} />
      <input type="hidden" name="honorario_id" value={honorarioId} />

      {state?.error && <div className="auth-alert error" style={{ margin: 0 }}>{state.error}</div>}

      <select
        name="origem_pagamento"
        className="form-control"
        value={origem}
        onChange={(e) => setOrigem(e.target.value as "contratual" | "sucumbencial")}
      >
        <option value="contratual">Contratual (cliente)</option>
        <option value="sucumbencial">Sucumbencial (parte contrária)</option>
      </select>

      {origem === "sucumbencial" && (
        <input
          name="doc_pagador"
          className="form-control"
          value={doc}
          onChange={(e) => setDoc(maskCPF(e.target.value))}
          placeholder="CPF/CNPJ do pagador"
          inputMode="numeric"
        />
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn btn-success" disabled={pending}>
          {pending ? "Salvando…" : "Confirmar"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
