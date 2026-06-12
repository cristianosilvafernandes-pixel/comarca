"use client";

import { useState, useTransition } from "react";
import { deleteCliente } from "../../actions";

export function DeleteClienteButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirm) {
    return (
      <button type="button" className="btn btn-danger" onClick={() => setConfirm(true)}>
        Excluir cliente
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
        onClick={() => {
          const fd = new FormData();
          fd.append("id", id);
          startTransition(() => deleteCliente(fd));
        }}
      >
        {isPending ? "Excluindo…" : "Sim, excluir"}
      </button>
      <button type="button" className="btn btn-secondary" onClick={() => setConfirm(false)}>
        Cancelar
      </button>
    </span>
  );
}
