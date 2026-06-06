/**
 * Agregações e filtros do dashboard (spec F5, INV-061..064, T-308/309/310).
 * Funções puras. Paridade com o protótipo (renderDashboard/checkPeriod):
 *   - Confirmados = pago + pago_verificacao
 *   - Urgentes    = vencendo + atrasado
 *   - Pendentes   = pendente (restante)
 * (Observação: o texto da spec F5 descreve buckets levemente diferentes;
 *  o protótipo é a fonte de paridade, então seguimos o protótipo.)
 */

import { resolveStatus, type StatusEfetivo } from "@/lib/utils/status";
import type { StatusRegistrado } from "@/lib/database.types";

export interface ParcelaDashboard {
  status_registrado: StatusRegistrado;
  vencimento: string; // YYYY-MM-DD
  valor: number;
}

export interface Bucket {
  valor: number;
  count: number;
}

export interface ResumoDashboard {
  pendentes: Bucket;
  urgentes: Bucket;
  confirmados: Bucket;
  badges: { vencendo: number; atrasado: number };
}

/** Resumo dos 3 cards + badges de contagem. */
export function resumoDashboard(
  parcelas: ParcelaDashboard[],
  hoje: string | Date = new Date(),
): ResumoDashboard {
  const r: ResumoDashboard = {
    pendentes: { valor: 0, count: 0 },
    urgentes: { valor: 0, count: 0 },
    confirmados: { valor: 0, count: 0 },
    badges: { vencendo: 0, atrasado: 0 },
  };

  for (const p of parcelas) {
    const st = resolveStatus(p.status_registrado, p.vencimento, hoje);
    if (st === "pago" || st === "pago_verificacao") {
      r.confirmados.valor += p.valor;
      r.confirmados.count++;
    } else if (st === "vencendo" || st === "atrasado") {
      r.urgentes.valor += p.valor;
      r.urgentes.count++;
      if (st === "vencendo") r.badges.vencendo++;
      else r.badges.atrasado++;
    } else {
      r.pendentes.valor += p.valor;
      r.pendentes.count++;
    }
  }
  return r;
}

export type PeriodoTipo = "este_mes" | "este_ano" | "todos" | "customizado";
export interface FiltroPeriodo {
  tipo: PeriodoTipo;
  de?: string | null;
  ate?: string | null;
}

/** Aplica o filtro de período sobre o `vencimento` (INV-062). */
export function filtrarPorPeriodo<T extends { vencimento: string }>(
  itens: T[],
  filtro: FiltroPeriodo,
  hoje: string | Date = new Date(),
): T[] {
  const ref = typeof hoje === "string" ? new Date(hoje + "T12:00:00Z") : hoje;
  const refY = ref.getUTCFullYear();
  const refM = ref.getUTCMonth();

  return itens.filter((it) => {
    const venc = it.vencimento.slice(0, 10);
    const [vy, vm] = venc.split("-").map(Number);
    switch (filtro.tipo) {
      case "todos":
        return true;
      case "este_mes":
        return vy === refY && vm - 1 === refM;
      case "este_ano":
        return vy === refY;
      case "customizado": {
        if (!filtro.de && !filtro.ate) return true;
        if (filtro.de && venc < filtro.de) return false;
        if (filtro.ate && venc > filtro.ate) return false;
        return true;
      }
    }
  });
}

export type FiltroStatus = "todos" | StatusEfetivo;

/** Filtra itens (com status efetivo já resolvido) por aba de status (INV-063). */
export function filtrarPorStatus<T extends { status: StatusEfetivo }>(
  itens: T[],
  filtro: FiltroStatus,
): T[] {
  if (filtro === "todos") return itens;
  return itens.filter((it) => it.status === filtro);
}

/** Ordena por vencimento ascendente. */
export function ordenarPorVencimento<T extends { vencimento: string }>(itens: T[]): T[] {
  return [...itens].sort((a, b) => a.vencimento.localeCompare(b.vencimento));
}
