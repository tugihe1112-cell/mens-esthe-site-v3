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
-- ⓪ テーブル権限を一度まっさらにしてから必要分だけ付け直す
-- ══════════════════════════════════════════════════════════════
-- Supabase の既定では anon / authenticated に ALL（SELECT/INSERT/UPDATE/DELETE に加えて
-- TRUNCATE / TRIGGER / REFERENCES まで）が付いている。
-- 個別に REVOKE すると付け忘れが残るため、ALL を落としてから最小限を再付与する。
-- ⚠️ service_role には触らない（SSR・サイトマップ・管理API・トリガーが依存している）。
-- ⚠️ RLS は SELECT/INSERT/UPDATE/DELETE の**行**を制御するだけで、
--    TRUNCATE / REFERENCES / TRIGGER といったテーブル全体の操作は保護しない。
--    ポリシーを足すだけでは不十分で、テーブル権限そのものを落とす必要がある。
REVOKE ALL ON public.reviews      FROM anon, authenticated;
REVOKE ALL ON public.user_credits FROM anon, authenticated;
REVOKE ALL ON public.profiles     FROM anon, authenticated;
REVOKE ALL ON public.shops        FROM anon, authenticated;

-- 読み取りは必要なロールに許可（実際に何行返るかは下のRLSが決める）
GRANT SELECT ON public.reviews      TO anon, authenticated;
GRANT SELECT ON public.shops        TO anon, authenticated;
GRANT SELECT ON public.user_credits TO authenticated;
GRANT SELECT ON public.profiles     TO authenticated;

-- 口コミの削除は管理者のみ（RLS reviews_admin_delete で本人確認）
GRANT DELETE ON public.reviews TO authenticated;
-- 店舗の編集・削除も管理者のみ（RLS shops_admin_update / shops_admin_delete で本人確認）
GRANT UPDATE, DELETE ON public.shops TO authenticated;
-- ⚠️ anon には書き込み権限を一切戻さない。
-- INSERT（reviews）は ③ で列単位に付与する。reviews の UPDATE はどのロールにも付けない。

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

-- 管理者は全件読める（/admin の付与済みクレジット一覧に必要）。
-- ⚠️ これが無いと、AdminPage をJWT化しても管理者は**自分の分しか見えない**。
CREATE POLICY "user_credits_admin_read"
  ON public.user_credits FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'tugihe1112@gmail.com');

-- 書き込みはポリシーを一切作らない＝ RLS 有効下では anon/authenticated から書けない。
-- 付与は api/admin-grant-credit.js（service role・管理者メール検証済み）が行う。
-- テーブル権限そのものも落としておく（RLSと二重の壁にする）
-- （テーブル権限は冒頭⓪で REVOKE ALL 済み。ここではポリシーのみ扱う）

-- ══════════════════════════════════════════════════════════════
-- ② profiles — 自己VIP化を塞ぐ
-- ══════════════════════════════════════════════════════════════
-- クライアントからの profiles 更新は存在しないので、UPDATE 自体を許可しない。
-- plan は handle_new_user（DB側）と管理APIだけが決める。
DROP POLICY IF EXISTS "自分だけが更新できる" ON public.profiles;
-- （テーブル権限は冒頭⓪で REVOKE ALL 済み）

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
-- INSERT は冒頭⓪で剥奪済み。ここで許可列だけ付け直す。
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
-- ⚠️ 前提: クライアントがユーザーJWTを送っていること。anonキー固定だと PostgREST 上は
--    常に anon ロール扱いになり、この `TO authenticated` ポリシーは発火しない。
--    そのため AdminPage / ShopDetailPage / ThreadDetailPage / ModernReviewCard /
--    PopularReviewsPage を `src/utils/supabaseRest.js` の authHeaders() 経由に統一済み
--    （2026-08-12・このマイグレーションと同じリリース）。
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
-- UPDATE 権限は冒頭⓪で剥奪済み・再付与しない

-- ══════════════════════════════════════════════════════════════
-- ⑥-2 shops — 管理者の編集・削除を有効にする
-- ══════════════════════════════════════════════════════════════
-- shops には shops_public_read（SELECT USING true）しか無く、書き込みポリシーが存在しない。
-- つまり /admin の店舗編集・削除は **JWTを付けても対象行0件**で何も起きていなかった
-- （しかもレスポンスを見ていなかったため成功に見えていた）。
-- ⚠️ PostgREST は RLS で対象行が0件でも 2xx を返しうるので、
--    クライアント側は `Prefer: return=representation` で**返却行が1件以上あること**を確認する。
--    （テーブル権限は冒頭⓪で REVOKE ALL → SELECT / UPDATE / DELETE のみ再付与済み）

DROP POLICY IF EXISTS "shops_admin_update" ON public.shops;
CREATE POLICY "shops_admin_update"
  ON public.shops FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'tugihe1112@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'tugihe1112@gmail.com');

DROP POLICY IF EXISTS "shops_admin_delete" ON public.shops;
CREATE POLICY "shops_admin_delete"
  ON public.shops FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'tugihe1112@gmail.com');

-- ══════════════════════════════════════════════════════════════
-- ⑦ 既存トリガー関数の是正
--   (a) search_path 未固定（Supabase Advisor の警告対象）を修正
--   (b) **手入力セラピスト（manual_*）を自動公開させない**
-- ══════════════════════════════════════════════════════════════
-- ⚠️ (b) が本質。現在の set_first_review_public() は「店舗＋therapist_name の1件目」なら
--    無条件に is_public=true にする。手入力名は本人確認されていないため、
--    **任意のセラピスト名を審査前に公開ページへ注入できる**（名誉毀損・スパムの経路）。
--    加えて manual_* は therapists に存在しないので、公開された瞬間に
--    ホーム・人気口コミ・関連リンクが **404 のセラピストページへリンク**を作る
--    （これらは全て is_public で絞っているため、公開させなければ発生しない）。
--    → 判定を therapist_name ではなく「公式 therapists 行が存在するか」で行う。
-- ⚠️ 当初 `therapists.id = NEW.therapist_id` の存在確認だけにしていたが**穴があった**。
--    認証ユーザーがRESTを直接叩き「店舗Aの shop_id ＋ 店舗Bに実在する therapist_id ＋
--    任意の架空 therapist_name」を送ると存在確認を通過し、店舗A＋架空名の初回口コミとして
--    自動公開できてしまう。所属店舗まで照合し、名前はクライアントを信用せずDB側で上書きする。
CREATE OR REPLACE FUNCTION public.set_first_review_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  official_name text;
BEGIN
  -- 既定は必ず非公開。条件を満たしたときだけ公開に倒す（fail-safe）
  NEW.is_public := false;

  IF NEW.therapist_id IS NULL OR NEW.shop_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- ① 正式な所属を確認（同じ店舗に、そのIDのセラピストが実在するか）
  SELECT t.name INTO official_name
  FROM public.therapists t
  WHERE t.id = NEW.therapist_id
    AND t.shop_id = NEW.shop_id
  LIMIT 1;

  IF official_name IS NULL THEN
    -- manual_*（手入力）・指名なし・別店舗のID・存在しないIDは公開しない
    RETURN NEW;
  END IF;

  -- ② 名前はクライアントの申告を信用せず、DBの正式名で上書きする
  NEW.therapist_name := official_name;

  -- ③ 初回判定は therapist_name ではなく **shop_id + therapist_id** で行う
  --    （名前ベースだと同名別人・表記揺れ・名前改変で判定を騙せる）
  IF NOT EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.shop_id = NEW.shop_id
      AND r.therapist_id = NEW.therapist_id
  ) THEN
    NEW.is_public := true;
  END IF;

  RETURN NEW;
END;
$$;

-- credits 付与トリガーも search_path を固定し完全修飾する（挙動は変更しない）
CREATE OR REPLACE FUNCTION public.auto_grant_credits_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  len integer := length(coalesce(NEW.content, ''));
  days_to_add integer := 0;
BEGIN
  -- user_id がUUID形式（実ユーザー）のみ対象
  IF NEW.user_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    IF len >= 700 THEN
      days_to_add := 7;
    ELSIF len >= 200 THEN
      days_to_add := 3;
    END IF;

    IF days_to_add > 0 THEN
      INSERT INTO public.user_credits (user_id, credits_days, expires_at, total_reviews_posted, updated_at)
      VALUES (NEW.user_id::uuid, days_to_add, now() + (days_to_add || ' days')::interval, 1, now())
      ON CONFLICT (user_id) DO UPDATE SET
        credits_days = public.user_credits.credits_days + days_to_add,
        expires_at = greatest(coalesce(public.user_credits.expires_at, now()), now()) + (days_to_add || ' days')::interval,
        total_reviews_posted = public.user_credits.total_reviews_posted + 1,
        updated_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- トリガー経由でのみ発火させる（直接呼び出しを塞ぐ）
REVOKE EXECUTE ON FUNCTION public.set_first_review_public()      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_grant_credits_on_review() FROM PUBLIC, anon, authenticated;

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
