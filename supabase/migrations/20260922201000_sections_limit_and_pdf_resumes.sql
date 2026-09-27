do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'jobs'
      and column_name = 'sections'
  ) then
    alter table public.jobs drop constraint if exists jobs_sections_is_array;
    alter table public.jobs
      add constraint jobs_sections_is_array
      check (jsonb_typeof(sections) = 'array' and jsonb_array_length(sections) <= 23);
  end if;
end $$;

update storage.buckets
set allowed_mime_types = array['application/pdf']::text[]
where id = 'resumes';
