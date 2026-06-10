import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HonorarioForm } from "../HonorarioForm";

export const metadata: Metadata = {
  title: "Novo honorário — Comarca Honorários",
};

export default async function NovoHonorarioPage() {
  const supabase = await createClient();
  const [{ data: clientes }, { data: advogados }] = await Promise.all([
    supabase.from("clientes").select("id, nome").order("nome"),
    supabase.from("advogados").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  return (
    <div>
      <div className="page-head">
        <h1>Novo honorário</h1>
      </div>

      {!clientes || clientes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3>Cadastre um cliente primeiro</h3>
          <p style={{ margin: "8px 0 16px" }}>Um honorário precisa estar vinculado a um cliente.</p>
          <Link href="/clientes/novo" className="btn btn-primary">
            Cadastrar cliente
          </Link>
        </div>
      ) : (
        <HonorarioForm clientes={clientes ?? []} advogados={advogados ?? []} />
      )}
    </div>
  );
}
