import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { resolveStatus } from "@/lib/utils/status";
import { montarLinkPublico } from "@/lib/domain/lembrete";
import { lembreteDeParcela } from "@/lib/domain/lembrete-itens";
import { resolveBaseUrl } from "@/lib/utils/base-url";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { tipoLabel } from "@/lib/domain/honorario-constants";
import { ParcelaActions } from "../ParcelaActions";
import { LembreteButton } from "../LembreteButton";
import { DeleteHonorarioButton } from "./DeleteHonorarioButton";
import { SucumbenciaisSection } from "./SucumbenciaisSection";
import type { SucumbencialRow } from "./SucumbenciaisSection";

export const metadata: Metadata = {
  title: "Honorário — Comarca Honorários",
};

export default async function HonorarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: hon }, { data: userData }, { data: sucumbenciaisRaw }, { data: advogados }] =
    await Promise.all([
      supabase
        .from("honorarios")
        .select(
          "id, tipo, processo, area, tribunal, parte_contraria, valor_total, valor_mensal, valor_causa, percentual_exito, valor_entrada, chave_pix, link_publico_token, parceiro_percentual, parceiro:parceiro_id(nome), clientes:cliente_id(nome, whatsapp), parcelas(id, numero, valor, vencimento, status_registrado, data_pagamento)",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.auth.getUser(),
      supabase
        .from("sucumbenciais")
        .select("id, valor, doc_adversario, status, data_recebimento, divisao_parceiro_pct, divisao_parceiro_id")
        .eq("honorario_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("advogados").select("id, nome").order("nome"),
    ]);

  if (!hon) notFound();

  const clienteObj = hon.clientes as { nome: string; whatsapp: string } | null;
  const cliente = clienteObj?.nome ?? "—";
  const parceiroNome = (hon.parceiro as { nome: string } | null)?.nome ?? null;
  const parcelas = [...(hon.parcelas ?? [])].sort((a, b) => a.numero - b.numero);
  const baseUrl = await resolveBaseUrl();
  const linkPublico = montarLinkPublico(baseUrl, hon.link_publico_token);

  // Dados do advogado p/ a assinatura do lembrete + fallback de PIX (spec F6).
  // OAB vive em `advogados` (por membro), não em `profiles` — fica null aqui,
  // consistente com a lista e o dashboard.
  let advogadoNome = "Advogado";
  const advogadoOab: string | null = null;
  let pixPadrao: string | null = null;
  if (userData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome, chave_pix")
      .eq("id", userData.user.id)
      .maybeSingle();
    advogadoNome = profile?.nome ?? advogadoNome;
    pixPadrao = profile?.chave_pix ?? null;
  }

  const advogadosMap = Object.fromEntries((advogados ?? []).map((a) => [a.id, a.nome]));
  const sucumbenciais: SucumbencialRow[] = (sucumbenciaisRaw ?? []).map((s) => ({
    id: s.id,
    valor: s.valor,
    doc_adversario: s.doc_adversario,
    status: s.status as SucumbencialRow["status"],
    data_recebimento: s.data_recebimento ?? null,
    divisao_parceiro_pct: s.divisao_parceiro_pct ?? null,
    parceiro:
      s.divisao_parceiro_id && advogadosMap[s.divisao_parceiro_id]
        ? { nome: advogadosMap[s.divisao_parceiro_id] }
        : null,
  }));

  const totalParcelas = parcelas.length;
  const honBase = {
    processo: hon.processo,
    area: hon.area,
    tribunal: hon.tribunal,
    chave_pix: hon.chave_pix,
    link_publico_token: hon.link_publico_token,
    clientes: clienteObj,
  };
  function lembreteDe(p: (typeof parcelas)[number]): { mensagem: string; waUrl: string | null } {
    return lembreteDeParcela(honBase, p, totalParcelas, {
      baseUrl,
      pixPadrao,
      advogadoNome,
      advogadoOab,
    });
  }

  return (
    <div>
      <PageHeader
        title={cliente}
        action={
          <Link href="/honorarios" className="btn btn-secondary">
            ← Voltar
          </Link>
        }
      />

      <Card>
        <div className="fee-card-title">{tipoLabel(hon.tipo)}</div>
        <div className="fee-card-process">
          {[hon.processo, hon.area, hon.tribunal].filter(Boolean).join(" · ") || "Sem processo"}
        </div>
        <div className="client-details-grid" style={{ display: "grid", gap: 4 }}>
          {hon.valor_total != null && <div>Valor total: {formatCurrency(hon.valor_total)}</div>}
          {hon.valor_mensal != null && <div>Valor mensal: {formatCurrency(hon.valor_mensal)}</div>}
          {hon.valor_entrada != null && <div>Entrada: {formatCurrency(hon.valor_entrada)}</div>}
          {hon.valor_causa != null && <div>Valor da causa: {formatCurrency(hon.valor_causa)}</div>}
          {hon.percentual_exito != null && <div>% êxito: {hon.percentual_exito}%</div>}
          {hon.parte_contraria && <div>Parte contrária: {hon.parte_contraria}</div>}
          {hon.chave_pix && <div>PIX: {hon.chave_pix}</div>}
          {parceiroNome && (
            <div>
              Divisão: Titular {100 - (hon.parceiro_percentual ?? 0)}% ·{" "}
              {parceiroNome} {hon.parceiro_percentual ?? 0}%
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h3 style={{ marginBottom: 8 }}>Link público de pagamento</h3>
        <code style={{ fontSize: 12, wordBreak: "break-all" }}>{linkPublico}</code>
      </Card>

      <h3 style={{ margin: "8px 0 12px" }}>Parcelas ({parcelas.length})</h3>
      {parcelas.length === 0 ? (
        <EmptyState description="Este tipo não gera parcelas por data — a cobrança de êxito é lançada manualmente." />
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table className="parcelas-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {parcelas.map((p) => {
                const st = resolveStatus(p.status_registrado, p.vencimento);
                return (
                  <tr key={p.id}>
                    <td>{p.numero}</td>
                    <td>{formatCurrency(p.valor)}</td>
                    <td>{formatDate(p.vencimento)}</td>
                    <td>
                      <Badge status={st} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <ParcelaActions
                          parcelaId={p.id}
                          honorarioId={hon.id}
                          status={p.status_registrado}
                          dataPagamento={p.data_pagamento}
                        />
                        {p.status_registrado !== "pago" &&
                          (() => {
                            const l = lembreteDe(p);
                            return <LembreteButton parcelaId={p.id} clienteNome={clienteObj?.nome ?? "Cliente"} mensagem={l.mensagem} waUrl={l.waUrl} />;
                          })()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <SucumbenciaisSection
        honorarioId={hon.id}
        sucumbenciais={sucumbenciais}
        advogados={advogados ?? []}
      />

      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <a href={`/honorarios/${hon.id}/editar`} className="btn btn-secondary">
          ✏️ Editar
        </a>
        <DeleteHonorarioButton id={hon.id} />
      </div>
    </div>
  );
}
