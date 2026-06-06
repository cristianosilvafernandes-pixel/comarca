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

interface Props {
  clientes: ClienteOpt[];
  advogadoNome: string;
  advogadoOab: string | null;
  foro: string | null;
  hoje: string;
}

export function ContratoForm({ clientes, advogadoNome, advogadoOab, foro, hoje }: Props) {
  const [clienteId, setClienteId] = useState("");
  const [objeto, setObjeto] = useState("Defesa em processo judicial");
  const [valor, setValor] = useState("R$ 3.600,00");
  const [editado, setEditado] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;

  const gerado = useMemo(
    () =>
      montarContrato({
        clienteNome: cliente?.nome,
        clienteCpf: cliente?.cpf,
        clienteEndereco: cliente?.endereco,
        advogadoNome,
        advogadoOab,
        objeto,
        valor,
        foro,
        dataHoje: hoje,
      }),
    [cliente, advogadoNome, advogadoOab, objeto, valor, foro, hoje],
  );

  // Texto efetivo: o gerado, exceto se o usuário editou manualmente.
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

  function baixar() {
    const nome = (cliente?.nome ?? "contrato").replace(/\s+/g, "_");
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Contrato_${nome}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="card" style={{ maxWidth: 720 }}>
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
          style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, lineHeight: 1.6, resize: "vertical" }}
          value={texto}
          onChange={(e) => setEditado(e.target.value)}
        />
        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-success" onClick={enviarWhatsApp}>
            📲 Enviar por WhatsApp
          </button>
          <button type="button" className="btn btn-secondary" onClick={baixar}>
            ⬇ Baixar (.txt)
          </button>
        </div>
        {msg && <p className="error-msg" style={{ marginTop: 10 }}>{msg}</p>}
      </div>
    </>
  );
}
