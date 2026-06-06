import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PerfilForm } from "./PerfilForm";
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
    .select("nome, oab, chave_pix, foro, plano")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div>
      <div className="page-head">
        <h1>Meu Perfil</h1>
      </div>
      <PerfilForm
        nome={profile?.nome ?? ""}
        oab={profile?.oab ?? null}
        chavePix={profile?.chave_pix ?? null}
        foro={profile?.foro ?? null}
        plano={(profile?.plano ?? "free") as Plano}
      />
    </div>
  );
}
