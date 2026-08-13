-- 13_harden_auth_functions_and_review_content.sql
-- 12_ の残件を片付ける:
--   ① handle_new_user の master@% VIP自動付与を廃止
--   ② profiles_id_fkey を ON DELETE CASCADE 化
--   ③ ban済み master@mens-esthe.jp を完全削除
--   ④ 残りの SECURITY DEFINER 関数の search_path 固定と直接EXECUTE剥奪
--   ⑤ reviews.content の最低文字数をDB側で担保（UIのZod検証しか無かった）
--
-- 【前提（2026-08-13 の本番E2Eで確定）】
--  ・12_ は適用済み（migration名 lock_privileges_and_reviews_rls_sha_7105047 / version 20260813102327）
--  ・Security Advisor は ERROR 0 / WARN 6。この 13_ で Leaked Password Protection 以外の5件が消える想定
--  ・reviews 16件中2件が既に200文字未満（最短31文字）＝ 通常の CHECK 制約はそのまま追加できない
--
-- 実行は1トランザクション。途中で失敗したら全部巻き戻る。
BEGIN;

-- ══════════════════════════════════════════════════════════════
-- ① handle_new_user — メール形式によるVIP自動付与を廃止
-- ══════════════════════════════════════════════════════════════
-- ⚠️ 旧定義は `when new.email like 'master@%' then 'vip'` で、
--    **master@ で始まるアドレスなら任意のドメインで登録するだけでVIP**になった。
--    管理者権限ではなく閲覧権（有料相当のタダ読み）だが、課金モデルの穴。
--    ユーザー3人に不審な登録は無く未悪用は確認済み。
--    権限はメールアドレスの形ではなく、専用テーブルか app_metadata で管理すべき。
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan)
  VALUES (new.id, new.email, 'free');
  RETURN new;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ══════════════════════════════════════════════════════════════
-- ② profiles_id_fkey を ON DELETE CASCADE に
-- ══════════════════════════════════════════════════════════════
-- ⚠️ ON DELETE 未指定＝NO ACTION だったため、profiles 行が残っている限り
--    auth.users の削除が拒否される。2026-08-12 に管理者仮アカウントを
--    ダッシュボードから削除しようとして `Failed to delete selected users: {}`
--    になった原因がこれ。
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ══════════════════════════════════════════════════════════════
-- ③ ban済みの仮アカウントを完全削除
-- ══════════════════════════════════════════════════════════════
-- ⚠️ 誤って生きているアカウントを消さないよう、**banned_until を必ず確認**してから削除する。
--    このアカウントは 2026-08-12 に banned_until='infinity' 済み・セッション0件。
DO $$
DECLARE
  target_id uuid;
BEGIN
  SELECT id INTO target_id
  FROM auth.users
  WHERE email = 'master@mens-esthe.jp'
    AND banned_until IS NOT NULL
    AND banned_until > now();

  IF target_id IS NULL THEN
    RAISE NOTICE 'master@mens-esthe.jp は存在しないか ban されていないためスキップします';
  ELSE
    DELETE FROM auth.users WHERE id = target_id;  -- profiles は①のCASCADEで消える
    RAISE NOTICE 'master@mens-esthe.jp を削除しました (%)', target_id;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- ④ 残りの SECURITY DEFINER 関数の search_path 固定
-- ══════════════════════════════════════════════════════════════
-- Supabase Security Advisor の WARN 対象。search_path が可変だと
-- 同名オブジェクトを差し込まれて意図しないテーブルを触らされうる。

CREATE OR REPLACE FUNCTION public.update_post_reply_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET reply_count = coalesce(reply_count, 0) + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET reply_count = greatest(coalesce(reply_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_review_views(review_ids text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.reviews
  SET view_count = coalesce(view_count, 0) + 1
  WHERE id = ANY(review_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.ack_review_views(p_review_ids text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.reviews
  SET last_notified_views = coalesce(view_count, 0)
  WHERE id = ANY(p_review_ids);
END;
$$;

-- クライアントからの直接実行を塞ぐ。
-- increment / ack は /api/track-view と /api/cron/retention-email が service_role で呼ぶ。
REVOKE EXECUTE ON FUNCTION public.update_post_reply_count()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_review_views(text[])     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ack_review_views(text[])           FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.increment_review_views(text[])     TO service_role;
GRANT  EXECUTE ON FUNCTION public.ack_review_views(text[])           TO service_role;

-- ══════════════════════════════════════════════════════════════
-- ⑤ reviews.content の最低文字数をDB側で担保する
-- ══════════════════════════════════════════════════════════════
-- ⚠️ 現状は UI（Zod）でしか200字を検証しておらず、
--    認証ユーザーが REST を直接叩けば1文字でも保存できた。
--    W2R は「200字で3日・700字で7日」を自動付与するため、
--    ここが素通りだと**捨てアカウントで短文を量産して閲覧権を稼げる**。
-- ⚠️ 既存16件のうち2件が200字未満（最短31文字）なので、通常の CHECK は追加できない。
--    NOT VALID にすると**既存行は検査せず、新規INSERT/UPDATEにだけ適用**される。
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_content_min_length;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_content_min_length
  CHECK (char_length(btrim(content)) >= 200) NOT VALID;

-- ══════════════════════════════════════════════════════════════
-- ⑥ 自己検証 — 想定と違えばCOMMITさせない
-- ══════════════════════════════════════════════════════════════
-- ⚠️ 12_ の自己検証は「余分なポリシーの検出」しか見ておらず、
--    「**想定ポリシーの欠落**」を検出できなかった（ChatGPTの指摘）。
--    ここでは両方向を見る。
DO $$
DECLARE
  missing text;
  extra   text;
  bad_fn  text;
BEGIN
  -- (a) 想定ポリシーが欠けていないか（12_で作った18本）
  SELECT string_agg(want, ', ' ORDER BY want) INTO missing
  FROM unnest(ARRAY[
    'reviews_public_read','reviews_own_read','reviews_entitled_read','reviews_admin_read',
    'reviews_authenticated_insert','reviews_admin_delete',
    'user_credits_read_own','user_credits_admin_read',
    'profiles_read_own',
    'shops_public_read','shops_admin_update','shops_admin_delete',
    'review_likes_read_own','review_likes_own_insert','review_likes_own_delete',
    'user_badges_read_own','user_badges_own_insert','user_badges_own_delete'
  ]) AS want
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.policyname = want
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION '想定ポリシーが欠落しています: %', missing;
  END IF;

  -- (b) 余分なポリシーが残っていないか
  SELECT string_agg(tablename || '.' || policyname, ', ' ORDER BY tablename, policyname)
  INTO extra
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('reviews','user_credits','profiles','shops','review_likes','user_badges')
    AND policyname NOT IN (
      'reviews_public_read','reviews_own_read','reviews_entitled_read','reviews_admin_read',
      'reviews_authenticated_insert','reviews_admin_delete',
      'user_credits_read_own','user_credits_admin_read',
      'profiles_read_own',
      'shops_public_read','shops_admin_update','shops_admin_delete',
      'review_likes_read_own','review_likes_own_insert','review_likes_own_delete',
      'user_badges_read_own','user_badges_own_insert','user_badges_own_delete'
    );
  IF extra IS NOT NULL THEN
    RAISE EXCEPTION '想定外のポリシーが残っています: %', extra;
  END IF;

  -- (c) SECURITY DEFINER 関数の search_path が全て固定されているか
  SELECT string_agg(p.proname, ', ' ORDER BY p.proname) INTO bad_fn
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname IN ('public','private')
    AND p.prosecdef                                   -- SECURITY DEFINER
    AND (p.proconfig IS NULL OR NOT EXISTS (
      SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'
    ));
  IF bad_fn IS NOT NULL THEN
    RAISE EXCEPTION 'search_path が固定されていない SECURITY DEFINER 関数があります: %', bad_fn;
  END IF;
END $$;

COMMIT;

-- ══════════════════════════════════════════════════════════════
-- 適用後の確認（COMMIT後に別途実行）
-- ══════════════════════════════════════════════════════════════
-- SELECT proname, prosecdef, proconfig FROM pg_proc p
--   JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE n.nspname IN ('public','private') AND p.prosecdef ORDER BY proname;
-- SELECT email FROM auth.users;                       -- master@mens-esthe.jp が消えていること
-- SELECT conname, convalidated FROM pg_constraint
--  WHERE conrelid = 'public.reviews'::regclass AND conname = 'reviews_content_min_length';
--   → convalidated = false（NOT VALID）でOK。新規行にだけ効く。
