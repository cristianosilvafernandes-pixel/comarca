import type { ReactNode } from "react";

/** Cabeçalho padrão de página: título + ação opcional à direita. */
export function PageHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {action}
    </div>
  );
}
