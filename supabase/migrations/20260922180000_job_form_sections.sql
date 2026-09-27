alter table public.jobs
  add column if not exists sections jsonb not null default '[{"kind":"description"}]'::jsonb;

alter table public.jobs
  drop constraint if exists jobs_sections_is_array;

alter table public.jobs
  add constraint jobs_sections_is_array
  check (jsonb_typeof(sections) = 'array' and jsonb_array_length(sections) <= 23);

alter table public.career_applications
  add column if not exists answers jsonb;
