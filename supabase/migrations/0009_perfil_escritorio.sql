-- Migration 0009: perfil do escritório (remove oab, adiciona campos do escritório)

alter table public.profiles
  add column if not exists cnpj     text,
  add column if not exists telefone text,
  add column if not exists endereco text,
  add column if not exists site     text;

alter table public.profiles drop column if exists oab;
