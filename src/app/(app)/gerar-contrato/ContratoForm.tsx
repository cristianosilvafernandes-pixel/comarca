"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { montarContrato } from "@/lib/domain/contrato";
import { montarUrlWaMe } from "@/lib/domain/lembrete";
import { formatCurrency } from "@/lib/utils/format";
import type { HonorarioTipo } from "@/lib/database.types";

interface ClienteOpt {
  id: string;
  nome: string;
  cpf: string | null;
  endereco: string | null;
  whatsapp: string;
}

interface AdvogadoOpt {
  id: string;
  nome: string;
  oab: string | null;
}

interface HonorarioOpt {
  id: string;
  processo: string | null;
  area: string | null;
  parte_contraria: string | null;
  tipo: HonorarioTipo;
  frequencia: string | null;
  valor_total: number | null;
  valor_mensal: number | null;
  valor_entrada: number | null;
  valor_causa: number | null;
  percentual_exito: number | null;
  chave_pix: string | null;
  clientes: {
    id: string;
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
  logoUrl: string | null;
  hoje: string;
}

const TIPO_LABEL: Record<HonorarioTipo, string> = {
  fixo_parcelado: "Valor fixo (à vista ou parcelado)",
  recorrente: "Recorrente",
  ad_exitum: "Ad êxitum (êxito)",
  fixo_exitum: "Fixo + êxito",
};

/** Resumo do valor do honorário conforme o tipo. */
function valorDetalhado(h: HonorarioOpt): string {
  switch (h.tipo) {
    case "recorrente":
      return `${formatCurrency(h.valor_mensal ?? 0)} / mês`;
    case "ad_exitum":
      return `${h.percentual_exito ?? 0}% de êxito${h.valor_causa ? ` sobre ${formatCurrency(h.valor_causa)}` : ""}`;
    case "fixo_exitum":
      return `${formatCurrency(h.valor_entrada ?? 0)} + ${h.percentual_exito ?? 0}% de êxito`;
    default:
      return formatCurrency(h.valor_total ?? 0);
  }
}

/** Rótulo curto da causa/honorário para a lista do Passo 1. */
function rotuloHonorario(h: HonorarioOpt): string {
  const partes = [h.area, h.parte_contraria].filter(Boolean).join(" — ");
  return partes || h.processo || "Honorário";
}

/** O honorário tem valor suficiente para gerar o contrato? */
function valorPreenchido(h: HonorarioOpt): boolean {
  switch (h.tipo) {
    case "recorrente":
      return (h.valor_mensal ?? 0) > 0;
    case "ad_exitum":
      return (h.valor_causa ?? 0) > 0 && (h.percentual_exito ?? 0) > 0;
    case "fixo_exitum":
      return (h.valor_entrada ?? 0) > 0 || ((h.valor_causa ?? 0) > 0 && (h.percentual_exito ?? 0) > 0);
    default:
      return (h.valor_total ?? 0) > 0;
  }
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

function SectionHeader({
  title,
  editHref,
  editLabel,
}: {
  title: string;
  editHref?: string;
  editLabel?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 12,
        marginTop: 24,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--body)",
        }}
      >
        {title}
      </div>
      {editHref && (
        <a
          href={editHref}
          style={{ fontSize: 12, color: "var(--link)", textDecoration: "none", whiteSpace: "nowrap" }}
        >
          {editLabel ?? "editar cadastro"} ↗
        </a>
      )}
    </div>
  );
}

/** Campo somente-leitura: valor vindo do cadastro, não editável aqui. */
function LockedField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <FormField label={label}>
      <div
        className="form-control"
        style={{
          background: "var(--canvas-soft)",
          color: value ? "var(--ink)" : "var(--mute)",
          display: "flex",
          alignItems: "center",
          cursor: "default",
        }}
      >
        {value || "—"}
      </div>
    </FormField>
  );
}

export function ContratoForm({
  advogados,
  honorarios,
  perfilForo,
  perfilChavePix,
  perfilEndereco,
  escritorioNome,
  logoUrl,
  hoje,
}: Props) {
  const [clienteId, setClienteId] = useState("");
  const [honorarioId, setHonorarioId] = useState("");
  const [tipoContrato, setTipoContrato] = useState<"civel" | "trabalhista">("civel");

  // Campos editáveis (sem fonte no cadastro)
  const [descricaoDemanda, setDescricaoDemanda] = useState("");
  const [foro, setForo] = useState(perfilForo ?? "");
  const [advIds, setAdvIds] = useState<string[]>(() => (advogados[0] ? [advogados[0].id] : []));

  // Preview
  const [editado, setEditado] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [incluirLogo, setIncluirLogo] = useState(!!logoUrl);

  function reset() {
    setEditado(null);
  }

  // Clientes distintos (nível 1) e honorários do cliente (nível 2)
  const clientes = useMemo(() => {
    const map = new Map<string, { id: string; nome: string }>();
    for (const h of honorarios) {
      if (h.clientes) map.set(h.clientes.id, { id: h.clientes.id, nome: h.clientes.nome });
    }
    return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [honorarios]);

  const honorariosDoCliente = useMemo(
    () => honorarios.filter((h) => h.clientes?.id === clienteId),
    [honorarios, clienteId],
  );

  const hon = honorarioId ? honorarios.find((h) => h.id === honorarioId) ?? null : null;
  const cliente = hon?.clientes ?? null;
  const nomeCliente = cliente?.nome ?? "";
  const chavePix = hon?.chave_pix || perfilChavePix || "";
  const formaPagamento = hon?.frequencia === "Única" ? "À vista" : "Parcelado";

  function selecionarCliente(id: string) {
    setClienteId(id);
    setHonorarioId("");
    setDescricaoDemanda("");
    reset();
  }

  function selecionarHonorario(id: string) {
    setHonorarioId(id);
    const h = honorarios.find((x) => x.id === id);
    if (!h) {
      reset();
      return;
    }
    setTipoContrato(h.area === "Trabalhista" ? "trabalhista" : "civel");
    setDescricaoDemanda([h.area, h.parte_contraria].filter(Boolean).join(" — "));
    reset();
  }

  function toggleAdv(id: string, checked: boolean) {
    setAdvIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      if (prev.length <= 1) return prev;
      return prev.filter((x) => x !== id);
    });
    reset();
  }

  // Validação — campos obrigatórios para GERAR o contrato
  const faltaCliente = !!hon && (!cliente?.nome || !cliente?.cpf || !cliente?.endereco);
  const faltaHonorario = !!hon && !valorPreenchido(hon);
  const problemas: string[] = [];
  if (hon) {
    if (!cliente?.nome) problemas.push("nome do cliente");
    if (!cliente?.cpf) problemas.push("CPF/CNPJ do cliente");
    if (!cliente?.endereco) problemas.push("endereço do cliente");
    if (!valorPreenchido(hon)) problemas.push("valor do honorário");
  }
  const podeGerar = !!hon && problemas.length === 0;

  const gerado = useMemo(() => {
    const signatarios = advogados
      .filter((a) => advIds.includes(a.id))
      .map((a) => ({ nome: a.nome, oab: a.oab }));
    const demandaTexto = [hon?.processo, descricaoDemanda].filter(Boolean).join(" — ");
    return montarContrato({
      clienteNome: cliente?.nome ?? "",
      clienteCpf: cliente?.cpf ?? "",
      clienteEndereco: cliente?.endereco ?? "",
      signatarios,
      tipoContrato,
      descricaoDemanda: demandaTexto || null,
      valor: hon?.valor_total != null ? formatCurrency(hon.valor_total) : null,
      formaPagamento,
      chavePix,
      foro,
      enderecoEscritorio: perfilEndereco,
      dataHoje: hoje,
      tipoHonorario: hon?.tipo ?? null,
      valorMensal: hon?.valor_mensal ?? null,
      valorEntrada: hon?.valor_entrada ?? null,
      valorCausa: hon?.valor_causa ?? null,
      percentualExito: hon?.percentual_exito ?? null,
    });
  }, [
    advogados, advIds, hon, cliente, tipoContrato, descricaoDemanda,
    formaPagamento, chavePix, foro, perfilEndereco, hoje,
  ]);

  const texto = editado ?? gerado;

  async function gerarPdf() {
    const [{ jsPDF }, { arialRegularBase64, arialBoldBase64 }, { computeLogoDims, loadLogoPng }] =
      await Promise.all([
        import("jspdf"),
        import("@/lib/fonts/arial"),
        import("@/lib/pdf/logo"),
      ]);

    const nome = (nomeCliente || "contrato").replace(/\s+/g, "_");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    doc.addFileToVFS("Arial.ttf", arialRegularBase64);
    doc.addFont("Arial.ttf", "Arial", "normal");
    doc.addFileToVFS("Arial-Bold.ttf", arialBoldBase64);
    doc.addFont("Arial-Bold.ttf", "Arial", "bold");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const usableWidth = pageWidth - margin * 2;
    const lineH = 5;
    const LOGO_MAX_H = 18; // mm

    let logo: { dataUrl: string; width: number; height: number } | null = null;
    if (incluirLogo && logoUrl) {
      logo = await loadLogoPng(logoUrl);
    }

    function drawHeader(): number {
      let hy = margin;
      if (logo) {
        const { w, h } = computeLogoDims(logo.width, logo.height, usableWidth, LOGO_MAX_H);
        doc.addImage(logo.dataUrl, "PNG", (pageWidth - w) / 2, hy, w, h);
        hy += h + 6;
      }
      if (escritorioNome) {
        doc.setFont("Arial", "bold");
        doc.setFontSize(13);
        doc.text(escritorioNome, pageWidth / 2, hy, { align: "center" });
        hy += 8;
      }
      if (logo || escritorioNome) {
        doc.setDrawColor(180, 180, 180);
        doc.line(margin, hy, pageWidth - margin, hy);
        hy += 8;
      }
      return hy;
    }

    let y = drawHeader();
    doc.setFont("Arial", "normal");
    doc.setFontSize(10);

    for (const line of doc.splitTextToSize(texto, usableWidth)) {
      if (y + lineH > pageHeight - margin) {
        doc.addPage();
        y = drawHeader();
        doc.setFont("Arial", "normal");
        doc.setFontSize(10);
      }
      doc.text(line as string, margin, y);
      y += lineH;
    }

    return { doc, nome };
  }

  async function enviarWhatsApp() {
    const whatsapp = cliente?.whatsapp ?? "";
    if (!whatsapp) {
      setMsg("Este cliente não tem WhatsApp no cadastro. Adicione no cadastro do cliente para enviar.");
      return;
    }
    const whatsappUrl = montarUrlWaMe(whatsapp, "");
    if (!whatsappUrl) {
      setMsg("Número de WhatsApp inválido.");
      return;
    }
    setMsg(null);
    const { doc, nome } = await gerarPdf();
    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], `Contrato_${nome}.pdf`, { type: "application/pdf" });

    if (navigator.canShare?.({ files: [pdfFile] })) {
      try {
        await navigator.share({ files: [pdfFile], title: `Contrato — ${nomeCliente}` });
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

  return (
    <>
      {/* PASSO 1 */}
      <Card style={{ maxWidth: 760 }}>
        <StepLabel n={1} title="Seleção do Cliente e Processo" />
        <FormField label="Cliente *" htmlFor="contrato-cliente">
          <select
            id="contrato-cliente"
            className="form-control"
            value={clienteId}
            onChange={(e) => selecionarCliente(e.target.value)}
          >
            <option value="">-- Selecione o cliente --</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </FormField>

        {clienteId && (
          <>
            <p style={{ fontSize: 13, color: "var(--body)", margin: "8px 0 12px" }}>
              Honorários deste cliente — cada um gera um contrato:
            </p>
            {honorariosDoCliente.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--mute)" }}>
                Nenhum honorário cadastrado para este cliente.
              </p>
            ) : (
              honorariosDoCliente.map((h) => (
                <label
                  key={h.id}
                  className={`radio-option ${honorarioId === h.id ? "selected" : ""}`}
                  style={{ cursor: "pointer", marginBottom: 8, alignItems: "flex-start", gap: 12 }}
                >
                  <input
                    type="radio"
                    name="contrato-honorario"
                    value={h.id}
                    checked={honorarioId === h.id}
                    onChange={() => selecionarHonorario(h.id)}
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  <span>
                    <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>
                      {rotuloHonorario(h)}
                    </span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--mute)", marginTop: 2 }}>
                      {TIPO_LABEL[h.tipo]} · {valorDetalhado(h)}
                      {h.processo ? ` · ${h.processo}` : ""}
                    </span>
                  </span>
                </label>
              ))
            )}
          </>
        )}
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
                onChange={() => {
                  setTipoContrato(opt.value);
                  reset();
                }}
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

        {!hon ? (
          <p style={{ fontSize: 14, color: "var(--mute)" }}>
            Selecione o cliente e o honorário no Passo 1 para carregar os dados.
          </p>
        ) : (
          <>
            <SectionHeader
              title="Contratante"
              editHref={cliente ? `/clientes/${cliente.id}/editar` : undefined}
            />
            <p style={{ fontSize: 12, color: "var(--mute)", marginTop: -8, marginBottom: 12 }}>
              Dados do cadastro do cliente — somente leitura.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <LockedField label="Nome completo ou Razão Social" value={cliente?.nome} />
              <LockedField label="CPF ou CNPJ" value={cliente?.cpf} />
            </div>
            <LockedField label="Endereço completo" value={cliente?.endereco} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <LockedField label="Telefone / WhatsApp" value={cliente?.whatsapp} />
              <LockedField label="E-mail" value={cliente?.email} />
            </div>

            <SectionHeader
              title="Honorários"
              editHref={`/honorarios/${hon.id}/editar`}
              editLabel="editar honorário"
            />
            <p style={{ fontSize: 12, color: "var(--mute)", marginTop: -8, marginBottom: 12 }}>
              Dados do cadastro do honorário — somente leitura.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <LockedField label="Tipo de Honorário" value={TIPO_LABEL[hon.tipo]} />
              <LockedField label="Valor" value={valorDetalhado(hon)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {hon.tipo === "fixo_parcelado" && (
                <LockedField label="Forma de Pagamento" value={formaPagamento} />
              )}
              <LockedField label="Chave PIX" value={chavePix} />
            </div>

            <SectionHeader title="Objeto" />
            <LockedField label="Número do Processo" value={hon.processo} />
            <FormField label="Descrição da Demanda" htmlFor="c-desc">
              <input
                id="c-desc"
                className="form-control"
                value={descricaoDemanda}
                onChange={(e) => {
                  setDescricaoDemanda(e.target.value);
                  reset();
                }}
                placeholder="Ex: Defesa Trabalhista contra Manserv"
              />
            </FormField>

            <SectionHeader title="Foro" />
            <FormField label="Comarca do foro" htmlFor="c-foro">
              <input
                id="c-foro"
                className="form-control"
                value={foro}
                onChange={(e) => {
                  setForo(e.target.value);
                  reset();
                }}
                placeholder="Ex: Pelotas – Rio Grande do Sul"
                style={{ maxWidth: 400 }}
              />
            </FormField>

            <SectionHeader title="Contratados (Advogados Signatários)" />
            <p style={{ fontSize: 13, color: "var(--body)", marginTop: -8, marginBottom: 12 }}>
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
          </>
        )}
      </Card>

      {/* PASSO 4 */}
      <Card style={{ maxWidth: 760 }}>
        <StepLabel n={4} title="Preview do Contrato" />

        {hon && !podeGerar && (
          <div
            style={{
              background: "var(--canvas-soft)",
              border: "1px solid var(--hairline)",
              borderLeft: "3px solid var(--error)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 16px",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
              Não é possível gerar o contrato.
            </div>
            <div style={{ fontSize: 13, color: "var(--body)", marginBottom: 10 }}>
              Falta no cadastro: {problemas.join(", ")}. Complete o cadastro antes de continuar.
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {faltaCliente && cliente && (
                <a href={`/clientes/${cliente.id}/editar`} style={{ fontSize: 13, color: "var(--link)" }}>
                  Completar cadastro do cliente ↗
                </a>
              )}
              {faltaHonorario && (
                <a href={`/honorarios/${hon.id}/editar`} style={{ fontSize: 13, color: "var(--link)" }}>
                  Completar cadastro do honorário ↗
                </a>
              )}
            </div>
          </div>
        )}

        {logoUrl && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={incluirLogo}
              onChange={(e) => setIncluirLogo(e.target.checked)}
            />
            <span>Incluir logo do escritório no contrato</span>
          </label>
        )}
        <FormField label="Texto do Contrato (Editável)" htmlFor="contrato-texto">
          <textarea
            id="contrato-texto"
            className="form-control"
            rows={22}
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 13,
              lineHeight: 1.6,
              resize: "vertical",
            }}
            value={texto}
            onChange={(e) => setEditado(e.target.value)}
          />
        </FormField>
        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <Button type="button" variant="success" onClick={enviarWhatsApp} disabled={!podeGerar}>
            Enviar por WhatsApp
          </Button>
          <Button type="button" variant="secondary" onClick={baixar} disabled={!podeGerar}>
            Baixar PDF
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
