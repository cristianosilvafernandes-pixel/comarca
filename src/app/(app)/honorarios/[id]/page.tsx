import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { resolveStatus, statusLabel } from "@/lib/utils/status";
import { montarMensagemLembrete, montarUrlWaMe } from "@/lib/domain/lembrete";
import { ParcelaActions } from "../ParcelaActions";
import { LembreteButton } from "../LembreteButton";

export const metadata: Metadata = {
  title: "Honorário — Comarca Honorários",
};

const TIPO_LABEL: Record<string, string> = {
  fixo_parcelado: "Fixo parcelado",
  recorrente: "Recorrente",
  ad_exitum: "Ad êxitum",
  fixo_exitum: "Fixo + êxito",
};

export default async function HonorarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: hon }, { data: userData }] = await Promise.all([
    supabase
      .from("honorarios")
      .select(
        "id, tipo, processo, area, tribunal, parte_contraria, valor_total, valor_mensal, valor_causa, percentual_exito, valor_entrada, chave_pix, link_publico_token, clientes:cliente_id(nome, whatsapp), parcelas(id, numero, valor, vencimento, status_registrado, data_pagamento)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!hon) notFound();

  const clienteObj = hon.clientes as { nome: string; whatsapp: string } | null;
  const cliente = clienteObj?.nome ?? "—";
  const parcelas = [...(hon.parcelas ?? [])].sort((a, b) => a.numero - b.numero);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const linkPublico = `${siteUrl}/h/${hon.link_publico_token}`;

  // Dados do advogado p/ a assinatura do lembrete (spec F6).
  let advogadoNome = "Advogado";
  let advogadoOab: string | null = null;
  if (userData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome, oab")
      .eq("id", userData.user.id)
      .maybeSingle();
    advogadoNome = profile?.nome ?? advogadoNome;
    advogadoOab = profile?.oab ?? null;
  }

  const totalParcelas = parcelas.length;
  function lembreteDe(p: (typeof parcelas)[number]): { mensagem: string; waUrl: string | null } {
    const mensagem = montarMensagemLembrete({
      clienteNome: cliente,
      processo: hon!.processo,
      area: hon!.area,
      tribunal: hon!.tribunal,
      numero: p.numero,
      totalParcelas,
      valor: p.valor,
      vencimento: p.vencimento,
      chavePix: hon!.chave_pix ?? "",
      linkPublico,
      advogadoNome,
      advogadoOab,
    });
    const waUrl = clienteObj?.whatsapp ? montarUrlWaMe(clienteObj.whatsapp, mensagem) : null;
    return { mensagem, waUrl };
  }

  return (
    <div>
      <div className="page-head">
        <h1>{cliente}</h1>
        <Link href="/honorarios" className="btn btn-secondary">
          ← Voltar
        </Link>
      </div>

      <div className="card">
        <div className="fee-card-title">{TIPO_LABEL[hon.tipo] ?? hon.tipo}</div>
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
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Link público de pagamento</h3>
        <code style={{ fontSize: 12, wordBreak: "break-all" }}>{linkPublico}</code>
      </div>

      <h3 style={{ margin: "8px 0 12px" }}>Parcelas ({parcelas.length})</h3>
      {parcelas.length === 0 ? (
        <div className="empty-state">
          <p>Este tipo não gera parcelas por data — a cobrança de êxito é lançada manualmente.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
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
                      <span className={`badge badge-${st}`}>{statusLabel(st)}</span>
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
                            return <LembreteButton parcelaId={p.id} mensagem={l.mensagem} waUrl={l.waUrl} />;
                          })()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
