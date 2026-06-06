"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { signIn, type AuthState } from "@/app/auth/actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signIn, undefined);
  const error = state?.error ?? initialError;

  return (
    <form action={formAction} noValidate>
      {error && <div className="auth-alert error">{error}</div>}

      <div className="form-group">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="form-control"
          placeholder="voce@exemplo.com"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="form-control"
          placeholder="••••••••"
          required
        />
      </div>

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
