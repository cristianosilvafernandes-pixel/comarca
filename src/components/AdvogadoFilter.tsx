"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface Adv {
  id: string;
  nome: string;
}

/**
 * Filtro de advogados padrão da aplicação: dropdown com multi-seleção
 * (checkboxes). Preserva os demais parâmetros da URL e só altera `adv`.
 * Aplica a seleção ao fechar o painel. Nada some quando há ≤1 advogado.
 */
export function AdvogadoFilter({
  advogados,
  selected,
}: {
  advogados: Adv[];
  selected: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<string[]>(selected);
  const ref = useRef<HTMLDivElement>(null);

  // Re-sincroniza com a seleção externa (ex.: voltar do navegador) sem effect.
  const selectedKey = selected.join(",");
  const [prevKey, setPrevKey] = useState(selectedKey);
  if (prevKey !== selectedKey) {
    setPrevKey(selectedKey);
    setSel(selected);
  }

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Aplica ao fechar, se a seleção mudou.
  useEffect(() => {
    if (open) return;
    if (sel.join(",") === selectedKey) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (sel.length === 0) params.delete("adv");
    else params.set("adv", sel.join(","));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (advogados.length <= 1) return null;

  const toggle = (id: string) =>
    setSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const label =
    sel.length === 0
      ? "Todos os advogados"
      : sel.length === 1
        ? advogados.find((a) => a.id === sel[0])?.nome ?? "1 advogado"
        : `${sel.length} advogados`;

  return (
    <div className="adv-filter" ref={ref}>
      <span className="adv-filter-label">Advogado:</span>
      <button
        type="button"
        className="adv-filter-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{label}</span>
        <span className="adv-filter-caret">▾</span>
      </button>

      {open && (
        <div className="adv-filter-panel" role="listbox" aria-multiselectable="true">
          <button
            type="button"
            className={`adv-filter-option${sel.length === 0 ? " active" : ""}`}
            onClick={() => setSel([])}
            role="option"
            aria-selected={sel.length === 0}
          >
            <span className="adv-filter-check">{sel.length === 0 ? "✓" : ""}</span>
            Todos os advogados
          </button>
          <div className="adv-filter-sep" />
          {advogados.map((a) => {
            const on = sel.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                className={`adv-filter-option${on ? " active" : ""}`}
                onClick={() => toggle(a.id)}
                role="option"
                aria-selected={on}
              >
                <span className="adv-filter-check">{on ? "✓" : ""}</span>
                {a.nome}
              </button>
            );
          })}
          <div className="adv-filter-sep" />
          <button
            type="button"
            className="adv-filter-apply"
            onClick={() => setOpen(false)}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
