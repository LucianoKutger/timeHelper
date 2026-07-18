insert into storage.buckets (id, name, public)
values
  ('excel-templates', 'excel-templates', false),
  ('excel-workbooks', 'excel-workbooks', false),
  ('monthly-reports', 'monthly-reports', false),
  ('temporary-audio', 'temporary-audio', false)
on conflict (id) do update set public = excluded.public;

create policy "users read own storage objects"
on storage.objects for select
to authenticated
using (
  bucket_id in ('excel-templates', 'excel-workbooks', 'monthly-reports', 'temporary-audio')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users insert own storage objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('excel-templates', 'excel-workbooks', 'monthly-reports', 'temporary-audio')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users update own storage objects"
on storage.objects for update
to authenticated
using (
  bucket_id in ('excel-templates', 'excel-workbooks', 'monthly-reports', 'temporary-audio')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('excel-templates', 'excel-workbooks', 'monthly-reports', 'temporary-audio')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users delete own storage objects"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('excel-templates', 'excel-workbooks', 'monthly-reports', 'temporary-audio')
  and (storage.foldername(name))[1] = auth.uid()::text
);
