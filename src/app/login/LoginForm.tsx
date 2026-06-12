"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { signIn, type AuthState } from "@/app/auth/actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signIn, undefined);
  const error = state?.error ?? initialError;

  return (
    <form action={formAction} noValidate>
      {error && <Alert>{error}</Alert>}

      <FormField label="E-mail" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="form-control"
          placeholder="voce@exemplo.com"
          required
        />
      </FormField>

      <FormField label="Senha" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="form-control"
          placeholder="••••••••"
          required
        />
      </FormField>

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
