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
  advogadoNome: string;
  advogadoOab: string | null;
  foro: string | null;
  hoje: string;
  escritorioNome?: string | null;
}

export function ContratoForm({ clientes, advogados = [], advogadoNome, advogadoOab, foro, hoje, escritorioNome }: Props) {
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
        {advogados.length > 1 && (
          <FormField label="Advogado *" htmlFor="contrato-advogado">
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
