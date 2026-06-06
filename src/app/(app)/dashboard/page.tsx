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
import { ParcelaActions } from "../honorarios/ParcelaActions";

export const metadata: Metadata = {
  title: "Painel — Comarca Honorários",
};

type StatusReg = "em_aberto" | "pago" | "pago_verificacao";

type HonorarioRow = {
  id: string;
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

const TABS: { key: string; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "pendente", label: "Pendentes" },
  { key: "vencendo", label: "Vencendo" },
  { key: "atrasado", label: "Atrasados" },
  { key: "pago", label: "Pagos" },
];

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
  searchParams: Promise<{ periodo?: string; status?: string; de?: string; ate?: string }>;
}) {
  const sp = await searchParams;
  const periodo = (sp.periodo as PeriodoTipo) || "este_mes";
  const statusFiltro = sp.status || "todos";
  const de = sp.de || "";
  const ate = sp.ate || "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: honData }, { data: profile }] = await Promise.all([
    supabase
      .from("honorarios")
      .select(
        "id, processo, area, tribunal, chave_pix, link_publico_token, clientes:cliente_id(nome, whatsapp), parcelas(id, numero, valor, vencimento, status_registrado, data_pagamento)",
      ),
    user
      ? supabase.from("profiles").select("nome, oab, chave_pix").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const honorarios = (honData ?? []) as unknown as HonorarioRow[];
  const advogadoNome = profile?.nome ?? "Advogado";
  const advogadoOab = profile?.oab ?? null;
  const pixPadrao = profile?.chave_pix ?? null;
  const url = await baseUrl();

  // Flatten honorário → parcelas, montando tudo p/ render + ações.
  type Item = {
    parcelaId: string;
    honorarioId: string;
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

  const itensTodos: Item[] = [];
  for (const h of honorarios) {
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
      itensTodos.push({
        parcelaId: p.id,
        honorarioId: h.id,
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

  // Filtro de período (afeta resumo + lista, como no protótipo).
  const noPeriodo = filtrarPorPeriodo(itensTodos, { tipo: periodo, de, ate });

  // Resumo (semântica do protótipo): confirmados = pago+verificação; urgentes = vencendo+atrasado.
  const resumo = { pendentes: 0, urgentes: 0, confirmados: 0, nPend: 0, nUrg: 0, nConf: 0 };
  const contagem: Record<string, number> = { todos: 0, pendente: 0, vencendo: 0, atrasado: 0, pago: 0 };
  for (const it of noPeriodo) {
    contagem.todos++;
    if (it.status === "pago" || it.status === "pago_verificacao") {
      resumo.confirmados += it.valor;
      resumo.nConf++;
      contagem.pago++;
    } else if (it.status === "vencendo" || it.status === "atrasado") {
      resumo.urgentes += it.valor;
      resumo.nUrg++;
      contagem[it.status]++;
    } else {
      resumo.pendentes += it.valor;
      resumo.nPend++;
      contagem.pendente++;
    }
  }

  // Filtro de status (aba). "pago" agrupa pago + pago_verificacao.
  const lista = ordenarPorVencimento(
    noPeriodo.filter((it) => {
      if (statusFiltro === "todos") return true;
      if (statusFiltro === "pago") return it.status === "pago" || it.status === "pago_verificacao";
      return it.status === statusFiltro;
    }),
  );

  const qs = (status: string) => {
    const p = new URLSearchParams();
    p.set("periodo", periodo);
    if (status !== "todos") p.set("status", status);
    if (periodo === "customizado") {
      if (de) p.set("de", de);
      if (ate) p.set("ate", ate);
    }
    return `/dashboard?${p.toString()}`;
  };

  return (
    <div>
      <div className="page-head">
        <h1>Painel</h1>
        <Link href="/honorarios/novo" className="btn btn-primary">
          + Novo honorário
        </Link>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon" style={{ background: "var(--primary-light)" }}>⏳</div>
          <div className="summary-info">
            <span className="val">{formatCurrency(resumo.pendentes)}</span>
            <span className="label">Pendentes</span>
            <span className="desc">{resumo.nPend} parcela(s) em aberto</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: "var(--warning-light)" }}>🔥</div>
          <div className="summary-info">
            <span className="val">{formatCurrency(resumo.urgentes)}</span>
            <span className="label">Urgentes</span>
            <span className="desc">{resumo.nUrg} vencendo / atrasada(s)</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: "var(--success-light)" }}>✅</div>
          <div className="summary-info">
            <span className="val">{formatCurrency(resumo.confirmados)}</span>
            <span className="label">Confirmados</span>
            <span className="desc">{resumo.nConf} parcela(s) paga(s)</span>
          </div>
        </div>
      </div>

      <DashboardFilters periodo={periodo} de={de} ate={ate} status={statusFiltro} />

      <div className="tabs-wrapper">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={qs(t.key)}
            className={`tab-btn${statusFiltro === t.key ? " active" : ""}`}
          >
            {t.label}
            <span className="tab-badge">{contagem[t.key] ?? 0}</span>
          </Link>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h3>Nenhuma parcela nesta visão</h3>
          <p style={{ margin: "8px 0 16px" }}>Ajuste o período/filtro ou cadastre um honorário.</p>
          <Link href="/honorarios/novo" className="btn btn-primary">Cadastrar honorário</Link>
        </div>
      ) : (
        lista.map((it) => (
          <div key={it.parcelaId} className={`card fee-card ${it.status}`}>
            <div className="fee-card-header">
              <div className="fee-card-title">
                <Link href={`/honorarios/${it.honorarioId}`}>{it.cliente}</Link>
                <span className={`badge badge-${it.status}`}>{statusLabel(it.status)}</span>
              </div>
            </div>
            <div className="fee-card-process">
              {it.processo || "Sem processo"}
              {it.area ? ` · ${it.area}${it.tribunal ? ` - ${it.tribunal}` : ""}` : ""}
            </div>
            <div className="fee-card-middle">
              <span className="fee-card-meta">
                Parcela {it.numero}/{it.total} · <strong>{formatCurrency(it.valor)}</strong> · vence {formatDate(it.vencimento)}
              </span>
            </div>
            <div className="fee-card-actions">
              <LembreteButton parcelaId={it.parcelaId} mensagem={it.mensagem} waUrl={it.waUrl} />
              <ParcelaActions
                parcelaId={it.parcelaId}
                honorarioId={it.honorarioId}
                status={it.statusReg}
                dataPagamento={it.dataPagamento}
              />
              <Link href={`/honorarios/${it.honorarioId}`} className="btn btn-secondary">
                Detalhes
              </Link>
            </div>
          </div>
        ))
      )}

      <Link href="/honorarios/novo" className="fab" title="Novo honorário">
        <span>＋ Novo honorário</span>
      </Link>
    </div>
  );
}
