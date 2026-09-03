-- Keep admin authorization independent from admin_users RLS evaluation.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

drop policy if exists "dashboard_admins_create_events" on public.events;
drop policy if exists "dashboard_admins_update_events" on public.events;
drop policy if exists "dashboard_admins_delete_events" on public.events;
drop policy if exists "dashboard_admins_read_all_jobs" on public.jobs;
drop policy if exists "dashboard_admins_create_jobs" on public.jobs;
drop policy if exists "dashboard_admins_update_jobs" on public.jobs;
drop policy if exists "dashboard_admins_delete_jobs" on public.jobs;

create policy "dashboard_admins_create_events"
  on public.events for insert to authenticated
  with check ((select public.is_admin()));

create policy "dashboard_admins_update_events"
  on public.events for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "dashboard_admins_delete_events"
  on public.events for delete to authenticated
  using ((select public.is_admin()));

create policy "dashboard_admins_read_all_jobs"
  on public.jobs for select to authenticated
  using ((select public.is_admin()));

create policy "dashboard_admins_create_jobs"
  on public.jobs for insert to authenticated
  with check ((select public.is_admin()));

create policy "dashboard_admins_update_jobs"
  on public.jobs for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "dashboard_admins_delete_jobs"
  on public.jobs for delete to authenticated
  using ((select public.is_admin()));

drop trigger if exists dashboard_events_set_updated_at on public.events;
create trigger dashboard_events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists dashboard_jobs_set_updated_at on public.jobs;
create trigger dashboard_jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();
