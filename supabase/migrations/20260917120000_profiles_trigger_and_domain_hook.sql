-- 1. Keep public.profiles in step with auth.users.
--    Password signups send no name at all; Google sends 'full_name' and 'name'.
--    Falls back to the email local part so the admin roster never shows a blank.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(profiles.full_name, ''), excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill anyone who signed up before the trigger existed. Never overwrites
-- a name that is already set.
insert into public.profiles (id, email, full_name)
select
  u.id,
  u.email,
  coalesce(
    nullif(u.raw_user_meta_data->>'full_name', ''),
    nullif(u.raw_user_meta_data->>'name', ''),
    split_part(coalesce(u.email, ''), '@', 1)
  )
from auth.users u
on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(nullif(profiles.full_name, ''), excluded.full_name);

-- 2. Only @ontariotechu.net accounts may be created, whatever the provider.
--    Runs as Supabase's Before User Created hook — enable it in the dashboard
--    (Authentication -> Hooks -> Before User Created -> Postgres) or it does nothing.
--    Add club/service accounts to the exceptions array below.
create or replace function public.hook_restrict_signup_by_email_domain(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  allowed_domain constant text := 'ontariotechu.net';
  exceptions constant text[] := array[]::text[];  -- e.g. array['csclub@gmail.com']
  address text := lower(coalesce(event->'user'->>'email', ''));
begin
  if address = any (exceptions) or address like '%@' || allowed_domain then
    return event;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Use your Ontario Tech email (@ontariotechu.net) to sign up.'
    )
  );
end;
$$;

grant execute on function public.hook_restrict_signup_by_email_domain to supabase_auth_admin;
revoke execute on function public.hook_restrict_signup_by_email_domain from authenticated, anon, public;
