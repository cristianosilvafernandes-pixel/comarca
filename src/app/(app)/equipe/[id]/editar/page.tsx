import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdvogadoForm } from "../../AdvogadoForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Editar advogado — Comarca Honorários",
};

export default async function EditarAdvogadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("advogados")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  return (
    <div>
      <PageHeader title="Editar advogado" />
      <AdvogadoForm advogado={data} />
    </div>
  );
}
