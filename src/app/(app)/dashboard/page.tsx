import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format";
import { resolveBaseUrl } from "@/lib/utils/base-url";
import { parseAdv } from "@/lib/utils/adv-filter";
import { filtrarPorPeriodo, ordenarPorVencimento, type PeriodoTipo } from "@/lib/domain/dashboard";
import { montarItens, resumoFinanceiro, type HonorarioFull } from "@/lib/domain/lembrete-itens";
import { ResumoCard } from "@/components/ResumoCard";
import { SummaryCard } from "@/components/SummaryCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusTabs } from "@/components/StatusTabs";
import { ParcelaCard } from "@/components/ParcelaCard";
import { DashboardFilters } from "./DashboardFilters";

export const metadata: Metadata = {
  title: "Painel — Comarca Honorários",
};

const TABS: { key: string; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "pendente", label: "Pendentes" },
  { key: "atrasado", label: "Atrasados" },
  { key: "pago", label: "Pagos" },
  { key: "ad_exitum", label: "Ad Exitum" },
];

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
  const advRaw = sp.adv || "";
  const advIds = parseAdv(advRaw);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let honQuery = supabase
    .from("honorarios")
    .select(
      "id, tipo, cliente_id, processo, area, tribunal, chave_pix, link_publico_token, clientes:cliente_id(nome, whatsapp), parcelas(id, numero, valor, vencimento, status_registrado, data_pagamento)",
    );
  if (advIds.length > 0) {
    honQuery = honQuery.in("membro_id", advIds);
  }

  const [{ data: honData }, { data: profile }, { data: advogados }] = await Promise.all([
    honQuery,
    user
      ? supabase.from("profiles").select("nome, chave_pix").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("advogados").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  const honorarios = (honData ?? []) as unknown as HonorarioFull[];
  const advogadoNome = profile?.nome ?? "Escritório";
  const url = await resolveBaseUrl();

  const itensTodos = montarItens(honorarios, {
    baseUrl: url,
    pixPadrao: profile?.chave_pix ?? null,
    advogadoNome,
    advogadoOab: null,
  });

  // Period filter
  const noPeriodo = filtrarPorPeriodo(itensTodos, { tipo: periodo, de, ate });

  // Resumo financeiro (período) — mesma regra da lista de honorários.
  const { somaAberto, somaRecebido, clientesAtivos } = resumoFinanceiro(noPeriodo);

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
    if (advRaw) p.set("adv", advRaw);
    if (periodo === "customizado") {
      if (de) p.set("de", de);
      if (ate) p.set("ate", ate);
    }
    return `/dashboard?${p.toString()}`;
  };

  const selectedAdvNome =
    advIds.length === 1
      ? (advogados ?? []).find((a) => a.id === advIds[0])?.nome ?? advogadoNome
      : advogadoNome;

  return (
    <div>
      <PageHeader
        title="Painel"
        action={
          <Link href="/honorarios/novo" className="btn btn-primary">
            + Novo honorário
          </Link>
        }
      />

      {/* Summary cards (clicáveis → filtram a lista) */}
      <div className="summary-grid">
        <SummaryCard
          value={formatCurrency(resumo.pendentes)}
          label="Pendentes"
          desc={`${resumo.nPend} lembretes pendentes`}
          href={qs("pendente")}
          active={statusFiltro === "pendente"}
        />
        <SummaryCard
          value={formatCurrency(resumo.atrasados)}
          label="Atrasados"
          desc={`${resumo.nAtr} honorários atrasados`}
          variant="danger"
          href={qs("atrasado")}
          active={statusFiltro === "atrasado"}
        />
        <SummaryCard
          value={formatCurrency(resumo.confirmados)}
          label="Pagos"
          desc={`${resumo.nConf} pagos`}
          variant="success"
          href={qs("pago")}
          active={statusFiltro === "pago"}
        />
      </div>

      {/* Filters */}
      <DashboardFilters
        periodo={periodo}
        de={de}
        ate={ate}
        status={statusFiltro}
        advRaw={advRaw}
        advIds={advIds}
        advogados={advogados ?? []}
      />

      {/* Resumo por advogado */}
      {honorarios.length > 0 && (
        <ResumoCard
          nome={selectedAdvNome}
          somaAberto={somaAberto}
          somaRecebido={somaRecebido}
          clientesAtivos={clientesAtivos}
        />
      )}

      {/* Tabs */}
      <StatusTabs tabs={TABS} active={statusFiltro} counts={contagem} href={qs} />

      {/* Parcela list */}
      {lista.length === 0 ? (
        <EmptyState
          icon="📂"
          title="Nenhuma parcela nesta visão"
          description="Ajuste o período/filtro ou cadastre um honorário."
          action={
            <Link href="/honorarios/novo" className="btn btn-primary">
              Cadastrar honorário
            </Link>
          }
        />
      ) : (
        lista.map((it) => <ParcelaCard key={it.parcelaId} item={it} />)
      )}

    </div>
  );
}
