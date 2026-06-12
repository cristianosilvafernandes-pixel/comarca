import type { HonorarioTipo } from "@/lib/database.types";

/** Áreas do direito (opções de formulário). */
export const AREAS = [
  "Trabalhista",
  "Cível",
  "Família",
  "Criminal",
  "Previdenciário",
  "Tributário",
  "Consumidor",
  "Outro",
] as const;

/** Tribunais (opções de formulário). */
export const TRIBUNAIS = ["TJRS", "TJSP", "TJRJ", "TRF4", "TST", "STJ", "Outro"] as const;

/** Rótulo pt-BR do tipo de honorário. */
export const TIPO_LABEL: Record<HonorarioTipo, string> = {
  fixo_parcelado: "Fixo parcelado",
  recorrente: "Recorrente",
  ad_exitum: "Ad êxitum",
  fixo_exitum: "Fixo + êxito",
};

/** Rótulo do tipo aceitando string crua do banco (fallback para o próprio valor). */
export function tipoLabel(tipo: string): string {
  return TIPO_LABEL[tipo as HonorarioTipo] ?? tipo;
}
