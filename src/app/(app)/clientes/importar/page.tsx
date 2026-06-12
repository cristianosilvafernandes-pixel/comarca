import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ImportarClienteForm } from "./ImportarClienteForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Importar cliente de documento — Comarca Honorários",
};

export default async function ImportarClientePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <PageHeader
        title="Importar cliente de documento"
        action={
          <Link href="/clientes" className="btn btn-secondary">
            Voltar
          </Link>
        }
      />
      <p style={{ marginBottom: 16 }}>
        Envie uma procuração, contrato ou declaração (PDF/DOC). O sistema extrai nome, CPF, WhatsApp,
        e-mail e endereço — você confere e salva.
      </p>
      <ImportarClienteForm userId={user.id} />
    </div>
  );
}
