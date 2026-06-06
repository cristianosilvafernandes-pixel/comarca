/**
 * Relatório de IR: categorização fiscal, agregação por ano e exportação CSV.
 * Spec F10 · INV-111..116 · T-504/T-506. Funções puras e testáveis.
 */

import { formatDate } from "@/lib/utils/format";
import type { HonorarioTipo, OrigemPagamento } from "@/lib/database.types";

export type CategoriaIR = "Contratual" | "Êxito" | "Sucumbencial" | "Recorrente";

/** Ordem fixa de exibição dos 4 grupos (spec F10). */
export const CATEGORIAS_IR: CategoriaIR[] = ["Contratual", "Êxito", "Sucumbencial", "Recorrente"];

export interface ParcelaIR {
  clienteNome: string;
  clienteCpf: string;
  tipo: HonorarioTipo;
  numero: number;
  origem: OrigemPagamento | null;
  docPagador?: string | null;
  valor: number;
  dataPagamento?: string | null; // YYYY-MM-DD
  vencimento: string; // YYYY-MM-DD
}

export interface LinhaIR {
  cliente: string;
  doc: string;
  categoria: CategoriaIR;
  origem: OrigemPagamento;
  valor: number;
  data: string; // YYYY-MM-DD
}

export interface GrupoIR {
  categoria: CategoriaIR;
  linhas: LinhaIR[];
  total: number;
}

export interface RelatorioIR {
  ano: number;
  grupos: GrupoIR[]; // sempre 4, na ordem de CATEGORIAS_IR
  totalGeral: number;
  totalPorOrigem: { contratual: number; sucumbencial: number };
}

/**
 * Categoria fiscal derivada do tipo + número da parcela (spec F10, INV-113):
 *   fixo_parcelado → Contratual · ad_exitum → Êxito · recorrente → Recorrente
 *   fixo_exitum    → parcela 1 = Contratual; demais = Êxito
 */
export function categoriaFiscal(tipo: HonorarioTipo, numeroParcela: number): CategoriaIR {
  switch (tipo) {
    case "fixo_parcelado":
      return "Contratual";
    case "ad_exitum":
      return "Êxito";
    case "recorrente":
      return "Recorrente";
    case "fixo_exitum":
      return numeroParcela === 1 ? "Contratual" : "Êxito";
  }
}

/** Origem efetiva (null → contratual). */
function origemEfetiva(origem: OrigemPagamento | null): OrigemPagamento {
  return origem === "sucumbencial" ? "sucumbencial" : "contratual";
}

/** Grupo de exibição: sucumbencial vai sempre p/ "Sucumbencial"; senão, a categoria fiscal. */
export function grupoExibicao(p: Pick<ParcelaIR, "tipo" | "numero" | "origem">): CategoriaIR {
  if (origemEfetiva(p.origem) === "sucumbencial") return "Sucumbencial";
  return categoriaFiscal(p.tipo, p.numero);
}

/** Ano de apuração: ano de data_pagamento (fallback vencimento). */
export function anoApuracao(p: ParcelaIR): number {
  const ref = p.dataPagamento ?? p.vencimento;
  return Number(ref.slice(0, 4));
}

/**
 * Agrega parcelas PAGAS no ano em 4 grupos + totais.
 * O chamador passa apenas parcelas com status_registrado = 'pago'.
 */
export function agregarRelatorioIR(parcelas: ParcelaIR[], ano: number): RelatorioIR {
  const doAno = parcelas.filter((p) => anoApuracao(p) === ano);

  const grupos: GrupoIR[] = CATEGORIAS_IR.map((categoria) => ({ categoria, linhas: [], total: 0 }));
  const byCategoria = new Map(grupos.map((g) => [g.categoria, g]));

  let totalGeral = 0;
  const totalPorOrigem = { contratual: 0, sucumbencial: 0 };

  for (const p of doAno) {
    const origem = origemEfetiva(p.origem);
    const categoria = grupoExibicao(p);
    const doc = origem === "sucumbencial" ? (p.docPagador?.trim() || "—") : p.clienteCpf;

    const linha: LinhaIR = {
      cliente: p.clienteNome,
      doc,
      categoria,
      origem,
      valor: p.valor,
      data: p.dataPagamento ?? p.vencimento,
    };

    const grupo = byCategoria.get(categoria)!;
    grupo.linhas.push(linha);
    grupo.total += p.valor;
    totalGeral += p.valor;
    totalPorOrigem[origem] += p.valor;
  }

  return { ano, grupos, totalGeral, totalPorOrigem };
}

/** Número com vírgula decimal, sem separador de milhar: 1200.5 → "1200,50". */
function valorCSV(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}

/** Nome do arquivo CSV (spec F10). */
export function nomeArquivoCSV(ano: number): string {
  return `Apuracao_IR_Comarca_${ano}.csv`;
}

/**
 * Gera o CSV pt-BR (spec F10 / INV-116):
 * separador `;`, BOM UTF-8, vírgula decimal.
 * Colunas: Cliente;CPF/CNPJ;Tipo de Honorario;Origem;Valor Recebido;Data Recebimento
 */
export function gerarCSV(relatorio: RelatorioIR): string {
  const BOM = "﻿";
  const header = ["Cliente", "CPF/CNPJ", "Tipo de Honorario", "Origem", "Valor Recebido", "Data Recebimento"];
  const linhas = relatorio.grupos.flatMap((g) => g.linhas);

  const escape = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

  const rows = linhas.map((l) =>
    [
      escape(l.cliente),
      escape(l.doc),
      l.categoria,
      l.origem === "sucumbencial" ? "Sucumbencial" : "Contratual",
      valorCSV(l.valor),
      formatDate(l.data),
    ].join(";"),
  );

  return BOM + [header.join(";"), ...rows].join("\r\n") + "\r\n";
}
