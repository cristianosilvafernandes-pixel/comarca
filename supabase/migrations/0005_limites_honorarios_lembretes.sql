-- Comarca Honorários — enforcement server-side dos limites de plano (spec F12).
-- Completa o que faltava: 0001 já cobre clientes; aqui honorários e lembretes/mês.
-- Limites (free / essencial / profissional):
--   honorários ativos: 5 / 20 / ilimitado
--   lembretes no mês:  10 / 50 / ilimitado
-- Obs.: migration 0004 (bucket Storage `documentos` + policies) foi aplicada
-- fora do versionamento (via painel/MCP); este arquivo é o 0005.

-- =====================================================================
-- Honorários ativos (conta todos os honorários do advogado)
-- =====================================================================
create or replace function public.check_limite_honorarios()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  plano_atual text;
  total int;
  limite int;
  adv uuid;
begin
  adv := coalesce(new.advogado_id, auth.uid());
  select plano into plano_atual from public.profiles where id = adv;
  select count(*) into total from public.honorarios where advogado_id = adv;
  limite := case plano_atual
              when 'free' then 5
              when 'essencial' then 20
              else 2147483647 end;
  if total >= limite then
    raise exception 'Limite de honorários do plano % atingido (%).', plano_atual, limite
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger trg_limite_honorarios before insert on public.honorarios
  for each row execute function public.check_limite_honorarios();

-- =====================================================================
-- Lembretes por mês corrente
-- =====================================================================
create or replace function public.check_limite_lembretes()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  plano_atual text;
  total int;
  limite int;
  adv uuid;
begin
  adv := coalesce(new.advogado_id, auth.uid());
  select plano into plano_atual from public.profiles where id = adv;
  select count(*) into total
    from public.lembretes
   where advogado_id = adv
     and enviado_em >= date_trunc('month', now());
  limite := case plano_atual
              when 'free' then 10
              when 'essencial' then 50
              else 2147483647 end;
  if total >= limite then
    raise exception 'Limite de lembretes do plano % atingido neste mês (%).', plano_atual, limite
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger trg_limite_lembretes before insert on public.lembretes
  for each row execute function public.check_limite_lembretes();

-- Defesa em profundidade: revoga execute das funções de gatilho (advisor).
revoke execute on function public.check_limite_honorarios() from anon, authenticated;
revoke execute on function public.check_limite_lembretes() from anon, authenticated;
