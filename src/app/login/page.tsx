import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/Logo";
import "../auth/auth.css";

export const metadata: Metadata = {
  title: "Entrar — Comarca Honorários",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const linkError = error === "link_invalido" ? "Link de confirmação inválido ou expirado." : undefined;

  return (
    <div className="auth-wrap">
      <Card className="auth-card">
        <div className="auth-brand">
          <div className="logo"><Logo size={28} />Comarca</div>
          <p>Honorários sob controle</p>
        </div>
        <h1 className="auth-title">Entrar</h1>
        <p className="auth-sub">Acesse sua conta para acompanhar honorários.</p>

        <LoginForm initialError={linkError} />

        <div className="auth-foot">
          Não tem conta? <Link href="/cadastro">Criar conta</Link>
        </div>
      </Card>
    </div>
  );
}
