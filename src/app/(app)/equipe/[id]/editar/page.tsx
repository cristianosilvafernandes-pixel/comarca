import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdvogadoForm } from "../../AdvogadoForm";

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
      <div className="page-head">
        <h1>Editar advogado</h1>
      </div>
      <AdvogadoForm advogado={data} />
    </div>
  );
}
