"use client";

import { deleteAdvogado } from "./actions";

export function DeleteButton({ id }: { id: string }) {
  return (
    <form action={deleteAdvogado}>
      <input type="hidden" name="id" value={id} />
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
  );
}
