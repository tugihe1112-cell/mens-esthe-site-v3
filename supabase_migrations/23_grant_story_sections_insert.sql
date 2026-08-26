-- 23_grant_story_sections_insert.sql
--
-- 【事故】2026-08-26、オーナーが口コミを投稿しようとして失敗。
--   画面には「ログインの有効期限が切れている可能性があります」と出たが、
--   **セッションは有効だった**（localStorageの expires_at は当日22:16・投稿は21:33）。
--
-- 【真因】列単位の INSERT 権限に `story_sections` が入っていない。
--   12_lock_privileges_and_reviews_rls.sql で
--     GRANT INSERT (id, shop_id, shop_name, therapist_id, therapist_name,
--                   user_id, user_name, rating, course, detailed_ratings, tags, content)
--   と**許可列を列挙**したが、14_review_story_sections.sql は
--   列の追加・CHECK制約・トリガーだけを行い **GRANT を更新しなかった**。
--   その結果 `permission denied for column story_sections` が発生し、
--   SQLSTATE が RLS違反と同じ **42501** なので、アプリ側が
--   「セッション切れ」と誤って案内していた。
--
-- 【影響】口コミ投稿が **2026-08-22（14_の適用日）から完全に不可能**だった。
--   W2R（書けば読める）の唯一の入口なので、サイトの根幹が4日間止まっていた。
--
-- 【なぜテストで見つからなかったか】14_ のE2Eは service_role で実行しており、
--   service_role は列単位の GRANT を迂回する。**一般ユーザーの権限で試していなかった**。
--
-- ⚠️ 今後 reviews に列を足すときは、クライアントが値を入れる列なら
--    必ずこの GRANT を同時に更新すること。
--    `scripts/ci/check_review_insert_columns.mjs` が
--    アプリのINSERT列と許可列の食い違いを検出してビルドを止める。

BEGIN;

GRANT INSERT (story_sections) ON public.reviews TO authenticated;

-- ── 自己検証：許可列がアプリの送信列と一致していなければ COMMIT させない ──
-- ⚠️ `GRANT` は存在しない列を指定するとエラーになるが、
--    「足りない」ことは静かに成功するので、ここで明示的に確認する。
DO $$
DECLARE
  granted text[];
  required text[] := ARRAY[
    'id','shop_id','shop_name','therapist_id','therapist_name',
    'user_id','user_name','rating','course','detailed_ratings','tags','content',
    'story_sections'
  ];
  missing text[];
BEGIN
  SELECT array_agg(column_name ORDER BY column_name)
    INTO granted
    FROM information_schema.column_privileges
   WHERE table_schema = 'public'
     AND table_name   = 'reviews'
     AND grantee      = 'authenticated'
     AND privilege_type = 'INSERT';

  SELECT array_agg(c) INTO missing
    FROM unnest(required) AS c
   WHERE c <> ALL (coalesce(granted, ARRAY[]::text[]));

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'reviews への INSERT 許可列が不足しています: %', missing;
  END IF;
END $$;

COMMIT;
