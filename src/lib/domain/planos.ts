/**
 * Limites por plano (spec F12 / PRD §6.3, INV-135, T-210/307/404).
 * Funções puras — espelham o enforcement do servidor (trigger check_limite_*).
 * A verdade é o servidor; isto é o guard de UX no cliente.
 */

import type { Plano } from "@/lib/database.types";

export type Recurso = "clientes" | "honorarios" | "lembretes";

const ILIMITADO = Infinity;

export const LIMITES: Record<Plano, Record<Recurso, number>> = {
  free: { clientes: 3, honorarios: 5, lembretes: 10 },
  essencial: { clientes: 10, honorarios: 20, lembretes: 50 },
  profissional: { clientes: ILIMITADO, honorarios: ILIMITADO, lembretes: ILIMITADO },
};

/** Limite do plano para um recurso (Infinity = ilimitado). */
export function limiteDoPlano(plano: Plano, recurso: Recurso): number {
  return LIMITES[plano][recurso];
}

/** True se ainda é possível adicionar mais um item do recurso. */
export function podeAdicionar(plano: Plano, recurso: Recurso, totalAtual: number): boolean {
  return totalAtual < limiteDoPlano(plano, recurso);
}

/** True se o limite já foi atingido. */
export function atingiuLimite(plano: Plano, recurso: Recurso, totalAtual: number): boolean {
  return !podeAdicionar(plano, recurso, totalAtual);
}

const RECURSO_LABEL: Record<Recurso, string> = {
  clientes: "clientes",
  honorarios: "honorários ativos",
  lembretes: "lembretes neste mês",
};

/** Mensagem de bloqueio + sugestão de upgrade quando o limite é atingido. */
export function mensagemLimite(plano: Plano, recurso: Recurso): string {
  const limite = limiteDoPlano(plano, recurso);
  const sugestao = plano === "free" ? " Faça upgrade para o Essencial." : plano === "essencial" ? " Faça upgrade para o Profissional." : "";
  return `Limite do plano ${plano} atingido: ${limite} ${RECURSO_LABEL[recurso]}.${sugestao}`;
}
