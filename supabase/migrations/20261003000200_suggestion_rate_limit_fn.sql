-- Atomic rate-limit check-and-insert for suggestions, using advisory locks.
-- SECURITY DEFINER allows the function to use the tables without RLS.
create or replace function public.submit_suggestion(
  p_ip_hash   text,
  p_category  text,
  p_message   text,
  p_name      text default null,
  p_email     text default null
)
returns table (
  status text,
  id     uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window_count  int;
  v_day_count     int;
  v_new_id        uuid;
begin
  -- Advisory lock on the hashed IP to serialize submissions from the same source.
  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));

  -- Count submissions in the last 10 minutes (max 3).
  select count(*) into v_window_count
  from public.suggestion_rate_limits
  where ip_hash = p_ip_hash
    and created_at > now() - interval '10 minutes';

  if v_window_count >= 3 then
    return query select 'rate_limited'::text as status, null::uuid as id;
    return;
  end if;

  -- Count submissions in the last 24 hours (max 10).
  select count(*) into v_day_count
  from public.suggestion_rate_limits
  where ip_hash = p_ip_hash
    and created_at > now() - interval '24 hours';

  if v_day_count >= 10 then
    return query select 'rate_limited'::text as status, null::uuid as id;
    return;
  end if;

  -- Record the rate limit attempt.
  insert into public.suggestion_rate_limits (ip_hash) values (p_ip_hash);

  -- Insert the suggestion.
  insert into public.suggestions (category, message, name, email)
  values (p_category, p_message, p_name, p_email)
  returning suggestions.id into v_new_id;

  return query select 'ok'::text as status, v_new_id as id;
end;
$$;

-- Revoke from public, anon, and authenticated. Only service_role can call this.
revoke all on function public.submit_suggestion(text, text, text, text, text) from public;
revoke all on function public.submit_suggestion(text, text, text, text, text) from anon;
revoke all on function public.submit_suggestion(text, text, text, text, text) from authenticated;
grant execute on function public.submit_suggestion(text, text, text, text, text) to service_role;
