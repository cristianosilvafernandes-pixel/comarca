import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PerfilForm } from "./PerfilForm";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Plano } from "@/lib/database.types";

export const metadata: Metadata = {
  title: "Meu Perfil — Comarca Honorários",
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, cnpj, telefone, endereco, site, chave_pix, foro, plano, logo_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div>
      <PageHeader title="Perfil do Escritório" />
      <PerfilForm
        nome={profile?.nome ?? ""}
        cnpj={profile?.cnpj ?? null}
        telefone={profile?.telefone ?? null}
        endereco={profile?.endereco ?? null}
        site={profile?.site ?? null}
        chavePix={profile?.chave_pix ?? null}
        foro={profile?.foro ?? null}
        plano={(profile?.plano ?? "free") as Plano}
        logoUrl={profile?.logo_url ?? null}
      />
    </div>
  );
}
