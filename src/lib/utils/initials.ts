/**
 * Iniciais de um nome para avatares. Ignora preposições e abreviações de
 * tratamento (de/da/do/dr/dra…). Pura — compartilhada entre as telas.
 */
export function initials(nome: string): string {
  const parts = nome
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 1 && !/^(de|da|do|dos|das|e|dr|dra)\.?$/i.test(p));
  if (parts.length === 0) return nome.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
