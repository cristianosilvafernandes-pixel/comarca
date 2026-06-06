"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Plano } from "@/lib/database.types";

const PLANOS_VALIDOS: Plano[] = ["free", "essencial", "profissional"];

/**
 * Troca o plano do advogado (spec F12). Billing/assinatura fica fora do MVP —
 * este é o gancho que altera profiles.plano; um provedor de pagamento entra depois.
 */
export async function changePlano(formData: FormData): Promise<void> {
  const plano = String(formData.get("plano") ?? "") as Plano;
  if (!PLANOS_VALIDOS.includes(plano)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ plano }).eq("id", user.id);
  revalidatePath("/planos");
  revalidatePath("/", "layout");
}
