-- 公開API（新規登録・お問い合わせ）のDB-backedレート制限。
-- サーバーレス関数のインメモリMapはインスタンスごとに分断されるため使用しない。

begin;

create table if not exists public.api_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default pg_catalog.now(),
  hits integer not null default 0,
  updated_at timestamptz not null default pg_catalog.now(),
  constraint api_rate_limits_key_length check (
    pg_catalog.char_length(rate_key) between 16 and 200
  ),
  constraint api_rate_limits_hits_nonnegative check (hits >= 0)
);

alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from public, anon, authenticated;

create index if not exists api_rate_limits_updated_at_idx
  on public.api_rate_limits (updated_at);

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

  -- 競合時も1行ロック下のUPSERTで加算と判定を同時に行う。
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

  return pg_catalog.coalesce(v_allowed, false);
end;
$function$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer)
  to service_role;

comment on table public.api_rate_limits is
  'HMAC化した公開API主体ごとの固定窓レート制限。生のIP・メールは保存しない。';
comment on function public.consume_api_rate_limit(text, integer, integer) is
  'service_role専用。固定窓の加算と許可判定を原子的に実行する。';

-- 適用時の自己検証。RLSや実行権限が意図から外れていればCOMMITしない。
do $verify$
begin
  if not exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'api_rate_limits'
      and c.relrowsecurity
  ) then
    raise exception 'api_rate_limits RLS verification failed';
  end if;

  if pg_catalog.has_function_privilege(
    'anon',
    'public.consume_api_rate_limit(text,integer,integer)',
    'EXECUTE'
  ) or pg_catalog.has_function_privilege(
    'authenticated',
    'public.consume_api_rate_limit(text,integer,integer)',
    'EXECUTE'
  ) then
    raise exception 'consume_api_rate_limit is exposed to client roles';
  end if;

  if not pg_catalog.has_function_privilege(
    'service_role',
    'public.consume_api_rate_limit(text,integer,integer)',
    'EXECUTE'
  ) then
    raise exception 'consume_api_rate_limit is unavailable to service_role';
  end if;

end;
$verify$;

commit;
