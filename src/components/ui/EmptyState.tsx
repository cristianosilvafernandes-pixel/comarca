import type { ReactNode } from "react";

/** Estado vazio padrão: ícone, título, descrição e ação — todos opcionais. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <h3>{title}</h3>}
      {description && <p style={{ margin: "8px 0 16px" }}>{description}</p>}
      {action}
    </div>
  );
}
