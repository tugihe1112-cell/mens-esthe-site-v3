-- 16_の実行時修正。
-- COALESCEは特殊構文でありpg_catalog.coalesce()とは書けないため、関数本体を置換する。
-- あわせて「定義が存在する」だけだった検証を、実際の許可→拒否まで拡張する。

begin;

create or replace function public.consume_api_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_allowed boolean := false;
begin
  if p_key is null or pg_catalog.char_length(p_key) not between 16 and 200 then
    raise exception 'invalid rate-limit key';
  end if;
  if p_limit not between 1 and 1000 then
    raise exception 'invalid rate-limit limit';
  end if;
  if p_window_seconds not between 1 and 2592000 then
    raise exception 'invalid rate-limit window';
  end if;

  with consumed as (
    insert into public.api_rate_limits as limits (
      rate_key,
      window_started_at,
      hits,
      updated_at
    )
    values (p_key, v_now, 1, v_now)
    on conflict (rate_key) do update
    set
      window_started_at = case
        when limits.window_started_at <= v_now - pg_catalog.make_interval(secs => p_window_seconds)
          then v_now
        else limits.window_started_at
      end,
      hits = case
        when limits.window_started_at <= v_now - pg_catalog.make_interval(secs => p_window_seconds)
          then 1
        else limits.hits + 1
      end,
      updated_at = v_now
    returning hits <= p_limit as allowed
  )
  select allowed into v_allowed from consumed;

  return coalesce(v_allowed, false);
end;
$function$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer)
  to service_role;

do $verify$
begin
  if not public.consume_api_rate_limit(pg_catalog.repeat('0', 64), 1, 60) then
    raise exception 'consume_api_rate_limit first-call verification failed';
  end if;
  if public.consume_api_rate_limit(pg_catalog.repeat('0', 64), 1, 60) then
    raise exception 'consume_api_rate_limit limit verification failed';
  end if;
  delete from public.api_rate_limits where rate_key = pg_catalog.repeat('0', 64);
end;
$verify$;

commit;
