"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./public.module.css";

interface Props {
  token: string;
  numeroParcela: number;
  chavePix: string;
  copiaCola: string | null;
  podeConfirmar: boolean;
}

export function PublicActions({ token, numeroParcela, chavePix, copiaCola, podeConfirmar }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function copiar(texto: string, label: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setMsg(`${label} copiado!`);
      setTimeout(() => setMsg(null), 2500);
    } catch {
      setMsg("Não foi possível copiar.");
    }
  }

  async function confirmar() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/h/${token}/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero_parcela: numeroParcela }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        router.refresh();
      } else {
        setMsg("Não foi possível confirmar. Tente novamente.");
      }
    } catch {
      setMsg("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => copiar(chavePix, "Chave PIX")}>
          📋 Copiar chave
        </button>
        {copiaCola && (
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => copiar(copiaCola, "Código PIX")}>
            📋 Copiar código PIX
          </button>
        )}
      </div>

      {podeConfirmar && (
        <div className={styles.actions} style={{ marginTop: 16 }}>
          <p className={styles.actionText}>Já efetuou o pagamento desta parcela?</p>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={confirmar} disabled={loading}>
            {loading ? "Confirmando…" : "✓ Confirmar pagamento"}
          </button>
        </div>
      )}

      {msg && <p className={styles.actionText} style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}
