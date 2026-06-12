import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "../ClienteForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Novo cliente — Comarca Honorários",
};

export default async function NovoClientePage() {
  const supabase = await createClient();
  const { data: advogados } = await supabase
    .from("advogados")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  return (
    <div>
      <PageHeader title="Novo cliente" />
      <ClienteForm advogados={advogados ?? []} />
    </div>
  );
}
