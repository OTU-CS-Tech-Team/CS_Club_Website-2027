-- Public "drop box" on /contact. Anonymous by default. Like
-- mailing_list_subscribers: RLS on, no policies, so only the service-role
-- client (server actions) can read or write after the app's own checks.
create table if not exists public.suggestions (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in ('event_idea','workshop','feedback','just_saying_hi','other')),
  message     text not null check (char_length(message) between 10 and 2000),
  name        text check (name is null or char_length(name) <= 120),
  email       text check (email is null or char_length(email) <= 254),
  status      text not null default 'new' check (status in ('new','read','archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists suggestions_created_at_idx on public.suggestions (created_at desc);
create index if not exists suggestions_status_idx on public.suggestions (status);

alter table public.suggestions enable row level security;
-- no policies on purpose: only service-role client can access

-- Trigger for auto-updating updated_at (reuse existing function from
-- 20260831090000_harden_admin_authorization_and_timestamps.sql)
drop trigger if exists suggestions_set_updated_at on public.suggestions;
create trigger suggestions_set_updated_at
  before update on public.suggestions
  for each row execute function public.set_updated_at();

-- Rate limiting table: stores only hashed IP addresses, not raw IPs.
-- Keeps records for 24 hours and allows opportunistic cleanup.
create table if not exists public.suggestion_rate_limits (
  id            uuid primary key default gen_random_uuid(),
  ip_hash       text not null,
  created_at    timestamptz not null default now()
);

create index if not exists suggestion_rate_limits_ip_hash_idx 
  on public.suggestion_rate_limits (ip_hash, created_at desc);

alter table public.suggestion_rate_limits enable row level security;
-- no policies: service-role only
