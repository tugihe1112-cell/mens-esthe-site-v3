-- commit 664c8d7 の本番適用後検証を履歴に固定する。

do $verify$
declare
  v_config text[];
begin
  select p.proconfig
  into v_config
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'consume_api_rate_limit'
    and pg_catalog.pg_get_function_identity_arguments(p.oid) = 'p_key text, p_limit integer, p_window_seconds integer'
    and p.prosecdef;

  if v_config is null or not ('search_path=""' = any(v_config)) then
    raise exception 'consume_api_rate_limit security configuration mismatch';
  end if;

  if pg_catalog.has_table_privilege('anon', 'public.api_rate_limits', 'SELECT')
    or pg_catalog.has_table_privilege('authenticated', 'public.api_rate_limits', 'SELECT')
    or pg_catalog.has_function_privilege(
      'anon',
      'public.consume_api_rate_limit(text,integer,integer)',
      'EXECUTE'
    )
    or pg_catalog.has_function_privilege(
      'authenticated',
      'public.consume_api_rate_limit(text,integer,integer)',
      'EXECUTE'
    ) then
    raise exception 'client role exposure detected';
  end if;

  if not pg_catalog.has_function_privilege(
    'service_role',
    'public.consume_api_rate_limit(text,integer,integer)',
    'EXECUTE'
  ) then
    raise exception 'service_role execute privilege missing';
  end if;
end;
$verify$;
