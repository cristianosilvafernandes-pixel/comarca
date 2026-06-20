"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { registrarLembrete } from "./actions";

interface Props {
  parcelaId: string;
  clienteNome: string;
  mensagem: string;
  waUrl: string | null;
  label?: string;
}

function formatarTelefone(waUrl: string): string {
  const num = waUrl.split("wa.me/")[1]?.split("?")[0] ?? "";
  const local = num.startsWith("55") ? num.slice(2) : num;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return local;
}

function injetarBoleto(mensagem: string, boleto: string): string {
  const linha = `💳 Boleto: ${boleto.trim()}\n`;
  const marcador = "Chave PIX para pagamento:";
  const idx = mensagem.indexOf(marcador);
  if (idx === -1) return mensagem + `\n${linha}`;
  return mensagem.slice(0, idx) + linha + mensagem.slice(idx);
}

function buildUrlWaMe(waUrl: string, msg: string): string {
  const num = waUrl.split("wa.me/")[1]?.split("?")[0] ?? "";
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

export function LembreteButton({ parcelaId, clienteNome, mensagem, waUrl, label }: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const [boleto, setBoleto] = useState("");
  const [msgEditada, setMsgEditada] = useState(mensagem);
  const [done, setDone] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (modalAberto && textareaRef.current) {
      textareaRef.current.scrollTop = 0;
    }
  }, [modalAberto]);

  if (!waUrl) {
    return (
      <span style={{ fontSize: 12, color: "var(--text-muted)" }} title="WhatsApp do cliente inválido">
        sem WhatsApp
      </span>
    );
  }

  function abrirModal() {
    setBoleto("");
    setMsgEditada(mensagem);
    setModalAberto(true);
  }

  function onBoletoChange(valor: string) {
    setBoleto(valor);
    setMsgEditada(valor.trim() ? injetarBoleto(mensagem, valor) : mensagem);
  }

  async function enviar() {
    setModalAberto(false);
    try {
      await navigator.clipboard.writeText(msgEditada);
    } catch {
      // clipboard pode falhar; segue para o wa.me mesmo assim
    }
    window.open(buildUrlWaMe(waUrl as string, msgEditada), "_blank", "noopener");
    await registrarLembrete(parcelaId);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  const telefone = formatarTelefone(waUrl);

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={abrirModal}
        title="Copia a mensagem e abre o WhatsApp"
      >
        {done ? "✓ enviado" : (label ?? "💬 Lembrete")}
      </button>

      {modalAberto && createPortal(
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => e.target === e.currentTarget && setModalAberto(false)}
        >
          <div
            style={{
              background: "#fff",
              color: "#111",
              borderRadius: 12,
              boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
              width: "min(520px, 100%)",
              display: "flex", flexDirection: "column", gap: 0,
              maxHeight: "90vh", overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px 16px",
              borderBottom: "1px solid var(--border)",
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                📱 Enviar Lembrete via WhatsApp
              </h3>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                style={{
                  background: "var(--surface-raised)", border: "none", borderRadius: 6,
                  width: 28, height: 28, cursor: "pointer", fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)",
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
              {/* Destinatário */}
              <div style={{ fontSize: 14, display: "flex", flexDirection: "column", gap: 4 }}>
                <div><strong>Para:</strong> {clienteNome}</div>
                <div><strong>WhatsApp:</strong> {telefone}</div>
              </div>

              {/* Boleto */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>
                  Código de barras do boleto <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Cole aqui o código de barras"
                  value={boleto}
                  onChange={(e) => onBoletoChange(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Mensagem editável */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Mensagem (editável):</label>
                <textarea
                  ref={textareaRef}
                  className="input"
                  rows={10}
                  value={msgEditada}
                  onChange={(e) => setMsgEditada(e.target.value)}
                  style={{ fontFamily: "monospace", fontSize: 13, resize: "vertical" }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: "flex", gap: 8, justifyContent: "flex-end",
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
            }}>
              <button type="button" className="btn btn-ghost" onClick={() => setModalAberto(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={enviar}>
                Copiar e abrir WhatsApp
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
