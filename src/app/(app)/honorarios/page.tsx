import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resolveBaseUrl } from "@/lib/utils/base-url";
import { parseAdv } from "@/lib/utils/adv-filter";
import { montarItens, resumoFinanceiro, type HonorarioFull } from "@/lib/domain/lembrete-itens";
import { AdvogadoFilter } from "@/components/AdvogadoFilter";
import { ResumoCard } from "@/components/ResumoCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusTabs } from "@/components/StatusTabs";
import { ParcelaCard } from "@/components/ParcelaCard";

export const metadata: Metadata = {
  title: "Honorários — Comarca Honorários",
};

const TABS = [
  { key: "todos", label: "Todos" },
  { key: "pendente", label: "Pendentes" },
  { key: "atrasado", label: "Atrasados" },
  { key: "pago", label: "Pagos" },
  { key: "ad_exitum", label: "Ad Exitum" },
];

export default async function HonorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; adv?: string; cliente?: string }>;
}) {
  const sp = await searchParams;
  const statusFiltro = sp.status || "todos";
  const advRaw = sp.adv || "";
  const advIds = parseAdv(advRaw);
  const clienteId = sp.cliente || "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let honQuery = supabase.from("honorarios").select(
    "id, tipo, cliente_id, membro_id, parceiro_id, parceiro_percentual, processo, area, tribunal, chave_pix, link_publico_token, clientes:cliente_id(nome, whatsapp), parcelas(id, numero, valor, vencimento, status_registrado, data_pagamento)",
  );
  if (advIds.length > 0) {
    const ids = advIds.join(",");
    honQuery = honQuery.or(`membro_id.in.(${ids}),parceiro_id.in.(${ids})`);
  }
  if (clienteId) {
    honQuery = honQuery.eq("cliente_id", clienteId);
  }

  const [{ data: honData }, { data: profile }, { data: advogados }] = await Promise.all([
    honQuery,
    user
      ? supabase.from("profiles").select("nome, chave_pix").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("advogados").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  const honorarios = (honData ?? []) as unknown as HonorarioFull[];
  const advogadoNome = profile?.nome ?? "Advogado";
  const url = await resolveBaseUrl();

  const advId = advIds.length === 1 ? advIds[0] : null;

  const todos = montarItens(honorarios, {
    baseUrl: url,
    pixPadrao: profile?.chave_pix ?? null,
    advogadoNome,
    advogadoOab: null,
    advId,
  });
  todos.sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  const { somaAberto, somaRecebido, clientesAtivos } = resumoFinanceiro(todos);

  const contagem: Record<string, number> = {
    todos: todos.length,
    pendente: 0,
    atrasado: 0,
    pago: 0,
    ad_exitum: 0,
  };
  for (const it of todos) {
    if (it.status === "atrasado") contagem.atrasado++;
    else if (it.status === "pendente" || it.status === "vencendo") contagem.pendente++;
    else if (it.status === "pago" || it.status === "pago_verificacao") contagem.pago++;
    if (it.tipo === "ad_exitum" || it.tipo === "fixo_exitum") contagem.ad_exitum++;
  }

  const lista = todos.filter((it) => {
    if (statusFiltro === "todos") return true;
    if (statusFiltro === "pago") return it.status === "pago" || it.status === "pago_verificacao";
    if (statusFiltro === "ad_exitum") return it.tipo === "ad_exitum" || it.tipo === "fixo_exitum";
    if (statusFiltro === "pendente") return it.status === "pendente" || it.status === "vencendo";
    return it.status === statusFiltro;
  });

  const qs = (s: string) => {
    const p = new URLSearchParams();
    if (s !== "todos") p.set("status", s);
    if (advRaw) p.set("adv", advRaw);
    if (clienteId) p.set("cliente", clienteId);
    const q = p.toString();
    return q ? `/honorarios?${q}` : "/honorarios";
  };

  const clienteNomeFiltro = clienteId
    ? honorarios.find((h) => h.cliente_id === clienteId)?.clientes?.nome ?? null
    : null;

  const selectedAdvNome =
    advIds.length === 1
      ? (advogados ?? []).find((a) => a.id === advIds[0])?.nome ?? advogadoNome
      : advogadoNome;

  return (
    <div>
      <PageHeader
        title="Honorários"
        action={
          <Link href="/honorarios/novo" className="btn btn-primary">
            + Novo honorário
          </Link>
        }
      />

      {clienteId && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: "var(--body)" }}>
            Filtrando por cliente: <strong>{clienteNomeFiltro ?? "—"}</strong>
          </span>
          <Link href="/honorarios" className="btn btn-secondary" style={{ fontSize: 14, padding: "4px 12px" }}>
            Limpar filtro
          </Link>
        </div>
      )}

      {honorarios.length > 0 && (
        <ResumoCard
          nome={selectedAdvNome}
          somaAberto={somaAberto}
          somaRecebido={somaRecebido}
          clientesAtivos={clientesAtivos}
        />
      )}

      <AdvogadoFilter advogados={advogados ?? []} selected={advIds} />

      <StatusTabs tabs={TABS} active={statusFiltro} counts={contagem} href={qs} />

      {lista.length === 0 ? (
        <EmptyState
          icon="📂"
          title="Nenhuma parcela nesta visão"
          description={
            honorarios.length === 0
              ? "Cadastre um honorário para gerar parcelas e cobrar."
              : "Ajuste o filtro acima."
          }
          action={
            honorarios.length === 0 ? (
              <Link href="/honorarios/novo" className="btn btn-primary">
                Cadastrar honorário
              </Link>
            ) : undefined
          }
        />
      ) : (
        lista.map((it) => <ParcelaCard key={it.parcelaId} item={it} />)
      )}


    </div>
  );
}
