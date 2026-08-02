/**
 * Camada única de montagem de parcelas → itens de UI + lembrete.
 *
 * Antes, dashboard, lista de honorários e detalhe remontavam a mensagem do
 * lembrete cada um do seu jeito — já tinham divergido (OAB ausente no
 * dashboard, PIX sem fallback no detalhe, base URL inconsistente). Aqui é a
 * fonte única: mesma assinatura, mesmo fallback de PIX, mesma base URL.
 */

import { montarMensagemLembrete, montarUrlWaMe, montarLinkPublico } from "./lembrete";
import { resolveStatus, type StatusEfetivo } from "@/lib/utils/status";

export type StatusReg = "em_aberto" | "pago" | "pago_verificacao";

export interface LembreteCtx {
  baseUrl: string;
  pixPadrao: string | null;
  advogadoNome: string;
  advogadoOab: string | null;
  /** ID do advogado filtrado — ativa cálculo de proporção por divisão. */
  advId?: string | null;
}

interface HonBase {
  processo: string | null;
  area: string | null;
  tribunal: string | null;
  chave_pix: string | null;
  link_publico_token: string;
  clientes: { nome: string; whatsapp: string | null } | null;
}

interface ParcelaBase {
  numero: number;
  valor: number;
  vencimento: string;
}

/** Monta {mensagem, waUrl} de uma parcela com fallback de PIX para o perfil. */
export function lembreteDeParcela(
  hon: HonBase,
  p: ParcelaBase,
  totalParcelas: number,
  ctx: LembreteCtx,
): { mensagem: string; waUrl: string | null } {
  const chavePix = hon.chave_pix ?? ctx.pixPadrao ?? "(defina sua chave PIX no perfil)";
  const linkPublico = montarLinkPublico(ctx.baseUrl, hon.link_publico_token);
  const mensagem = montarMensagemLembrete({
    clienteNome: hon.clientes?.nome ?? "Cliente",
    processo: hon.processo,
    area: hon.area,
    tribunal: hon.tribunal,
    numero: p.numero,
    totalParcelas,
    valor: p.valor,
    vencimento: p.vencimento,
    chavePix,
    linkPublico,
    advogadoNome: ctx.advogadoNome,
    advogadoOab: ctx.advogadoOab,
  });
  const waUrl = hon.clientes?.whatsapp ? montarUrlWaMe(hon.clientes.whatsapp, mensagem) : null;
  return { mensagem, waUrl };
}

export interface HonorarioFull extends HonBase {
  id: string;
  tipo: string;
  cliente_id: string;
  membro_id: string | null;
  parceiro_id: string | null;
  parceiro_percentual: number | null;
  parcelas: (ParcelaBase & {
    id: string;
    status_registrado: StatusReg;
    data_pagamento: string | null;
  })[];
}

/** Fração do valor que pertence ao advogado filtrado. 1 = valor cheio. */
function proporcaoAdv(h: HonorarioFull, advId: string | null): number {
  if (!advId || !h.parceiro_id || h.parceiro_percentual == null) return 1;
  if (h.parceiro_id === advId) return h.parceiro_percentual / 100;
  if (h.membro_id === advId) return (100 - h.parceiro_percentual) / 100;
  return 1;
}

export interface FeeItem {
  parcelaId: string;
  honorarioId: string;
  clienteId: string;
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
}

/** Achata honorários → itens de parcela com lembrete + status efetivo. */
export function montarItens(honorarios: HonorarioFull[], ctx: LembreteCtx): FeeItem[] {
  const advId = ctx.advId ?? null;
  const itens: FeeItem[] = [];
  for (const h of honorarios) {
    const frac = proporcaoAdv(h, advId);
    const total = h.parcelas.length;
    for (const p of h.parcelas) {
      const { mensagem, waUrl } = lembreteDeParcela(h, p, total, ctx);
      itens.push({
        parcelaId: p.id,
        honorarioId: h.id,
        clienteId: h.cliente_id,
        tipo: h.tipo,
        cliente: h.clientes?.nome ?? "Cliente",
        processo: h.processo,
        area: h.area,
        tribunal: h.tribunal,
        numero: p.numero,
        total,
        valor: p.valor * frac,
        vencimento: p.vencimento,
        statusReg: p.status_registrado,
        dataPagamento: p.data_pagamento,
        status: resolveStatus(p.status_registrado, p.vencimento),
        mensagem,
        waUrl,
      });
    }
  }
  return itens;
}

/**
 * Resumo financeiro com semântica única (status efetivo):
 * pago/pago_verificacao → recebido; o resto → em aberto.
 * Mesma regra em todas as telas — antes a lista usava status_registrado e o
 * dashboard usava status efetivo, gerando números diferentes sob o mesmo rótulo.
 */
export function resumoFinanceiro(itens: FeeItem[]): {
  somaAberto: number;
  somaRecebido: number;
  clientesAtivos: number;
} {
  let somaAberto = 0;
  let somaRecebido = 0;
  const clientes = new Set<string>();
  for (const it of itens) {
    clientes.add(it.clienteId);
    if (it.status === "pago" || it.status === "pago_verificacao") {
      somaRecebido += it.valor;
    } else {
      somaAberto += it.valor;
    }
  }
  return { somaAberto, somaRecebido, clientesAtivos: clientes.size };
}
