import type { Metadata } from "next";
import { AdvogadoForm } from "../AdvogadoForm";

export const metadata: Metadata = {
  title: "Novo advogado — Comarca Honorários",
};

export default function NovoAdvogadoPage() {
  return (
    <div>
      <div className="page-head">
        <h1>Novo advogado</h1>
      </div>
      <AdvogadoForm />
    </div>
  );
}
