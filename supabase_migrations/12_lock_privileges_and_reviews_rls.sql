-- 12_lock_privileges_and_reviews_rls.sql
-- 権限の参照元（profiles.plan / user_credits）を閉じ、reviews の列とRLSを締め直す
--
-- ⚠️ 11_reviews_select_update_rls.sql は**適用せずにこれで置き換える**。
--    11は「権限の参照元が開いたまま has_review_access() を作る」順序ミスがあった。
--    profiles.plan と user_credits を本人が書き換えられる状態では、
--    どんな閲覧ポリシーを作っても自己VIP化・自己クレジット付与で素通りされる。
--
-- 【本番の実測（2026-08-12）でわかった前提】
--  ・user_credits_no_direct_write は **PERMISSIVE** だった。
--    PERMISSIVE は OR 結合なので `false OR (auth.uid()=user_id)` となり、
--    「直接書き込み禁止」という名前に反して**何も禁止していなかった**
--    ＝ログインユーザーは自分の credits を好きなだけ付与できた。
--  ・profiles の UPDATE は `USING (auth.uid() = id)` のみで **WITH CHECK が無い**
--    ＝自分の plan を 'vip' に書き換えられた。
--  ・reviews は is_public(default false)/view_count/like_count/badge_count/created_at を
--    クライアントが INSERT 時に自由指定できた（RLSは行の制限であって列の制限ではない）。
--  ・クライアントから profiles / user_credits / reviews への UPDATE は存在しない（grep確認済み）。
--    profiles は AuthContext が SELECT するだけ。
--
-- 実行は1トランザクション。途中で失敗したら全部巻き戻る。
BEGIN;

-- ══════════════════════════════════════════════════════════════
-- ① user_credits — 自己付与を完全に塞ぐ（付与は service role の管理APIのみ）
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "insert自分のみ"            ON public.user_credits;
DROP POLICY IF EXISTS "自分のクレジットのみ更新"   ON public.user_credits;
DROP POLICY IF EXISTS "自分のクレジットのみ閲覧"   ON public.user_credits;
DROP POLICY IF EXISTS "user_credits_no_direct_write" ON public.user_credits;
DROP POLICY IF EXISTS "user_credits_read_own"     ON public.user_credits;

-- 読むのは自分の分だけ（残高表示に必要）
CREATE POLICY "user_credits_read_own"
  ON public.user_credits FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 書き込みはポリシーを一切作らない＝ RLS 有効下では anon/authenticated から書けない。
-- 付与は api/admin-grant-credit.js（service role・管理者メール検証済み）が行う。
-- テーブル権限そのものも落としておく（RLSと二重の壁にする）
REVOKE INSERT, UPDATE, DELETE ON public.user_credits FROM anon, authenticated;

-- ══════════════════════════════════════════════════════════════
-- ② profiles — 自己VIP化を塞ぐ
-- ══════════════════════════════════════════════════════════════
-- クライアントからの profiles 更新は存在しないので、UPDATE 自体を許可しない。
-- plan は handle_new_user（DB側）と管理APIだけが決める。
DROP POLICY IF EXISTS "自分だけが更新できる" ON public.profiles;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;

-- 「プロフィールは誰でも見れる」(SELECT USING true) は、email 列が入っているため
-- メールアドレスが全公開になる。自分の分だけに絞る。
DROP POLICY IF EXISTS "プロフィールは誰でも見れる" ON public.profiles;
CREATE POLICY "profiles_read_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- ══════════════════════════════════════════════════════════════
-- ③ reviews INSERT — 列単位で締める（RLSでは列を守れないため）
-- ══════════════════════════════════════════════════════════════
-- is_public / view_count / like_count / badge_count / last_notified_views /
-- created_at はDB側（default とトリガー）だけが決める。
-- クライアントが指定できる列だけを列挙して GRANT する。
REVOKE INSERT ON public.reviews FROM anon, authenticated;
GRANT INSERT (
  id, shop_id, shop_name, therapist_id, therapist_name,
  user_id, user_name, rating, course, detailed_ratings, tags, content
) ON public.reviews TO authenticated;

-- ══════════════════════════════════════════════════════════════
-- ④ 閲覧権の判定ヘルパー（非公開スキーマ・SECURITY DEFINER）
-- ══════════════════════════════════════════════════════════════
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.has_review_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.user_credits uc
      WHERE uc.user_id = (SELECT auth.uid())
        AND uc.expires_at IS NOT NULL
        AND uc.expires_at > now()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.plan IN ('premium', 'vip')
    );
$$;

REVOKE ALL ON FUNCTION private.has_review_access() FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_review_access() TO authenticated;

-- ══════════════════════════════════════════════════════════════
-- ⑤ reviews SELECT — 全件公開3本を撤去し、権限別に分ける
-- ══════════════════════════════════════════════════════════════
-- ⚠️ 現在 reviews は16件すべて is_public=true・非公開0件なので、
--    いま締めても表示上の変化は起きない（＝壊れるものが無い今が好機）。
--    ただし is_public の既定は false で、公開されるのは各セラピストの1件目のみ。
--    2件目が投稿された瞬間に非公開行が生まれるため、先に締めておく。
DROP POLICY IF EXISTS "Allow public read"                ON public.reviews;
DROP POLICY IF EXISTS "Reviews are viewable by everyone." ON public.reviews;
DROP POLICY IF EXISTS "reviews_public_read"               ON public.reviews;

-- 公開分のみ誰でも読める
-- （owner_manual 例外は付けない。運営投稿も is_public で管理する＝
--   後から非公開に戻したときに公開され続ける穴を作らない）
CREATE POLICY "reviews_public_read"
  ON public.reviews FOR SELECT
  USING (is_public = true);

-- 自分が書いた口コミは非公開でも読める
CREATE POLICY "reviews_own_read"
  ON public.reviews FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

-- W2Rで閲覧権を得た人・VIP は非公開分も読める（ペイウォールをDB側で担保）
CREATE POLICY "reviews_entitled_read"
  ON public.reviews FOR SELECT
  TO authenticated
  USING ((SELECT private.has_review_access()));

-- 管理者は全件読める
-- ⚠️ AdminPage が anon キー固定でRESTを叩いている間はこのポリシーは発火しない。
--    AdminPage をユーザーJWT送信に直すまで、管理画面では公開分しか見えない。
CREATE POLICY "reviews_admin_read"
  ON public.reviews FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'tugihe1112@gmail.com');

-- ══════════════════════════════════════════════════════════════
-- ⑥ reviews UPDATE — 他人の口コミ改竄を塞ぐ
-- ══════════════════════════════════════════════════════════════
-- 旧 reviews_no_anon_update は `auth.role() = 'authenticated'` のみで所有者条件が無く、
-- ログインしていれば誰の口コミでも書き換えられた。
-- クライアントからの UPDATE は存在しないので、権限ごと落とす。
-- （view_count の加算は /api/track-view が service role で行うため影響なし）
DROP POLICY IF EXISTS "reviews_no_anon_update" ON public.reviews;
REVOKE UPDATE ON public.reviews FROM anon, authenticated;

COMMIT;

-- ══════════════════════════════════════════════════════════════
-- 確認クエリ（COMMIT後に別途実行）
-- ══════════════════════════════════════════════════════════════
-- SELECT tablename, policyname, cmd, permissive,
--        array_to_string(roles,',') AS roles, qual, with_check
-- FROM pg_policies
-- WHERE schemaname='public' AND tablename IN ('reviews','profiles','user_credits')
-- ORDER BY tablename, cmd, policyname;
--
-- 期待値:
--   reviews  SELECT … public_read / own_read / entitled_read / admin_read
--   reviews  INSERT … reviews_authenticated_insert のみ
--   reviews  UPDATE … 0本（権限ごと剥奪）
--   reviews  DELETE … reviews_admin_delete のみ
--   profiles SELECT … profiles_read_own のみ／UPDATE 0本
--   user_credits SELECT … user_credits_read_own のみ／書き込み 0本
