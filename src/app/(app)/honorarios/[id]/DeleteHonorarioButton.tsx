"use client";

import { useState, useTransition } from "react";
import { deleteHonorario } from "../actions";

export function DeleteHonorarioButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirm) {
    return (
      <button type="button" className="btn btn-danger" onClick={() => setConfirm(true)}>
        Excluir honorário
      </button>
    );
  }

  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <span style={{ fontSize: 14 }}>Confirmar exclusão?</span>
      <button
        type="button"
        className="btn btn-danger"
        disabled={isPending}
        onClick={() => startTransition(() => void deleteHonorario(id))}
      >
        {isPending ? "Excluindo…" : "Sim, excluir"}
      </button>
      <button type="button" className="btn btn-secondary" onClick={() => setConfirm(false)}>
        Cancelar
      </button>
    </span>
  );
}
