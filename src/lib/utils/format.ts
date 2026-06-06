/**
 * Formatação e parsing pt-BR. Funções puras (spec §5, INV-121).
 */

/** Formata número como moeda brasileira: 1200 -> "R$ 1.200,00". */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

/** Formata data ISO (YYYY-MM-DD) ou Date como dd/mm/aaaa, sem timezone shift. */
export function formatDate(value: string | Date): string {
  if (value instanceof Date) {
    return value.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  }
  // Trata "YYYY-MM-DD" como data civil (sem hora) para evitar deslocamento.
  const [y, m, d] = value.slice(0, 10).split("-");
  if (y && m && d) return `${d}/${m}/${y}`;
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/** Converte string monetária pt-BR ("R$ 1.200,50" / "1.200,50") em float. */
export function parseCurrencyToFloat(input: string): number {
  if (!input) return 0;
  const cleaned = input
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

/** Diferença em dias inteiros entre duas datas civis (b - a). */
export function calculateDaysDifference(a: string | Date, b: string | Date): number {
  const toUTC = (v: string | Date): number => {
    if (v instanceof Date) return Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate());
    const [y, m, d] = v.slice(0, 10).split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  const MS_PER_DAY = 86_400_000;
  return Math.round((toUTC(b) - toUTC(a)) / MS_PER_DAY);
}
