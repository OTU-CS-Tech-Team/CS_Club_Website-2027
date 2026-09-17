-- The landing page's "sign up for our mailing list" button, now wired for
-- real (double opt-in for guests; immediate for signed-in members, since
-- they already own that email). All reads/writes go through the
-- service-role client (src/app/mailing-list/actions.ts) — RLS stays fully
-- locked, same posture as passport_stamps/redemptions.
create table if not exists mailing_list_subscribers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

-- defensive: this table already existed on the shared dev project from
-- manual SQL before this migration was written (integer id, a mis-cased
-- "created_At" column) — create table if not exists silently no-ops
-- against that, so make sure the columns this app actually depends on
-- exist regardless of whatever shape got here first.
alter table mailing_list_subscribers add column if not exists name text;
alter table mailing_list_subscribers add column if not exists email text;
alter table mailing_list_subscribers add column if not exists confirmed boolean not null default false;
alter table mailing_list_subscribers add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'mailing_list_subscribers'::regclass and contype = 'u'
  ) then
    alter table mailing_list_subscribers add constraint mailing_list_subscribers_email_key unique (email);
  end if;
end $$;

alter table mailing_list_subscribers enable row level security;

-- no policies: nothing here is ever touched by the anon/authenticated
-- client directly, only the service role after the app's own checks
drop policy if exists "anyone can subscribe" on mailing_list_subscribers;
