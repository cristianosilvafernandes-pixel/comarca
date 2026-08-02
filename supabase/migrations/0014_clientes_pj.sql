-- Suporte a clientes Pessoa Jurídica.
-- Roda: supabase db push  (requer credenciais do projeto)

alter table clientes
  alter column cpf drop not null,
  add column if not exists tipo_pessoa     text not null default 'PF'
    check (tipo_pessoa in ('PF', 'PJ')),
  add column if not exists cnpj            text,
  add column if not exists responsavel_legal text;
