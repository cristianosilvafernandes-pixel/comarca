import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "../../ClienteForm";
import { DeleteClienteButton } from "./DeleteClienteButton";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Editar cliente — Comarca Honorários",
};

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: cliente }, { data: advogados }] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", id).maybeSingle(),
    supabase.from("advogados").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  if (!cliente) notFound();

  return (
    <div>
      <PageHeader title="Editar cliente" />
      <ClienteForm cliente={cliente} advogados={advogados ?? []} />
      <div style={{ maxWidth: 560, marginTop: 16 }}>
        <DeleteClienteButton id={cliente.id} />
      </div>
    </div>
  );
}
