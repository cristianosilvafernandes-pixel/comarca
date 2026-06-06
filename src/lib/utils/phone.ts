/**
 * Normalização e máscara de WhatsApp/telefone brasileiro (spec §5, T-206).
 * Funções puras.
 */

import { onlyDigits } from "./cpf";

/**
 * Normaliza para E.164 brasileiro: "+55DDNNNNNNNNN".
 * Aceita entradas com/sem DDI, com máscara, etc.
 * Retorna null se não houver dígitos suficientes para um número válido.
 */
export function normalizeWhatsApp(input: string): string | null {
  let d = onlyDigits(input);
  if (!d) return null;

  // Remove DDI 55 se já presente (10 ou 11 dígitos nacionais após o 55).
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    d = d.slice(2);
  }

  // Nacional precisa ter DDD (2) + número (8 ou 9) = 10 ou 11 dígitos.
  if (d.length !== 10 && d.length !== 11) return null;

  return `+55${d}`;
}

/** Retorna só os dígitos com DDI 55 (para montar links wa.me): "5553999998888". */
export function whatsappForWaMe(input: string): string | null {
  const e164 = normalizeWhatsApp(input);
  return e164 ? e164.replace("+", "") : null;
}

/** Máscara visual de telefone: (53) 99999-8888 ou (53) 9999-8888. */
export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}
