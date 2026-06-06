-- 0002: corrige avisos dos Advisors (security + performance)

-- 1. search_path fixo nas funções restantes
create or replace function public.status_efetivo(p public.parcelas)
returns text language sql immutable set search_path = '' as $$
  select case
    when p.status_registrado = 'pago' then 'pago'
    when p.status_registrado = 'pago_verificacao' then 'pago_verificacao'
    when p.vencimento < current_date then 'atrasado'
    when p.vencimento - current_date between 0 and 2 then 'vencendo'
    else 'pendente'
  end;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;

-- 2. revogar EXECUTE das funções de trigger (não devem ser RPC-públicas)
revoke execute on function public.handle_new_user()        from public, anon, authenticated;
revoke execute on function public.set_advogado_id()        from public, anon, authenticated;
revoke execute on function public.set_parcela_advogado_id() from public, anon, authenticated;
revoke execute on function public.set_updated_at()         from public, anon, authenticated;
revoke execute on function public.check_limite_clientes()  from public, anon, authenticated;

-- 3. citext: sair do schema public
alter extension citext set schema extensions;

-- 4. índice na FK lembretes.parcela_id
create index if not exists lembretes_parcela_id_idx on public.lembretes (parcela_id);

-- 5. RLS: envolver auth.uid() em subquery (initplan)
alter policy "profiles_select_own" on public.profiles using ((select auth.uid()) = id);
alter policy "profiles_update_own" on public.profiles using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
alter policy "clientes_select_own" on public.clientes using (advogado_id = (select auth.uid()));
alter policy "clientes_insert_own" on public.clientes with check (advogado_id = (select auth.uid()));
alter policy "clientes_update_own" on public.clientes using (advogado_id = (select auth.uid())) with check (advogado_id = (select auth.uid()));
alter policy "clientes_delete_own" on public.clientes using (advogado_id = (select auth.uid()));
alter policy "honorarios_select_own" on public.honorarios using (advogado_id = (select auth.uid()));
alter policy "honorarios_insert_own" on public.honorarios with check (advogado_id = (select auth.uid()));
alter policy "honorarios_update_own" on public.honorarios using (advogado_id = (select auth.uid())) with check (advogado_id = (select auth.uid()));
alter policy "honorarios_delete_own" on public.honorarios using (advogado_id = (select auth.uid()));
alter policy "parcelas_select_own" on public.parcelas using (advogado_id = (select auth.uid()));
alter policy "parcelas_insert_own" on public.parcelas with check (advogado_id = (select auth.uid()));
alter policy "parcelas_update_own" on public.parcelas using (advogado_id = (select auth.uid())) with check (advogado_id = (select auth.uid()));
alter policy "parcelas_delete_own" on public.parcelas using (advogado_id = (select auth.uid()));
alter policy "documentos_select_own" on public.documentos using (advogado_id = (select auth.uid()));
alter policy "documentos_insert_own" on public.documentos with check (advogado_id = (select auth.uid()));
alter policy "documentos_update_own" on public.documentos using (advogado_id = (select auth.uid())) with check (advogado_id = (select auth.uid()));
alter policy "documentos_delete_own" on public.documentos using (advogado_id = (select auth.uid()));
alter policy "lembretes_select_own" on public.lembretes using (advogado_id = (select auth.uid()));
alter policy "lembretes_insert_own" on public.lembretes with check (advogado_id = (select auth.uid()));
alter policy "lembretes_update_own" on public.lembretes using (advogado_id = (select auth.uid())) with check (advogado_id = (select auth.uid()));
alter policy "lembretes_delete_own" on public.lembretes using (advogado_id = (select auth.uid()));
