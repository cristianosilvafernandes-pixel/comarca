import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SignupForm } from "./SignupForm";
import { Logo } from "@/components/Logo";
import "../auth/auth.css";

export const metadata: Metadata = {
  title: "Criar conta — Comarca Honorários",
};

export default function CadastroPage() {
  return (
    <div className="auth-wrap">
      <Card className="auth-card">
        <div className="auth-brand">
          <div className="logo"><Logo size={28} />Comarca</div>
          <p>Honorários sob controle</p>
        </div>
        <h1 className="auth-title">Criar conta</h1>
        <p className="auth-sub">Grátis para começar. Sem cartão, sem taxa sobre seu PIX.</p>

        <SignupForm />

        <div className="auth-foot">
          Já tem conta? <Link href="/login">Entrar</Link>
        </div>
      </Card>
    </div>
  );
}
