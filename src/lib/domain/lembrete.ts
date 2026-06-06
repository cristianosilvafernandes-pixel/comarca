/**
 * Montagem da mensagem de lembrete WhatsApp (spec F6, INV-072/073, T-401).
 * Função pura — espelha o template do protótipo (linhas 2343–2359).
 */

import { formatCurrency, formatDate } from "@/lib/utils/format";
import { whatsappForWaMe } from "@/lib/utils/phone";

export interface LembreteInput {
  clienteNome: string;
  processo?: string | null;
  area?: string | null;
  tribunal?: string | null;
  numero: number;
  totalParcelas: number;
  valor: number;
  vencimento: string; // YYYY-MM-DD
  chavePix: string;
  /** Código de barras do boleto (opcional, INV-073). */
  boleto?: string | null;
  /** URL pública completa de pagamento (/h/:token). */
  linkPublico: string;
  advogadoNome: string;
  advogadoOab?: string | null;
}

/** Monta a mensagem pré-formatada e editável do lembrete. */
export function montarMensagemLembrete(i: LembreteInput): string {
  const boletoLine = i.boleto && i.boleto.trim() ? `💳 Boleto: ${i.boleto.trim()}\n` : "";
  const areaLinha = i.area ? `(${i.area} - ${i.tribunal ?? ""})` : "";
  const assinatura = i.advogadoOab ? `${i.advogadoNome} - ${i.advogadoOab}` : i.advogadoNome;

  return `Olá ${i.clienteNome}!
🔔 Lembrete amigável de honorário advocatício.

Processo: ${i.processo || "Não informado"}
${areaLinha}
Parcela ${i.numero}/${i.totalParcelas}

Valor: ${formatCurrency(i.valor)}
Vence: ${formatDate(i.vencimento)}
${boletoLine}Chave PIX para pagamento: ${i.chavePix}

Link para confirmar o pagamento direto:
${i.linkPublico}

Quando efetuar o pagamento, confirme no link acima ou envie o comprovante por aqui.

${assinatura}`;
}

/** Monta a URL pública /h/:token a partir da base e do token. */
export function montarLinkPublico(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/h/${token}`;
}

/** Monta a URL wa.me com a mensagem (DDI 55). Retorna null se telefone inválido. */
export function montarUrlWaMe(whatsapp: string, mensagem: string): string | null {
  const num = whatsappForWaMe(whatsapp);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(mensagem)}`;
}
