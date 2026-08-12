-- ⚠️⚠️ このファイルは実行しないこと（2026-08-12 廃止・12_ に置き換え）⚠️⚠️
--   順序ミスがあった: profiles.plan と user_credits を本人が書き換えられる状態のまま
--   has_review_access() を作っており、自己VIP化・自己クレジット付与で素通りされる。
--   実際に本番を調べたところ user_credits_no_direct_write は PERMISSIVE で
--   何も禁止しておらず、自己付与が可能だった。
--   → supabase_migrations/12_lock_privileges_and_reviews_rls.sql を使うこと。
--
-- 11_reviews_select_update_rls.sql — reviews の SELECT / UPDATE を正しい権限に締め直す
--
-- 【なぜ必要か（2026-08-12）】
-- ■ SELECT: 全件公開のポリシーが3本 PERMISSIVE で並んでおり（OR結合）、
--   anon キーで **非公開の口コミ本文まで取得できる**状態だった。
--   現在は全16件が is_public=true のため実害は出ていないが、
--   `06_p0_review_growth.sql` の設計上 **is_public の既定値は false** で、
--   公開されるのは各セラピストの1件目だけ。
--   ＝**2件目が投稿された瞬間に非公開行が生まれ、そのまま漏れる**。
--   非公開行が0件の今こそ、壊れるものが無い状態で締められる。
--
-- ■ UPDATE: reviews_no_anon_update は `auth.role() = 'authenticated'` のみで
--   **所有者条件が無い**。ログインさえしていれば他人の口コミを書き換えられた。
--   WITH CHECK も無いため、書き換え後の値の検証もされていなかった。
--
-- 【アプリ側の読み取り経路と、それぞれどのポリシーで通るか】
--   ・SSR（店舗/セラピストページ・サイトマップ・retention-email）= service role ＝ RLS非対象
--   ・DataContext / ShopDetailPage / ThreadDetailPage / PopularReviewsPage / SearchPage
--       = anon キー → reviews_public_read（公開分のみ）
--   ・AdminPage（anonキーで全件取得）→ reviews_admin_read
--   ・W2R で閲覧権を得た人・VIP → reviews_entitled_read
--   ・自分が書いた非公開の口コミ → reviews_own_read
--
-- 【前提】クライアントからの reviews への UPDATE は存在しない（grepで確認済み）。
--        DELETE は AdminPage のみで、reviews_admin_delete が担当。
--        view_count の加算は /api/track-view が service role で行うため RLS 非対象。

-- ── 権限判定ヘルパー ──────────────────────────────────────────
-- user_credits / profiles 自体にも RLS があるため、ポリシーから直接参照すると
-- 権限の入れ子で不安定になる。SECURITY DEFINER の関数に閉じ込めて回避する。
CREATE OR REPLACE FUNCTION public.has_review_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.user_credits uc
      WHERE uc.user_id = auth.uid()
        AND uc.expires_at IS NOT NULL
        AND uc.expires_at > now()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.plan IN ('premium', 'vip')
    );
$$;

REVOKE ALL ON FUNCTION public.has_review_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_review_access() TO authenticated;

-- ── SELECT: 全件公開の3本を撤去 ───────────────────────────────
DROP POLICY IF EXISTS "Allow public read" ON public.reviews;
DROP POLICY IF EXISTS "Reviews are viewable by everyone." ON public.reviews;
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;

-- 公開分のみ誰でも読める
-- （owner_manual を含めるのは、SSR側が .or('is_public.eq.true,user_id.eq.owner_manual')
--   で取得しており、運営投稿は公開扱いという前提がアプリ全体に入っているため）
CREATE POLICY "reviews_public_read"
  ON public.reviews FOR SELECT
  USING (is_public = true OR user_id = 'owner_manual');

-- 自分が書いた口コミは非公開でも読める
CREATE POLICY "reviews_own_read"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- W2Rで閲覧権を得た人・VIP は非公開分も読める（＝ペイウォールをDB側で担保する）
CREATE POLICY "reviews_entitled_read"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (public.has_review_access());

-- 管理者は全件読める（AdminPage が anon キーで全件取得しているため必須）
CREATE POLICY "reviews_admin_read"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'email' IN ('tugihe1112@gmail.com'));

-- ── UPDATE: 所有者限定に作り直す ──────────────────────────────
DROP POLICY IF EXISTS "reviews_no_anon_update" ON public.reviews;
CREATE POLICY "reviews_owner_update"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ── 確認 ─────────────────────────────────────────────────────
-- 期待値:
--   SELECT … reviews_public_read / reviews_own_read / reviews_entitled_read / reviews_admin_read
--   INSERT … reviews_authenticated_insert のみ
--   UPDATE … reviews_owner_update のみ（所有者条件あり）
--   DELETE … reviews_admin_delete のみ
SELECT cmd, policyname, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'reviews'
ORDER BY cmd, policyname;
