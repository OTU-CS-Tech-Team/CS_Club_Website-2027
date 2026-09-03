create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  points integer not null default 0,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  description text,
  starts_at timestamptz,
  location text
);

alter table public.events
  add column if not exists ends_at timestamptz,
  add column if not exists images text[] not null default '{}',
  add column if not exists updated_at timestamptz not null default now();

alter table public.events alter column created_by set default auth.uid();

create table if not exists public.jobs (
  id text primary key check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 160),
  category text not null check (char_length(category) between 1 and 80),
  description text not null check (char_length(description) between 1 and 5000),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.career_applications
  add column if not exists job_id text references public.jobs(id) on delete set null;

alter table public.admin_users enable row level security;
alter table public.events enable row level security;
alter table public.jobs enable row level security;

do $$
declare
  write_policy record;
begin
  for write_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    execute format('drop policy if exists %I on public.events', write_policy.policyname);
  end loop;
end
$$;

revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.events from anon, authenticated;
revoke all on table public.jobs from anon, authenticated;

grant select on table public.admin_users to authenticated;
grant select on table public.events to anon, authenticated;
grant insert, update, delete on table public.events to authenticated;
grant select on table public.jobs to anon, authenticated;
grant insert, update, delete on table public.jobs to authenticated;

create policy "dashboard_admins_read_own_whitelist_entry"
  on public.admin_users for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "dashboard_public_reads_events"
  on public.events for select to anon, authenticated
  using (true);

create policy "dashboard_admins_create_events"
  on public.events for insert to authenticated
  with check (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

create policy "dashboard_admins_update_events"
  on public.events for update to authenticated
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

create policy "dashboard_admins_delete_events"
  on public.events for delete to authenticated
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

create policy "dashboard_public_reads_active_jobs"
  on public.jobs for select to anon, authenticated
  using (is_active);

create policy "dashboard_admins_read_all_jobs"
  on public.jobs for select to authenticated
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

create policy "dashboard_admins_create_jobs"
  on public.jobs for insert to authenticated
  with check (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

create policy "dashboard_admins_update_jobs"
  on public.jobs for update to authenticated
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

create policy "dashboard_admins_delete_jobs"
  on public.jobs for delete to authenticated
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

insert into public.jobs (id, title, category, description)
values (
  'general-member',
  'CS Club General Member',
  'Community',
  'Bring your ideas, energy, and perspective to the team behind Ontario Tech''s CS community.'
)
on conflict (id) do nothing;
