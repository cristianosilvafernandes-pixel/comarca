-- Foto do advogado (avatar) na equipe

-- 1. Coluna na tabela advogados
alter table public.advogados
  add column if not exists foto_url text;

-- 2. Bucket público para avatares (2 MB, apenas imagens)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatares', 'avatares', true, 2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- 3. RLS no storage.objects para o bucket avatares
--    (pasta = auth.uid(), igual ao bucket logos)
create policy "avatares_select_public" on storage.objects
  for select using (bucket_id = 'avatares');

create policy "avatares_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "avatares_update_own" on storage.objects
  for update using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "avatares_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
