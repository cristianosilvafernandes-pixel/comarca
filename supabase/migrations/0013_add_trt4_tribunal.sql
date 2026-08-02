-- Adiciona TRT4 (Tribunal Regional do Trabalho 4ª Região) à constraint de tribunais.
-- Roda: supabase db push  (requer credenciais do projeto)

alter table honorarios
  drop constraint if exists honorarios_tribunal_check;

alter table honorarios
  add constraint honorarios_tribunal_check
  check (tribunal in ('TJRS','TJSP','TJRJ','TRF4','TRT4','TST','STJ','Outro'));
