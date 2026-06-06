/**
 * Marca Comarca — balança da justiça (advogados / Comarca) coroada por um
 * check (honorário em dia / lembrete cumprido). Monocromática: usa
 * `currentColor`, então herda a cor do contexto (ink no claro, branco no escuro).
 */
export function Logo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Comarca"
      className={className}
    >
      <g stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.2 5.6 L15.1 7.5 L18.8 3.6" />
        <path d="M6 10 H26" />
        <path d="M16 9 V23" />
        <path d="M7 10 V13.5" />
        <path d="M25 10 V13.5" />
        <path d="M3.5 14 a3.5 3.5 0 0 0 7 0" />
        <path d="M21.5 14 a3.5 3.5 0 0 0 7 0" />
        <path d="M11 23 H21" />
      </g>
    </svg>
  );
}
