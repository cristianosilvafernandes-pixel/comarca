"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { signUp, type AuthState } from "@/app/auth/actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, undefined);

  // Sucesso: confirmação de e-mail ON → mostra aviso e oculta o formulário.
  if (state?.message) {
    return <Alert variant="success">{state.message}</Alert>;
  }

  return (
    <form action={formAction} noValidate>
      {state?.error && <Alert>{state.error}</Alert>}

      <FormField label="Nome" htmlFor="nome">
        <input
          id="nome"
          name="nome"
          type="text"
          autoComplete="name"
          className="form-control"
          placeholder="Seu nome"
          required
        />
      </FormField>

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
          autoComplete="new-password"
          className="form-control"
          placeholder="Mínimo 8 caracteres"
          minLength={8}
          required
        />
      </FormField>

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Criando…" : "Criar conta"}
      </Button>
    </form>
  );
}
