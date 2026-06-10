"use client";

import { useState } from "react";
import { registrarLembrete } from "./actions";

interface Props {
  parcelaId: string;
  mensagem: string;
  waUrl: string | null;
  label?: string;
}

export function LembreteButton({ parcelaId, mensagem, waUrl, label }: Props) {
  const [done, setDone] = useState(false);

  if (!waUrl) {
    return (
      <span style={{ fontSize: 12, color: "var(--text-muted)" }} title="WhatsApp do cliente inválido">
        sem WhatsApp
      </span>
    );
  }

  async function enviar() {
    try {
      await navigator.clipboard.writeText(mensagem);
    } catch {
      // clipboard pode falhar; segue para o wa.me mesmo assim
    }
    window.open(waUrl as string, "_blank", "noopener");
    await registrarLembrete(parcelaId);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <button type="button" className="btn btn-secondary" onClick={enviar} title="Copia a mensagem e abre o WhatsApp">
      {done ? "✓ enviado" : (label ?? "💬 Lembrete")}
    </button>
  );
}
