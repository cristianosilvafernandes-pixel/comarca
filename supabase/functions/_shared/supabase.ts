import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

// Cliente admin — ignora RLS. Usar SOMENTE no servidor, com filtros explícitos.
export function adminClient(): SupabaseClient {
  return createClient(URL, SERVICE_ROLE, { auth: { persistSession: false } });
}

// Cliente no contexto do usuário — respeita RLS via JWT do header Authorization.
export function userClient(authHeader: string): SupabaseClient {
  return createClient(URL, ANON, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}
