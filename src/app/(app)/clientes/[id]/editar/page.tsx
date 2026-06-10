import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "../../ClienteForm";

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
      <div className="page-head">
        <h1>Editar cliente</h1>
      </div>
      <ClienteForm cliente={cliente} advogados={advogados ?? []} />
    </div>
  );
}
