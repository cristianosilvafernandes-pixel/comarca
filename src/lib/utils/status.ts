/**
 * Cálculo do status efetivo de uma parcela (spec §3.2, F4, INV-051, T-304).
 * Função pura — não depende de backend.
 */

import { calculateDaysDifference } from "./format";
import type { StatusRegistrado } from "@/lib/database.types";

export type StatusEfetivo =
  | "pago"
  | "pago_verificacao"
  | "atrasado"
  | "vencendo"
  | "pendente";

/**
 * Deriva o status efetivo:
 *   pago / pago_verificacao  -> fato registrado
 *   vencimento < hoje        -> atrasado
 *   0..2 dias para vencer     -> vencendo
 *   senão                     -> pendente
 *
 * @param statusRegistrado status persistido da parcela
 * @param vencimento data de vencimento (YYYY-MM-DD ou Date)
 * @param hoje data de referência (default: hoje, em UTC civil)
 */
export function resolveStatus(
  statusRegistrado: StatusRegistrado,
  vencimento: string | Date,
  hoje: string | Date = new Date(),
): StatusEfetivo {
  if (statusRegistrado === "pago") return "pago";
  if (statusRegistrado === "pago_verificacao") return "pago_verificacao";

  const dias = calculateDaysDifference(hoje, vencimento);
  if (dias < 0) return "atrasado";
  if (dias <= 2) return "vencendo";
  return "pendente";
}

/** Rótulo pt-BR do status efetivo. */
export function statusLabel(status: StatusEfetivo): string {
  switch (status) {
    case "pago":
      return "Pago";
    case "pago_verificacao":
      return "Pago (em verificação)";
    case "atrasado":
      return "Atrasado";
    case "vencendo":
      return "Vencendo";
    case "pendente":
      return "Pendente";
  }
}
