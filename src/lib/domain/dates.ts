/**
 * Aritmética de datas civis (YYYY-MM-DD), sem timezone. Funções puras.
 * Base para geração de parcelas (spec F3/F4).
 */

/** Converte "YYYY-MM-DD" para [ano, mês(1-12), dia]. */
function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return [y, m, d];
}

/** Formata [ano, mês(1-12), dia] como "YYYY-MM-DD". */
function toISO(y: number, m: number, d: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Último dia do mês (1-12). */
export function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Soma `n` dias a uma data civil. */
export function addDays(iso: string, n: number): string {
  const [y, m, d] = parts(iso);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return toISO(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/**
 * Soma `n` meses a uma data civil, preservando o dia quando possível.
 * Se o dia não existe no mês destino (ex.: 31/jan + 1 mês), usa o último dia.
 */
export function addMonths(iso: string, n: number): string {
  const [y, m, d] = parts(iso);
  const totalMonths = (y * 12 + (m - 1)) + n;
  const ny = Math.floor(totalMonths / 12);
  const nm = (totalMonths % 12) + 1;
  const nd = Math.min(d, lastDayOfMonth(ny, nm));
  return toISO(ny, nm, nd);
}

/** Data de hoje (UTC civil) como "YYYY-MM-DD". */
export function todayISO(now: Date = new Date()): string {
  return toISO(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
}

/** Diferença em meses inteiros entre duas datas civis (b - a), pelo calendário. */
export function monthsBetween(aISO: string, bISO: string): number {
  const [ay, am] = parts(aISO);
  const [by, bm] = parts(bISO);
  return (by * 12 + bm) - (ay * 12 + am);
}
