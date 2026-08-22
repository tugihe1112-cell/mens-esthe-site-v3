-- RLSを「ポリシーなしの暗黙拒否」だけに頼らず、クライアントロールを明示拒否する。
-- テーブル権限のREVOKEも16_で維持しているため二重防御になる。

begin;

drop policy if exists api_rate_limits_client_deny on public.api_rate_limits;
create policy api_rate_limits_client_deny
  on public.api_rate_limits
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

commit;
