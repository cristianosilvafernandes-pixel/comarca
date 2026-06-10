"use client";

import { useMemo, useState } from "react";
import { montarContrato } from "@/lib/domain/contrato";
import { montarUrlWaMe } from "@/lib/domain/lembrete";

interface ClienteOpt {
  id: string;
  nome: string;
  cpf: string;
  endereco: string | null;
  whatsapp: string;
}

interface AdvogadoOpt {
  id: string;
  nome: string;
  oab: string | null;
}

interface Props {
  clientes: ClienteOpt[];
  advogados?: AdvogadoOpt[];
  advogadoNome: string;
  advogadoOab: string | null;
  foro: string | null;
  hoje: string;
}

export function ContratoForm({ clientes, advogados = [], advogadoNome, advogadoOab, foro, hoje }: Props) {
  const [clienteId, setClienteId] = useState("");
  const [objeto, setObjeto] = useState("Defesa em processo judicial");
  const [valor, setValor] = useState("R$ 3.600,00");
  const [editado, setEditado] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [advId, setAdvId] = useState(advogados[0]?.id ?? "");

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;
  const advSelecionado = advogados.find((a) => a.id === advId);
  const nomeAdv = advSelecionado?.nome ?? advogadoNome;
  const oabAdv = advSelecionado?.oab ?? advogadoOab;

  const gerado = useMemo(
    () =>
      montarContrato({
        clienteNome: cliente?.nome,
        clienteCpf: cliente?.cpf,
        clienteEndereco: cliente?.endereco,
        advogadoNome: nomeAdv,
        advogadoOab: oabAdv,
        objeto,
        valor,
        foro,
        dataHoje: hoje,
      }),
    [cliente, nomeAdv, oabAdv, objeto, valor, foro, hoje],
  );

  const texto = editado ?? gerado;

  function enviarWhatsApp() {
    if (!cliente) {
      setMsg("Selecione um cliente para enviar.");
      return;
    }
    const url = montarUrlWaMe(cliente.whatsapp, texto);
    if (!url) {
      setMsg("WhatsApp do cliente inválido.");
      return;
    }
    window.open(url, "_blank");
  }

  async function baixar() {
    const { jsPDF } = await import("jspdf");
    const nome = (cliente?.nome ?? "contrato").replace(/\s+/g, "_");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 20;
    const usableWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = doc.internal.pageSize.getHeight();
    const lineH = 5;
    let y = margin;

    doc.setFont("Courier");
    doc.setFontSize(10);

    for (const line of doc.splitTextToSize(texto, usableWidth)) {
      if (y + lineH > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line as string, margin, y);
      y += lineH;
    }

    doc.save(`Contrato_${nome}.pdf`);
  }

  return (
    <>
      <div className="card" style={{ maxWidth: 720 }}>
        {advogados.length > 1 && (
          <div className="form-group">
            <label htmlFor="contrato-advogado">Advogado *</label>
            <select
              id="contrato-advogado"
              className="form-control"
              value={advId}
              onChange={(e) => {
                setAdvId(e.target.value);
                setEditado(null);
              }}
            >
              {advogados.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}{a.oab ? ` — OAB ${a.oab}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="contrato-cliente">Cliente *</label>
          <select
            id="contrato-cliente"
            className="form-control"
            value={clienteId}
            onChange={(e) => {
              setClienteId(e.target.value);
              setEditado(null);
            }}
          >
            <option value="">Selecione…</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="contrato-objeto">Objeto da prestação de serviço</label>
          <input
            id="contrato-objeto"
            className="form-control"
            value={objeto}
            onChange={(e) => {
              setObjeto(e.target.value);
              setEditado(null);
            }}
            placeholder="Ex: Defesa em ação trabalhista"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contrato-valor">Valor dos honorários</label>
          <input
            id="contrato-valor"
            className="form-control"
            value={valor}
            onChange={(e) => {
              setValor(e.target.value);
              setEditado(null);
            }}
            placeholder="R$ 0,00"
          />
        </div>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <label htmlFor="contrato-texto">Texto do contrato (editável)</label>
        <textarea
          id="contrato-texto"
          className="form-control"
          rows={18}
          style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 14, lineHeight: 1.6, resize: "vertical" }}
          value={texto}
          onChange={(e) => setEditado(e.target.value)}
        />
        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-success" onClick={enviarWhatsApp}>
            📲 Enviar por WhatsApp
          </button>
          <button type="button" className="btn btn-secondary" onClick={baixar}>
            ⬇ Baixar (.pdf)
          </button>
        </div>
        {msg && <p className="error-msg" style={{ marginTop: 10 }}>{msg}</p>}
      </div>
    </>
  );
}
