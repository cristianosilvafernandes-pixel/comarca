import type { Metadata } from "next";
import { AdvogadoForm } from "../AdvogadoForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Novo advogado — Comarca Honorários",
};

export default function NovoAdvogadoPage() {
  return (
    <div>
      <PageHeader title="Novo advogado" />
      <AdvogadoForm />
    </div>
  );
}
