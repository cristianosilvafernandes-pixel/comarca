import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "../ClienteForm";

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
      <div className="page-head">
        <h1>Novo cliente</h1>
      </div>
      <ClienteForm advogados={advogados ?? []} />
    </div>
  );
}
