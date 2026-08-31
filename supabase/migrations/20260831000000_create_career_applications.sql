create table if not exists public.career_applications (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  ontario_tech_email text not null,
  student_id text not null,
  year_of_study text not null,
  program_of_study text not null,
  ideas text,
  created_at timestamptz not null default now()
);

alter table public.career_applications
  add constraint career_applications_email_check
  check (ontario_tech_email ~* '^[^[:space:]@]+@ontariotechu[.]net$'),
  add constraint career_applications_student_id_check
  check (student_id ~ '^1[0-9]{8}$'),
  add constraint career_applications_ideas_length_check
  check (ideas is null or char_length(ideas) <= 2000);

alter table public.career_applications enable row level security;

revoke all on table public.career_applications from anon, authenticated;
grant insert on table public.career_applications to anon;

create policy "Anyone can submit a career application"
  on public.career_applications for insert to anon
  with check (true);
