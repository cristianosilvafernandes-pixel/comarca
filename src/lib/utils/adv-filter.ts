/**
 * Parsing do filtro de advogados na URL. Param `adv` é uma lista de ids
 * separada por vírgula (multi-seleção). Ausente ou "todos" → [] (todos).
 */
export function parseAdv(raw?: string | null): string[] {
  if (!raw || raw === "todos") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
