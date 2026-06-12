import type { ReactNode } from "react";

/**
 * Campo de formulário padrão: rótulo + controle + ajuda/erro opcionais.
 * O controle (input/select/textarea com `form-control`) vai em children.
 */
export function FormField({
  label,
  htmlFor,
  help,
  error,
  children,
}: {
  label?: ReactNode;
  htmlFor?: string;
  help?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="form-group">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {help && (
        <small style={{ color: "var(--mute)", fontSize: 12 }}>{help}</small>
      )}
      {error && (
        <small style={{ color: "var(--error)", fontSize: 12 }}>{error}</small>
      )}
    </div>
  );
}
