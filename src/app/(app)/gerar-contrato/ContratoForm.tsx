"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { montarContrato } from "@/lib/domain/contrato";
import { montarUrlWaMe } from "@/lib/domain/lembrete";
import { formatCurrency } from "@/lib/utils/format";
import type { HonorarioTipo } from "@/lib/database.types";

interface AdvogadoOpt {
  id: string;
  nome: string;
  oab: string | null;
}

interface HonorarioOpt {
  id: string;
  processo: string | null;
  valor_total: number | null;
  area: string | null;
  tipo: string;
  clientes: {
    nome: string;
    cpf: string;
    endereco: string | null;
    email: string | null;
    whatsapp: string;
  } | null;
}

interface Props {
  advogados: AdvogadoOpt[];
  honorarios: HonorarioOpt[];
  perfilForo: string | null;
  perfilChavePix: string | null;
  perfilEndereco: string | null;
  escritorioNome: string | null;
  hoje: string;
}

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <div
      style={{
        color: "var(--link)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: 20,
        paddingBottom: 12,
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      Passo {n} — {title}
    </div>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <div
      style={{
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--body)",
        marginTop: 24,
        marginBottom: 12,
      }}
    >
      {title}
    </div>
  );
}

export function ContratoForm({
  advogados,
  honorarios,
  perfilForo,
  perfilChavePix,
  perfilEndereco,
  escritorioNome,
  hoje,
}: Props) {
  const [honorarioId, setHonorarioId] = useState("");
  const [tipoContrato, setTipoContrato] = useState<"civel" | "trabalhista">("civel");

  // Contratante
  const [contratanteNome, setContratanteNome] = useState("");
  const [contratanteCpf, setContratanteCpf] = useState("");
  const [contratanteEndereco, setContratanteEndereco] = useState("");
  const [contratanteTelefone, setContratanteTelefone] = useState("");
  const [contratanteEmail, setContratanteEmail] = useState("");
  const [clienteWhatsapp, setClienteWhatsapp] = useState("");

  // Advogados signatários
  const [advIds, setAdvIds] = useState<string[]>(() =>
    advogados[0] ? [advogados[0].id] : [],
  );

  // Objeto
  const [numeroProcesso, setNumeroProcesso] = useState("");
  const [descricaoDemanda, setDescricaoDemanda] = useState("");

  // Honorários
  const [tipoHonorario, setTipoHonorario] = useState<string>("fixo_parcelado");
  const [valorTotal, setValorTotal] = useState("R$ 0,00");
  const [formaPagamento, setFormaPagamento] = useState("À vista");
  const [chavePix, setChavePix] = useState(perfilChavePix ?? "");

  // Foro
  const [foro, setForo] = useState(perfilForo ?? "");

  // Preview
  const [editado, setEditado] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function reset() {
    setEditado(null);
  }

  function toggleAdv(id: string, checked: boolean) {
    setAdvIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      if (prev.length <= 1) return prev;
      return prev.filter((x) => x !== id);
    });
    reset();
  }

  function selecionarHonorario(id: string) {
    setHonorarioId(id);
    if (!id) { reset(); return; }
    const h = honorarios.find((x) => x.id === id);
    if (!h) { reset(); return; }
    const c = h.clientes;
    setContratanteNome(c?.nome ?? "");
    setContratanteCpf(c?.cpf ?? "");
    setContratanteEndereco(c?.endereco ?? "");
    setContratanteEmail(c?.email ?? "");
    setContratanteTelefone(c?.whatsapp ?? "");
    setClienteWhatsapp(c?.whatsapp ?? "");
    if (h.processo) setNumeroProcesso(h.processo);
    setTipoContrato(h.area === "Trabalhista" ? "trabalhista" : "civel");
    if (h.valor_total) setValorTotal(formatCurrency(h.valor_total));
    setTipoHonorario(h.tipo);
    reset();
  }

  const gerado = useMemo(() => {
    const signatarios = advogados
      .filter((a) => advIds.includes(a.id))
      .map((a) => ({ nome: a.nome, oab: a.oab }));
    const demandaTexto = [numeroProcesso, descricaoDemanda].filter(Boolean).join(" — ");
    return montarContrato({
      clienteNome: contratanteNome,
      clienteCpf: contratanteCpf,
      clienteEndereco: contratanteEndereco,
      signatarios,
      tipoContrato,
      descricaoDemanda: demandaTexto || null,
      valor: valorTotal,
      formaPagamento,
      chavePix,
      foro,
      enderecoEscritorio: perfilEndereco,
      dataHoje: hoje,
    });
  }, [
    advogados, advIds, contratanteNome, contratanteCpf, contratanteEndereco,
    tipoContrato, numeroProcesso, descricaoDemanda, valorTotal, formaPagamento, chavePix,
    foro, perfilEndereco, hoje,
  ]);

  const texto = editado ?? gerado;

  async function gerarPdf() {
    const { jsPDF } = await import("jspdf");
    const nome = (contratanteNome || "contrato").replace(/\s+/g, "_");
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
    const whatsapp = clienteWhatsapp || contratanteTelefone;
    if (!whatsapp) {
      setMsg("Preencha o telefone/WhatsApp do contratante para enviar.");
      return;
    }
    const whatsappUrl = montarUrlWaMe(whatsapp, "");
    if (!whatsappUrl) {
      setMsg("Número de WhatsApp inválido.");
      return;
    }
    const { doc, nome } = await gerarPdf();
    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], `Contrato_${nome}.pdf`, { type: "application/pdf" });

    if (navigator.canShare?.({ files: [pdfFile] })) {
      try {
        await navigator.share({ files: [pdfFile], title: `Contrato — ${contratanteNome}` });
        return;
      } catch {
        // cancelado ou não suportado — fallback abaixo
      }
    }
    doc.save(`Contrato_${nome}.pdf`);
    const msgFallback = "Segue o contrato de prestação de serviços advocatícios (PDF baixado automaticamente).";
    const urlFallback = montarUrlWaMe(whatsapp, msgFallback);
    if (urlFallback) window.open(urlFallback, "_blank");
  }

  async function baixar() {
    const { doc, nome } = await gerarPdf();
    doc.save(`Contrato_${nome}.pdf`);
  }

  const tiposHonorario: { value: HonorarioTipo; label: string }[] = [
    { value: "fixo_parcelado", label: "Valor fixo (à vista ou parcelado)" },
    { value: "recorrente", label: "Recorrente" },
    { value: "ad_exitum", label: "Ad êxitum (êxito)" },
    { value: "fixo_exitum", label: "Fixo + êxito" },
  ];

  return (
    <>
      {/* PASSO 1 */}
      <Card style={{ maxWidth: 760 }}>
        <StepLabel n={1} title="Seleção do Processo/Cliente" />
        <FormField label="Selecionar processo/honorário" htmlFor="contrato-honorario">
          <select
            id="contrato-honorario"
            className="form-control"
            value={honorarioId}
            onChange={(e) => selecionarHonorario(e.target.value)}
          >
            <option value="">-- Selecione o Processo/Lançamento --</option>
            {honorarios.map((h) => {
              const nome = h.clientes?.nome ?? "Cliente desconhecido";
              const proc = h.processo ? ` — ${h.processo}` : "";
              return (
                <option key={h.id} value={h.id}>
                  {nome}{proc}
                </option>
              );
            })}
          </select>
        </FormField>
      </Card>

      {/* PASSO 2 */}
      <Card style={{ maxWidth: 760 }}>
        <StepLabel n={2} title="Tipo de Contrato" />
        <div className="radio-group" style={{ flexDirection: "row", gap: 16, marginBottom: 0 }}>
          {(
            [
              { value: "civel", label: "Cível", desc: "Ramo civil, família, comercial, etc." },
              {
                value: "trabalhista",
                label: "Trabalhista",
                desc: "Inclui cláusula de mandato ad judicia no corpo",
              },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className={`radio-option ${tipoContrato === opt.value ? "selected" : ""}`}
              style={{ flex: 1, alignItems: "flex-start", gap: 12 }}
            >
              <input
                type="radio"
                name="tipo-contrato"
                value={opt.value}
                checked={tipoContrato === opt.value}
                onChange={() => { setTipoContrato(opt.value); reset(); }}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: "var(--body)", marginTop: 2 }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* PASSO 3 */}
      <Card style={{ maxWidth: 760 }}>
        <StepLabel n={3} title="Dados Complementares" />

        <SectionLabel title="Contratante" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <FormField label="Nome completo ou Razão Social *" htmlFor="c-nome">
            <input
              id="c-nome"
              className="form-control"
              value={contratanteNome}
              onChange={(e) => { setContratanteNome(e.target.value); reset(); }}
              placeholder="Nome completo ou Razão Social"
            />
          </FormField>
          <FormField label="CPF ou CNPJ *" htmlFor="c-cpf">
            <input
              id="c-cpf"
              className="form-control"
              value={contratanteCpf}
              onChange={(e) => { setContratanteCpf(e.target.value); reset(); }}
              placeholder="000.000.000-00"
            />
          </FormField>
        </div>
        <FormField label="Endereço completo" htmlFor="c-end">
          <input
            id="c-end"
            className="form-control"
            value={contratanteEndereco}
            onChange={(e) => { setContratanteEndereco(e.target.value); reset(); }}
            placeholder="Rua, nº, Bairro, Cidade/UF"
          />
        </FormField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <FormField label="Telefone" htmlFor="c-tel">
            <input
              id="c-tel"
              className="form-control"
              value={contratanteTelefone}
              onChange={(e) => { setContratanteTelefone(e.target.value); reset(); }}
              placeholder="(00) 00000-0000"
            />
          </FormField>
          <FormField label="E-mail" htmlFor="c-email">
            <input
              id="c-email"
              className="form-control"
              value={contratanteEmail}
              onChange={(e) => { setContratanteEmail(e.target.value); reset(); }}
              placeholder="email@exemplo.com"
            />
          </FormField>
        </div>

        <SectionLabel title="Contratados (Advogados Signatários)" />
        <p style={{ fontSize: 13, color: "var(--body)", marginBottom: 12, marginTop: -8 }}>
          Selecione quais advogados do escritório assinarão o presente contrato:
        </p>
        {advogados.map((a) => {
          const checked = advIds.includes(a.id);
          const disabled = advIds.length === 1 && checked;
          return (
            <label
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
                cursor: disabled ? "not-allowed" : "pointer",
                fontSize: 14,
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => toggleAdv(a.id, e.target.checked)}
              />
              <span>
                <strong>{a.nome}</strong>
                {a.oab ? ` — ${a.oab}` : ""}
              </span>
            </label>
          );
        })}

        <SectionLabel title="Objeto" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <FormField label="Número do Processo" htmlFor="c-proc">
            <input
              id="c-proc"
              className="form-control"
              value={numeroProcesso}
              onChange={(e) => { setNumeroProcesso(e.target.value); reset(); }}
              placeholder="0000000-00.0000.0.00.0000"
            />
          </FormField>
          <FormField label="Descrição da Demanda" htmlFor="c-desc">
            <input
              id="c-desc"
              className="form-control"
              value={descricaoDemanda}
              onChange={(e) => { setDescricaoDemanda(e.target.value); reset(); }}
              placeholder="Ex: Defesa Trabalhista contra Manserv"
            />
          </FormField>
        </div>

        <SectionLabel title="Honorários" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <FormField label="Tipo de Honorário *" htmlFor="c-tipo">
            <select
              id="c-tipo"
              className="form-control"
              value={tipoHonorario}
              onChange={(e) => { setTipoHonorario(e.target.value); reset(); }}
            >
              {tiposHonorario.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Valor Total (R$)" htmlFor="c-valor">
            <input
              id="c-valor"
              className="form-control"
              value={valorTotal}
              onChange={(e) => { setValorTotal(e.target.value); reset(); }}
              placeholder="R$ 0,00"
            />
          </FormField>
        </div>
        <FormField label="Forma de Pagamento" htmlFor="c-forma">
          <select
            id="c-forma"
            className="form-control"
            value={formaPagamento}
            onChange={(e) => { setFormaPagamento(e.target.value); reset(); }}
            style={{ maxWidth: 300 }}
          >
            <option>À vista</option>
            <option>Parcelado</option>
          </select>
        </FormField>
        <FormField label="Chave PIX do Escritório" htmlFor="c-pix">
          <input
            id="c-pix"
            className="form-control"
            value={chavePix}
            onChange={(e) => { setChavePix(e.target.value); reset(); }}
            placeholder="CPF, CNPJ, e-mail ou chave aleatória"
            style={{ maxWidth: 400 }}
          />
        </FormField>

        <SectionLabel title="Foro" />
        <FormField label="Comarca do foro" htmlFor="c-foro">
          <input
            id="c-foro"
            className="form-control"
            value={foro}
            onChange={(e) => { setForo(e.target.value); reset(); }}
            placeholder="Ex: Pelotas – Rio Grande do Sul"
            style={{ maxWidth: 400 }}
          />
        </FormField>
      </Card>

      {/* PASSO 4 */}
      <Card style={{ maxWidth: 760 }}>
        <StepLabel n={4} title="Preview do Contrato" />
        <FormField label="Texto do Contrato (Editável)" htmlFor="contrato-texto">
          <textarea
            id="contrato-texto"
            className="form-control"
            rows={22}
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 13,
              lineHeight: 1.6,
              resize: "vertical",
            }}
            value={texto}
            onChange={(e) => setEditado(e.target.value)}
          />
        </FormField>
        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <Button type="button" variant="success" onClick={enviarWhatsApp}>
            Enviar por WhatsApp
          </Button>
          <Button type="button" variant="secondary" onClick={baixar}>
            Baixar PDF (em breve)
          </Button>
        </div>
        {msg && (
          <p className="error-msg" style={{ marginTop: 10 }}>
            {msg}
          </p>
        )}
      </Card>
    </>
  );
}
