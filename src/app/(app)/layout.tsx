import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import "./app.css";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defesa em profundidade — o proxy já protege, mas o layout confirma.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, oab")
    .eq("id", user.id)
    .maybeSingle();

  const nome = profile?.nome ?? user.email?.split("@")[0] ?? "Advogado";

  return (
    <div id="app">
      <AppHeader nome={nome} oab={profile?.oab} />
      <div id="app-body">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
