-- Logo do escritório no perfil do advogado

-- 1. Coluna na tabela profiles
alter table public.profiles
  add column if not exists logo_url text;

-- 2. Bucket público para logos (1 MB, apenas imagens)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos', 'logos', true, 1048576,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- 3. RLS no storage.objects para o bucket logos
create policy "logos_select_public" on storage.objects
  for select using (bucket_id = 'logos');

create policy "logos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "logos_update_own" on storage.objects
  for update using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "logos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
