-- Public file bucket for the landing hero recap. This is Storage, not a table.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hero',
  'hero',
  true,
  314572800,
  array['video/mp4']::text[]
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read hero recap" on storage.objects;
create policy "Public read hero recap"
on storage.objects
for select
to public
using (bucket_id = 'hero');
