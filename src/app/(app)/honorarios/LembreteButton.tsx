"use client";

import { useState, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
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
      <span style={{ fontSize: 12, color: "var(--mute)" }} title="WhatsApp do cliente inválido">
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
        {done ? "Enviado" : (label ?? "Lembrete")}
      </button>

      <Modal
        open={modalAberto}
        title="📱 Enviar lembrete via WhatsApp"
        onClose={() => setModalAberto(false)}
        fullscreenMobile
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalAberto(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={enviar}>
              Copiar e abrir WhatsApp
            </button>
          </>
        }
      >
        {/* Destinatário */}
        <div style={{ fontSize: 14, display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
          <div><strong>Para:</strong> {clienteNome}</div>
          <div><strong>WhatsApp:</strong> {telefone}</div>
        </div>

        {/* Boleto */}
        <div className="form-group">
          <label>
            Código de barras do boleto{" "}
            <span style={{ fontWeight: 400, color: "var(--mute)" }}>(opcional)</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Cole aqui o código de barras"
            value={boleto}
            onChange={(e) => onBoletoChange(e.target.value)}
            autoFocus
          />
        </div>

        {/* Mensagem editável */}
        <div className="form-group">
          <label>Mensagem (editável)</label>
          <textarea
            ref={textareaRef}
            className="form-control"
            rows={10}
            value={msgEditada}
            onChange={(e) => setMsgEditada(e.target.value)}
            style={{ fontFamily: "var(--font-mono)", fontSize: 13, resize: "vertical" }}
          />
        </div>
      </Modal>
    </>
  );
}
