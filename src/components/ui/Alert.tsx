import type { CSSProperties, ReactNode } from "react";

/** Mensagem de alerta padrão (erro/sucesso/info). Usa as classes auth-alert. */
export function Alert({
  variant = "error",
  className = "",
  style,
  children,
}: {
  variant?: "error" | "success" | "info";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  // "info" = caixa neutra (sem modificador de cor de erro/sucesso).
  const variantClass = variant === "info" ? "" : ` ${variant}`;
  return (
    <div className={`auth-alert${variantClass} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
