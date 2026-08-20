"use client";

import { deleteAdvogado } from "./actions";

export function DeleteButton({ id }: { id: string }) {
  return (
    <form action={deleteAdvogado}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="btn btn-danger"
        onClick={(e) => {
          if (!confirm("Remover este advogado? Honorários vinculados ficam sem responsável.")) {
            e.preventDefault();
          }
        }}
      >
        Excluir advogado
      </button>
    </form>
  );
}
