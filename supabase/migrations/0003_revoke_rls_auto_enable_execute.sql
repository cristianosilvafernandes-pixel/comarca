-- rls_auto_enable é event-trigger (auto-RLS em tabelas novas do public). Mantido.
-- Remove exposição via RPC (não deve ser chamável por anon/authenticated).
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
