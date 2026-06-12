import Link from "next/link";

export interface StatusTab {
  key: string;
  label: string;
}

/**
 * Abas de filtro por status com badge de contagem. `href(key)` é montado por
 * cada página (a query string difere entre honorários e dashboard).
 */
export function StatusTabs({
  tabs,
  active,
  counts,
  href,
}: {
  tabs: StatusTab[];
  active: string;
  counts: Record<string, number>;
  href: (key: string) => string;
}) {
  return (
    <div className="tabs-wrapper">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={href(t.key)}
          className={`tab-btn${active === t.key ? " active" : ""}`}
        >
          {t.label}
          <span
            className={`tab-badge${t.key === "atrasado" && counts.atrasado > 0 ? " tab-badge-warn" : ""}`}
          >
            {counts[t.key] ?? 0}
          </span>
        </Link>
      ))}
    </div>
  );
}
