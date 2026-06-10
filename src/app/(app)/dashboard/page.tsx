import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { resolveStatus, statusLabel, type StatusEfetivo } from "@/lib/utils/status";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { filtrarPorPeriodo, ordenarPorVencimento, type PeriodoTipo } from "@/lib/domain/dashboard";
import { montarMensagemLembrete, montarUrlWaMe, montarLinkPublico } from "@/lib/domain/lembrete";
import { DashboardFilters } from "./DashboardFilters";
import { LembreteButton } from "../honorarios/LembreteButton";

export const metadata: Metadata = {
  title: "Painel — Comarca Honorários",
};

type StatusReg = "em_aberto" | "pago" | "pago_verificacao";

type HonorarioRow = {
  id: string;
  tipo: string;
  cliente_id: string;
  processo: string | null;
  area: string | null;
  tribunal: string | null;
  chave_pix: string | null;
  link_publico_token: string;
  clientes: { nome: string; whatsapp: string } | null;
  parcelas: {
    id: string;
    numero: number;
    valor: number;
    vencimento: string;
    status_registrado: StatusReg;
    data_pagamento: string | null;
  }[];
};

type Item = {
  parcelaId: string;
  honorarioId: string;
  tipo: string;
  cliente: string;
  processo: string | null;
  area: string | null;
  tribunal: string | null;
  numero: number;
  total: number;
  valor: number;
  vencimento: string;
  statusReg: StatusReg;
  dataPagamento: string | null;
  status: StatusEfetivo;
  mensagem: string;
  waUrl: string | null;
};

const TABS: { key: string; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "pendente", label: "Pendentes" },
  { key: "atrasado", label: "Atrasados" },
  { key: "pago", label: "Pagos" },
  { key: "ad_exitum", label: "Ad Exitum" },
];

function initials(nome: string): string {
  const parts = nome
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 1 && !/^(de|da|do|dos|das|e|dr|dra)\.?$/i.test(p));
  if (parts.length === 0) return nome.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function baseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; status?: string; de?: string; ate?: string; adv?: string }>;
}) {
  const sp = await searchParams;
  const periodo = (sp.periodo as PeriodoTipo) || "este_mes";
  const statusFiltro = sp.status || "todos";
  const de = sp.de || "";
  const ate = sp.ate || "";
  const advId = sp.adv || "todos";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let honQuery = supabase
    .from("honorarios")
    .select(
      "id, tipo, cliente_id, processo, area, tribunal, chave_pix, link_publico_token, clientes:cliente_id(nome, whatsapp), parcelas(id, numero, valor, vencimento, status_registrado, data_pagamento)",
    );
  if (advId !== "todos") {
    honQuery = honQuery.eq("membro_id", advId);
  }

  const [{ data: honData }, { data: profile }, { data: advogados }] = await Promise.all([
    honQuery,
    user
      ? supabase.from("profiles").select("nome, oab, chave_pix").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("advogados").select("id, nome").order("nome"),
  ]);

  const honorarios = (honData ?? []) as unknown as HonorarioRow[];
  const advogadoNome = profile?.nome ?? "Advogado";
  const advogadoOab = profile?.oab ?? null;
  const pixPadrao = profile?.chave_pix ?? null;
  const url = await baseUrl();

  // Flatten honorários → parcelas; compute RESUMO POR ADVOGADO totals (pre-period)
  const clienteIds = new Set<string>();
  let somaAberto = 0;
  let somaRecebido = 0;
  const itensTodos: Item[] = [];

  for (const h of honorarios) {
    clienteIds.add(h.cliente_id);
    const total = h.parcelas.length;
    for (const p of h.parcelas) {
      const status = resolveStatus(p.status_registrado, p.vencimento);
      const chavePix = h.chave_pix ?? pixPadrao ?? "(defina sua chave PIX no perfil)";
      const linkPublico = montarLinkPublico(url, h.link_publico_token);
      const mensagem = montarMensagemLembrete({
        clienteNome: h.clientes?.nome ?? "Cliente",
        processo: h.processo,
        area: h.area,
        tribunal: h.tribunal,
        numero: p.numero,
        totalParcelas: total,
        valor: p.valor,
        vencimento: p.vencimento,
        chavePix,
        linkPublico,
        advogadoNome,
        advogadoOab,
      });
      const waUrl = h.clientes?.whatsapp ? montarUrlWaMe(h.clientes.whatsapp, mensagem) : null;

      if (p.status_registrado === "em_aberto") somaAberto += p.valor;
      else somaRecebido += p.valor;

      itensTodos.push({
        parcelaId: p.id,
        honorarioId: h.id,
        tipo: h.tipo,
        cliente: h.clientes?.nome ?? "Cliente",
        processo: h.processo,
        area: h.area,
        tribunal: h.tribunal,
        numero: p.numero,
        total,
        valor: p.valor,
        vencimento: p.vencimento,
        statusReg: p.status_registrado,
        dataPagamento: p.data_pagamento,
        status,
        mensagem,
        waUrl,
      });
    }
  }

  // Period filter
  const noPeriodo = filtrarPorPeriodo(itensTodos, { tipo: periodo, de, ate });

  // Summary cards + tab counts (period-filtered)
  const resumo = { pendentes: 0, atrasados: 0, confirmados: 0, nPend: 0, nAtr: 0, nConf: 0 };
  const contagem: Record<string, number> = { todos: 0, pendente: 0, atrasado: 0, pago: 0, ad_exitum: 0 };

  for (const it of noPeriodo) {
    contagem.todos++;
    if (it.status === "pago" || it.status === "pago_verificacao") {
      resumo.confirmados += it.valor;
      resumo.nConf++;
      contagem.pago++;
    } else if (it.status === "atrasado") {
      resumo.atrasados += it.valor;
      resumo.nAtr++;
      contagem.atrasado++;
    } else {
      resumo.pendentes += it.valor;
      resumo.nPend++;
      contagem.pendente++;
    }
    if (it.tipo === "ad_exitum" || it.tipo === "fixo_exitum") contagem.ad_exitum++;
  }

  // Status filter for list
  const lista = ordenarPorVencimento(
    noPeriodo.filter((it) => {
      if (statusFiltro === "todos") return true;
      if (statusFiltro === "pago") return it.status === "pago" || it.status === "pago_verificacao";
      if (statusFiltro === "ad_exitum") return it.tipo === "ad_exitum" || it.tipo === "fixo_exitum";
      if (statusFiltro === "pendente") return it.status === "pendente" || it.status === "vencendo";
      return it.status === statusFiltro;
    }),
  );

  const qs = (s: string) => {
    const p = new URLSearchParams();
    p.set("periodo", periodo);
    if (s !== "todos") p.set("status", s);
    if (advId !== "todos") p.set("adv", advId);
    if (periodo === "customizado") {
      if (de) p.set("de", de);
      if (ate) p.set("ate", ate);
    }
    return `/dashboard?${p.toString()}`;
  };

  const selectedAdvNome =
    advId !== "todos"
      ? (advogados ?? []).find((a) => a.id === advId)?.nome ?? advogadoNome
      : advogadoNome;
  const advInitials = initials(selectedAdvNome);

  return (
    <div>
      <div className="page-head">
        <h1>Painel</h1>
        <Link href="/honorarios/novo" className="btn btn-primary">
          + Novo honorário
        </Link>
      </div>

      {/* Summary cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="sum-icon-circle"></div>
          <div className="summary-info">
            <span className="val">{formatCurrency(resumo.pendentes)}</span>
            <span className="label">Pendentes</span>
            <span className="desc">{resumo.nPend} lembretes pendentes</span>
          </div>
        </div>
        <div className="summary-card summary-card-danger">
          <div className="sum-icon-circle sum-icon-danger"></div>
          <div className="summary-info">
            <span className="val">{formatCurrency(resumo.atrasados)}</span>
            <span className="label">Atrasados</span>
            <span className="desc">{resumo.nAtr} honorários atrasados</span>
          </div>
        </div>
        <div className="summary-card summary-card-success">
          <div className="sum-icon-circle sum-icon-success">✓</div>
          <div className="summary-info">
            <span className="val">{formatCurrency(resumo.confirmados)}</span>
            <span className="label">Confirmados</span>
            <span className="desc">{resumo.nConf} confirmados</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <DashboardFilters
        periodo={periodo}
        de={de}
        ate={ate}
        status={statusFiltro}
        adv={advId}
        advogados={advogados ?? []}
      />

      {/* Resumo por advogado */}
      {honorarios.length > 0 && (
        <>
          <p className="details-section-title" style={{ marginTop: 0 }}>
            Resumo por advogado
          </p>
          <div className="adv-cards-row">
            <div className="adv-card">
              <div className="adv-initials">{advInitials}</div>
              <div className="adv-info">
                <span className="adv-nome">{selectedAdvNome}</span>
                <span className="adv-stat">
                  Pendente:{" "}
                  <strong style={{ color: "var(--ink)" }}>{formatCurrency(somaAberto)}</strong>
                </span>
                <span className="adv-stat">
                  Recebido:{" "}
                  <strong
                    style={{ color: somaRecebido > 0 ? "var(--success)" : "var(--body)" }}
                  >
                    {formatCurrency(somaRecebido)}
                  </strong>
                </span>
                <span className="adv-stat">
                  Clientes Ativos: <strong>{clienteIds.size}</strong>
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tabs */}
      <div className="tabs-wrapper">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={qs(t.key)}
            className={`tab-btn${statusFiltro === t.key ? " active" : ""}`}
          >
            {t.label}
            <span
              className={`tab-badge${t.key === "atrasado" && contagem.atrasado > 0 ? " tab-badge-warn" : ""}`}
            >
              {contagem[t.key] ?? 0}
            </span>
          </Link>
        ))}
      </div>

      {/* Parcela list */}
      {lista.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h3>Nenhuma parcela nesta visão</h3>
          <p style={{ margin: "8px 0 16px" }}>Ajuste o período/filtro ou cadastre um honorário.</p>
          <Link href="/honorarios/novo" className="btn btn-primary">
            Cadastrar honorário
          </Link>
        </div>
      ) : (
        lista.map((it) => {
          const processoLine = it.processo
            ? `Processo: ${it.processo}${it.area ? ` (${it.area}${it.tribunal ? ` · ${it.tribunal}` : ""})` : ""}`
            : it.area
              ? `${it.area}${it.tribunal ? ` · ${it.tribunal}` : ""}`
              : null;

          return (
            <div key={it.parcelaId} className={`card fee-card ${it.status}`}>
              <div className="fee-card-header">
                <div className="fee-card-title">{it.cliente}</div>
                <span className={`badge badge-${it.status}`}>{statusLabel(it.status)}</span>
              </div>
              {processoLine && <div className="fee-card-process">{processoLine}</div>}
              <div className="fee-card-middle">
                <span className="fee-card-meta">
                  Parcela {it.numero}/{it.total} ·{" "}
                  <strong>{formatCurrency(it.valor)}</strong>
                </span>
                <span className="fee-card-date">
                  🗓 Vence em {formatDate(it.vencimento)}
                </span>
              </div>
              <div className="fee-card-actions">
                <LembreteButton
                  parcelaId={it.parcelaId}
                  mensagem={it.mensagem}
                  waUrl={it.waUrl}
                  label="Enviar lembrete"
                />
                <Link href={`/honorarios/${it.honorarioId}`} className="btn btn-secondary">
                  Ver detalhes
                </Link>
              </div>
            </div>
          );
        })
      )}

      <Link href="/honorarios/novo" className="fab" title="Novo honorário">
        <span>＋ Novo honorário</span>
      </Link>
    </div>
  );
}
