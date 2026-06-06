"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { signUp, type AuthState } from "@/app/auth/actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, undefined);

  // Sucesso: confirmação de e-mail ON → mostra aviso e oculta o formulário.
  if (state?.message) {
    return <div className="auth-alert success">{state.message}</div>;
  }

  return (
    <form action={formAction} noValidate>
      {state?.error && <div className="auth-alert error">{state.error}</div>}

      <div className="form-group">
        <label htmlFor="nome">Nome</label>
        <input
          id="nome"
          name="nome"
          type="text"
          autoComplete="name"
          className="form-control"
          placeholder="Seu nome"
          required
        />
      </div>

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
          autoComplete="new-password"
          className="form-control"
          placeholder="Mínimo 8 caracteres"
          minLength={8}
          required
        />
      </div>

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Criando…" : "Criar conta"}
      </Button>
    </form>
  );
}
