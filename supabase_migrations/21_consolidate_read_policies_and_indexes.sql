-- 21_consolidate_read_policies_and_indexes.sql
-- 20_適用後のAdvisor再検査で検出した、同一操作の複数PERMISSIVEポリシーと
-- 既存索引との重複を解消する。閲覧可能範囲は変えず、1行につき1ポリシー評価へ統合。

BEGIN;

-- reviews: anonは公開分、authenticatedは公開/本人/閲覧権/管理者を1本で判定。
DROP POLICY IF EXISTS reviews_public_read ON public.reviews;
DROP POLICY IF EXISTS reviews_own_read ON public.reviews;
DROP POLICY IF EXISTS reviews_entitled_read ON public.reviews;
DROP POLICY IF EXISTS reviews_admin_read ON public.reviews;

CREATE POLICY reviews_anon_read ON public.reviews
  FOR SELECT TO anon
  USING (is_public = true);

CREATE POLICY reviews_authenticated_read ON public.reviews
  FOR SELECT TO authenticated
  USING (
    is_public = true
    OR (SELECT auth.uid())::text = user_id
    OR (SELECT private.has_review_access())
    OR ((SELECT auth.jwt()) ->> 'email') = 'tugihe1112@gmail.com'
  );

-- user_credits: 本人と管理者のSELECTを1本へ統合。
DROP POLICY IF EXISTS user_credits_read_own ON public.user_credits;
DROP POLICY IF EXISTS user_credits_admin_read ON public.user_credits;
CREATE POLICY user_credits_authorized_read ON public.user_credits
  FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR ((SELECT auth.jwt()) ->> 'email') = 'tugihe1112@gmail.com'
  );

-- 既に同じ取得経路を覆う旧索引を削除し、20_側の命名へ一本化。
DROP INDEX IF EXISTS public.idx_chat_messages_room_id;
DROP INDEX IF EXISTS public.idx_chat_rooms_user1;
DROP INDEX IF EXISTS public.idx_chat_rooms_user2;

DO $$
BEGIN
  IF (SELECT count(*) FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'reviews'
        AND cmd = 'SELECT' AND 'authenticated' = ANY(roles)) <> 1 THEN
    RAISE EXCEPTION 'reviews authenticated SELECT policy is not consolidated';
  END IF;
  IF (SELECT count(*) FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'reviews'
        AND cmd = 'SELECT' AND 'anon' = ANY(roles)) <> 1 THEN
    RAISE EXCEPTION 'reviews anon SELECT policy is missing or duplicated';
  END IF;
  IF (SELECT count(*) FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'user_credits'
        AND cmd = 'SELECT' AND 'authenticated' = ANY(roles)) <> 1 THEN
    RAISE EXCEPTION 'user_credits SELECT policy is not consolidated';
  END IF;
  IF to_regclass('public.idx_chat_messages_room_id') IS NOT NULL
     OR to_regclass('public.idx_chat_rooms_user1') IS NOT NULL
     OR to_regclass('public.idx_chat_rooms_user2') IS NOT NULL THEN
    RAISE EXCEPTION 'duplicate legacy indexes remain';
  END IF;
END $$;

COMMIT;
