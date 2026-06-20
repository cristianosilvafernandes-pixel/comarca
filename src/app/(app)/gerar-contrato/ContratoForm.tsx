"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
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
  foro: string | null;
  hoje: string;
  escritorioNome?: string | null;
}

export function ContratoForm({ clientes, advogados = [], foro, hoje, escritorioNome }: Props) {
  const [clienteId, setClienteId] = useState("");
  const [objeto, setObjeto] = useState("Defesa em processo judicial");
  const [valor, setValor] = useState("R$ 3.600,00");
  const [editado, setEditado] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [advIds, setAdvIds] = useState<string[]>(() =>
    advogados[0] ? [advogados[0].id] : [],
  );

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;

  function toggleAdv(id: string, checked: boolean) {
    setAdvIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      if (prev.length <= 1) return prev;
      return prev.filter((x) => x !== id);
    });
    setEditado(null);
  }

  const gerado = useMemo(() => {
    const signatarios = advogados
      .filter((a) => advIds.includes(a.id))
      .map((a) => ({ nome: a.nome, oab: a.oab }));
    return montarContrato({
      clienteNome: cliente?.nome,
      clienteCpf: cliente?.cpf,
      clienteEndereco: cliente?.endereco,
      signatarios,
      objeto,
      valor,
      foro,
      dataHoje: hoje,
    });
  }, [cliente, advogados, advIds, objeto, valor, foro, hoje]);

  const texto = editado ?? gerado;

  async function gerarPdf() {
    const { jsPDF } = await import("jspdf");
    const nome = (cliente?.nome ?? "contrato").replace(/\s+/g, "_");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 20;
    const usableWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = doc.internal.pageSize.getHeight();
    const lineH = 5;
    let y = margin;

    if (escritorioNome) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.text(escritorioNome, doc.internal.pageSize.getWidth() / 2, y, { align: "center" });
      y += 8;
      doc.setDrawColor(180, 180, 180);
      doc.line(margin, y, doc.internal.pageSize.getWidth() - margin, y);
      y += 8;
    }

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

    return { doc, nome };
  }

  async function enviarWhatsApp() {
    if (!cliente) {
      setMsg("Selecione um cliente para enviar.");
      return;
    }
    const whatsappUrl = montarUrlWaMe(cliente.whatsapp, "");
    if (!whatsappUrl) {
      setMsg("WhatsApp do cliente inválido.");
      return;
    }

    const { doc, nome } = await gerarPdf();
    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], `Contrato_${nome}.pdf`, { type: "application/pdf" });

    if (navigator.canShare?.({ files: [pdfFile] })) {
      try {
        await navigator.share({ files: [pdfFile], title: `Contrato - ${cliente.nome}` });
        return;
      } catch {
        // cancelado pelo usuário ou não suportado — segue fallback
      }
    }

    // Fallback: baixa o PDF e abre WhatsApp com aviso
    doc.save(`Contrato_${nome}.pdf`);
    const msgFallback = "Segue o contrato de prestação de serviços advocatícios (PDF baixado automaticamente).";
    const urlFallback = montarUrlWaMe(cliente.whatsapp, msgFallback);
    if (urlFallback) window.open(urlFallback, "_blank");
  }

  async function baixar() {
    const { doc, nome } = await gerarPdf();
    doc.save(`Contrato_${nome}.pdf`);
  }

  return (
    <>
      <Card style={{ maxWidth: 720 }}>
        {advogados.length >= 2 && (
          <FormField label="Signatários *" htmlFor="contrato-signatarios">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {advogados.map((a) => {
                const checked = advIds.includes(a.id);
                const disabled = advIds.length === 1 && checked;
                return (
                  <label
                    key={a.id}
                    style={{ display: "flex", alignItems: "center", gap: 8, cursor: disabled ? "not-allowed" : "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={(e) => toggleAdv(a.id, e.target.checked)}
                    />
                    {a.nome}{a.oab ? ` — OAB ${a.oab}` : ""}
                  </label>
                );
              })}
            </div>
          </FormField>
        )}

        <FormField label="Cliente *" htmlFor="contrato-cliente">
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
        </FormField>

        <FormField label="Objeto da prestação de serviço" htmlFor="contrato-objeto">
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
        </FormField>

        <FormField label="Valor dos honorários" htmlFor="contrato-valor">
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
        </FormField>
      </Card>

      <Card style={{ maxWidth: 720 }}>
        <FormField label="Texto do contrato (editável)" htmlFor="contrato-texto">
          <textarea
            id="contrato-texto"
            className="form-control"
            rows={18}
            style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 14, lineHeight: 1.6, resize: "vertical" }}
            value={texto}
            onChange={(e) => setEditado(e.target.value)}
          />
        </FormField>
        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <Button type="button" variant="success" onClick={enviarWhatsApp}>
            📲 Enviar por WhatsApp
          </Button>
          <Button type="button" variant="secondary" onClick={baixar}>
            ⬇ Baixar (.pdf)
          </Button>
        </div>
        {msg && <p className="error-msg" style={{ marginTop: 10 }}>{msg}</p>}
      </Card>
    </>
  );
}
