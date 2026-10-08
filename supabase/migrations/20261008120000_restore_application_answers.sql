-- The live database never received the answers and resume columns, so applications
-- packed both into ideas. Add the columns, then copy the packed values out.
-- The original ideas text stays in place so nothing already stored is deleted.

alter table public.jobs
  add column if not exists sections jsonb not null default '[{"kind":"description"}]'::jsonb;

alter table public.jobs
  drop constraint if exists jobs_sections_is_array;

alter table public.jobs
  add constraint jobs_sections_is_array
  check (jsonb_typeof(sections) = 'array' and jsonb_array_length(sections) <= 23);

alter table public.career_applications
  add column if not exists answers jsonb;

alter table public.career_applications
  add column if not exists resume_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  5242880,
  array['application/pdf']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
declare
  application record;
  answer_text text;
  parsed jsonb;
  resume text;
begin
  for application in
    select id, ideas, answers, resume_path
    from public.career_applications
    where ideas like '%[[answers]]%' or ideas like '%[[resume]]%'
  loop
    answer_text := substring(application.ideas from '\[\[answers\]\][[:space:]]*(\[[^\r\n]*\])');
    parsed := null;
    if answer_text is not null then
      begin
        parsed := answer_text::jsonb;
      exception when others then
        parsed := null;
      end;
    end if;
    if parsed is not null and jsonb_typeof(parsed) <> 'array' then
      parsed := null;
    end if;

    resume := substring(
      application.ideas
      from '\[\[resume\]\][[:space:]]*([a-z0-9]+(?:-[a-z0-9]+)*/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:pdf|doc|docx))'
    );

    update public.career_applications
    set
      answers = coalesce(answers, parsed),
      resume_path = coalesce(resume_path, resume)
    where id = application.id
      and (parsed is not null or resume is not null);
  end loop;
end $$;
