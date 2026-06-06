/**
 * Geração de parcelas por tipo de honorário (spec §3 F3/F4, INV-033..038).
 * Funções puras e testáveis — independentes de backend.
 */

import { addDays, addMonths, todayISO, monthsBetween } from "./dates";
import type { Frequencia, StatusRegistrado } from "@/lib/database.types";

export interface ParcelaGerada {
  numero: number;
  valor: number;
  vencimento: string; // YYYY-MM-DD
  status_registrado: StatusRegistrado;
  data_pagamento?: string | null;
}

/** Divide um total em N parcelas iguais (centavos), ajustando o resto na última. */
export function dividirValor(valorTotal: number, n: number): number[] {
  const totalCents = Math.round(valorTotal * 100);
  const baseCents = Math.floor(totalCents / n);
  const valores: number[] = [];
  for (let i = 0; i < n; i++) {
    const cents = i === n - 1 ? totalCents - baseCents * (n - 1) : baseCents;
    valores.push(cents / 100);
  }
  return valores;
}

export interface FixoParceladoInput {
  valorTotal: number;
  numParcelas: number; // 1..12
  frequencia: Frequencia;
  dataPrimeira: string; // YYYY-MM-DD
  /** Em pagamento à vista (1x), marca a parcela como já paga hoje (INV-035). */
  jaPagoHoje?: boolean;
  hoje?: string;
}

/** Tipo `fixo_parcelado`: N parcelas conforme a frequência (INV-033/034/035). */
export function gerarParcelasFixoParcelado(input: FixoParceladoInput): ParcelaGerada[] {
  const { valorTotal, frequencia, dataPrimeira, jaPagoHoje } = input;
  const n = frequencia === "Única" ? 1 : Math.max(1, Math.min(12, input.numParcelas));
  const valores = dividirValor(valorTotal, n);

  return valores.map((valor, i) => {
    let vencimento = dataPrimeira;
    if (i > 0) {
      vencimento = frequencia === "Quinzenal" ? addDays(dataPrimeira, 15 * i) : addMonths(dataPrimeira, i);
    }
    const aVista = n === 1 && jaPagoHoje;
    return {
      numero: i + 1,
      valor,
      vencimento,
      status_registrado: aVista ? "pago" : "em_aberto",
      data_pagamento: aVista ? (input.hoje ?? todayISO()) : null,
    };
  });
}

export interface RecorrenteInput {
  valorMensal: number;
  dataInicio: string;
  dataFim?: string | null;
  hoje?: string;
  /** Quantos meses à frente gerar quando não há data fim (default 1). */
  mesesAdiante?: number;
}

/** Tipo `recorrente`: parcelas mensais entre início e fim (ou em aberto). */
export function gerarParcelasRecorrente(input: RecorrenteInput): ParcelaGerada[] {
  const { valorMensal, dataInicio, dataFim } = input;
  const hoje = input.hoje ?? todayISO();
  const mesesAdiante = input.mesesAdiante ?? 1;

  let ate: string;
  if (dataFim) {
    ate = dataFim;
  } else {
    const ancora = monthsBetween(dataInicio, hoje) > 0 ? hoje : dataInicio;
    ate = addMonths(ancora, mesesAdiante);
  }

  const totalMeses = Math.max(0, monthsBetween(dataInicio, ate));
  const parcelas: ParcelaGerada[] = [];
  for (let i = 0; i <= totalMeses; i++) {
    parcelas.push({
      numero: i + 1,
      valor: valorMensal,
      vencimento: addMonths(dataInicio, i),
      status_registrado: "em_aberto",
      data_pagamento: null,
    });
  }
  return parcelas;
}

/**
 * Tipo `ad_exitum`: NÃO gera parcelas por data — a cobrança de êxito é lançada
 * manualmente após a sentença (INV-036, P-04). Valor estimado é só informativo.
 */
export function gerarParcelasAdExitum(): ParcelaGerada[] {
  return [];
}

export interface FixoExitumInput {
  valorEntrada: number;
  dataEntrada: string;
}

/**
 * Tipo `fixo_exitum`: a entrada fixa vira a 1ª parcela; o êxito é apurado e
 * lançado manualmente no encerramento (INV-038).
 */
export function gerarParcelasFixoExitum(input: FixoExitumInput): ParcelaGerada[] {
  return [
    {
      numero: 1,
      valor: input.valorEntrada,
      vencimento: input.dataEntrada,
      status_registrado: "em_aberto",
      data_pagamento: null,
    },
  ];
}

/** Valor estimado do êxito: valorCausa * percentual%. */
export function calcularValorExito(valorCausa: number, percentual: number): number {
  return Math.round(valorCausa * (percentual / 100) * 100) / 100;
}
