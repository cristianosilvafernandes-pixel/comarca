-- Remove a constraint unique(user_id) adicionada erroneamente na 0006.
-- user_id em advogados = dono do escritório (auth.uid()), não o advogado individual.
-- Múltiplos advogados por escritório é o comportamento correto.
alter table public.advogados drop constraint if exists advogados_user_id_key;
