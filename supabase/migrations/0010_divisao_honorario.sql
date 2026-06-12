-- Comarca Honorários — divisão de honorário com advogado parceiro
-- Apenas registro/exibição: não reparte somas nem IR. Quem entra com %, o
-- titular fica com o restante (100 - %).

alter table public.honorarios
  add column parceiro_id uuid references public.advogados(id) on delete set null,
  add column parceiro_percentual numeric(5,2)
    check (parceiro_percentual is null or (parceiro_percentual >= 0 and parceiro_percentual <= 100));

create index on public.honorarios (parceiro_id);
