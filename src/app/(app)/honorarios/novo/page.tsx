import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { HonorarioForm } from "../HonorarioForm";

export const metadata: Metadata = {
  title: "Novo honorário — Comarca Honorários",
};

export default async function NovoHonorarioPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente: clientePreSelecionado } = await searchParams;
  const supabase = await createClient();
  const [{ data: clientes }, { data: advogados }] = await Promise.all([
    supabase.from("clientes").select("id, nome").order("nome"),
    supabase.from("advogados").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  return (
    <div>
      <PageHeader title="Novo honorário" />

      {!clientes || clientes.length === 0 ? (
        <EmptyState
          icon="👤"
          title="Cadastre um cliente primeiro"
          description="Um honorário precisa estar vinculado a um cliente."
          action={
            <Link href="/clientes/novo" className="btn btn-primary">
              Cadastrar cliente
            </Link>
          }
        />
      ) : (
        <HonorarioForm
          clientes={clientes ?? []}
          advogados={advogados ?? []}
          clienteSelecionado={clientePreSelecionado}
        />
      )}
    </div>
  );
}
