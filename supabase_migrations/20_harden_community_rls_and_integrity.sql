-- 20_harden_community_rls_and_integrity.sql
-- 非公開中の掲示板・チャットも、URL直打ちやREST直接呼び出しに耐える状態へ揃える。
-- 目的:
--   1. 本文・表示名・カテゴリをDBでも制約し、UI回避による巨大/不正入力を防ぐ
--   2. チャット参加者とauth.usersの参照整合性、逆順の重複ルームを防ぐ
--   3. 重複RLSを統合し、auth.uid()/auth.jwt()をinitPlan化する
--   4. 外部キー列へ索引を追加する

BEGIN;

-- ── 入力の完全性 ────────────────────────────────────────────
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_title_length;
ALTER TABLE public.posts ADD CONSTRAINT posts_title_length
  CHECK (char_length(btrim(title)) BETWEEN 1 AND 120);
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_content_length;
ALTER TABLE public.posts ADD CONSTRAINT posts_content_length
  CHECK (char_length(btrim(content)) BETWEEN 1 AND 5000);
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_user_name_length;
ALTER TABLE public.posts ADD CONSTRAINT posts_user_name_length
  CHECK (char_length(btrim(user_name)) BETWEEN 1 AND 30);
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_shop_name_length;
ALTER TABLE public.posts ADD CONSTRAINT posts_shop_name_length
  CHECK (shop_name IS NULL OR char_length(btrim(shop_name)) BETWEEN 1 AND 120);
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_allowed;
ALTER TABLE public.posts ADD CONSTRAINT posts_category_allowed
  CHECK (category IN ('general', 'recommend', 'therapist', 'newbie', 'question'));

ALTER TABLE public.replies DROP CONSTRAINT IF EXISTS replies_content_length;
ALTER TABLE public.replies ADD CONSTRAINT replies_content_length
  CHECK (char_length(btrim(content)) BETWEEN 1 AND 5000);
ALTER TABLE public.replies DROP CONSTRAINT IF EXISTS replies_user_name_length;
ALTER TABLE public.replies ADD CONSTRAINT replies_user_name_length
  CHECK (char_length(btrim(user_name)) BETWEEN 1 AND 30);

ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_content_length;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_content_length
  CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000);
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_name_length;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_sender_name_length
  CHECK (char_length(btrim(sender_name)) BETWEEN 1 AND 30);

ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_distinct_users;
ALTER TABLE public.chat_rooms ADD CONSTRAINT chat_rooms_distinct_users
  CHECK (user1_id <> user2_id);

-- ── 参照整合性・重複防止 ────────────────────────────────────
ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_user1_id_fkey;
ALTER TABLE public.chat_rooms ADD CONSTRAINT chat_rooms_user1_id_fkey
  FOREIGN KEY (user1_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_user2_id_fkey;
ALTER TABLE public.chat_rooms ADD CONSTRAINT chat_rooms_user2_id_fkey
  FOREIGN KEY (user2_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_user1_id_user2_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS chat_rooms_participants_unique_idx
  ON public.chat_rooms (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id));

-- ── 外部キー・主要取得経路の索引 ────────────────────────────
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts (user_id);
CREATE INDEX IF NOT EXISTS replies_post_id_idx ON public.replies (post_id);
CREATE INDEX IF NOT EXISTS replies_user_id_idx ON public.replies (user_id);
CREATE INDEX IF NOT EXISTS chat_rooms_user1_id_idx ON public.chat_rooms (user1_id);
CREATE INDEX IF NOT EXISTS chat_rooms_user2_id_idx ON public.chat_rooms (user2_id);
CREATE INDEX IF NOT EXISTS chat_messages_room_created_idx ON public.chat_messages (room_id, created_at);
CREATE INDEX IF NOT EXISTS chat_messages_sender_id_idx ON public.chat_messages (sender_id);
CREATE INDEX IF NOT EXISTS review_likes_user_id_idx ON public.review_likes (user_id);
CREATE INDEX IF NOT EXISTS user_badges_review_id_idx ON public.user_badges (review_id);
CREATE INDEX IF NOT EXISTS user_badges_to_user_id_idx ON public.user_badges (to_user_id);

-- ── 掲示板RLS ────────────────────────────────────────────────
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "誰でも閲覧可" ON public.posts;
DROP POLICY IF EXISTS "ログイン済みが投稿可" ON public.posts;
DROP POLICY IF EXISTS "自分の投稿を削除可" ON public.posts;
CREATE POLICY posts_public_read ON public.posts
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY posts_own_insert ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY posts_own_delete ON public.posts
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "誰でも閲覧可" ON public.replies;
DROP POLICY IF EXISTS "ログイン済みが返信可" ON public.replies;
DROP POLICY IF EXISTS "自分の返信を削除可" ON public.replies;
CREATE POLICY replies_public_read ON public.replies
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY replies_own_insert ON public.replies
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY replies_own_delete ON public.replies
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ── チャットRLS（重複ポリシーを各操作1本へ統合）─────────────
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chat_rooms_select ON public.chat_rooms;
DROP POLICY IF EXISTS chat_rooms_insert ON public.chat_rooms;
CREATE POLICY chat_rooms_member_read ON public.chat_rooms
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (user1_id, user2_id));
CREATE POLICY chat_rooms_member_insert ON public.chat_rooms
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IN (user1_id, user2_id));

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chat_messages_insert ON public.chat_messages;
DROP POLICY IF EXISTS chat_messages_own_insert ON public.chat_messages;
DROP POLICY IF EXISTS chat_messages_room_member_read ON public.chat_messages;
DROP POLICY IF EXISTS chat_messages_select ON public.chat_messages;
CREATE POLICY chat_messages_member_read ON public.chat_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_rooms AS room
    WHERE room.id = chat_messages.room_id
      AND (SELECT auth.uid()) IN (room.user1_id, room.user2_id)
  ));
CREATE POLICY chat_messages_member_insert ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chat_rooms AS room
      WHERE room.id = chat_messages.room_id
        AND (SELECT auth.uid()) IN (room.user1_id, room.user2_id)
    )
  );

-- ── 既存管理ポリシーのinitPlan化 ────────────────────────────
DROP POLICY IF EXISTS reviews_admin_delete ON public.reviews;
CREATE POLICY reviews_admin_delete ON public.reviews
  FOR DELETE TO authenticated
  USING (((SELECT auth.jwt()) ->> 'email') = 'tugihe1112@gmail.com');
DROP POLICY IF EXISTS reviews_admin_read ON public.reviews;
CREATE POLICY reviews_admin_read ON public.reviews
  FOR SELECT TO authenticated
  USING (((SELECT auth.jwt()) ->> 'email') = 'tugihe1112@gmail.com');
DROP POLICY IF EXISTS reviews_authenticated_insert ON public.reviews;
CREATE POLICY reviews_authenticated_insert ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS shops_admin_update ON public.shops;
CREATE POLICY shops_admin_update ON public.shops
  FOR UPDATE TO authenticated
  USING (((SELECT auth.jwt()) ->> 'email') = 'tugihe1112@gmail.com')
  WITH CHECK (((SELECT auth.jwt()) ->> 'email') = 'tugihe1112@gmail.com');
DROP POLICY IF EXISTS shops_admin_delete ON public.shops;
CREATE POLICY shops_admin_delete ON public.shops
  FOR DELETE TO authenticated
  USING (((SELECT auth.jwt()) ->> 'email') = 'tugihe1112@gmail.com');

DROP POLICY IF EXISTS user_credits_admin_read ON public.user_credits;
CREATE POLICY user_credits_admin_read ON public.user_credits
  FOR SELECT TO authenticated
  USING (((SELECT auth.jwt()) ->> 'email') = 'tugihe1112@gmail.com');

-- ── 自己検証。1件でも欠ければCOMMITせず全体を失敗させる ─────
DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(name, ', ' ORDER BY name) INTO missing
  FROM unnest(ARRAY[
    'posts_title_length', 'posts_content_length', 'posts_user_name_length',
    'posts_shop_name_length', 'posts_category_allowed',
    'replies_content_length', 'replies_user_name_length',
    'chat_messages_content_length', 'chat_messages_sender_name_length',
    'chat_rooms_distinct_users', 'chat_rooms_user1_id_fkey',
    'chat_rooms_user2_id_fkey', 'chat_messages_sender_id_fkey'
  ]) AS expected(name)
  WHERE NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = expected.name);
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'missing constraints: %', missing; END IF;

  SELECT string_agg(name, ', ' ORDER BY name) INTO missing
  FROM unnest(ARRAY[
    'posts_user_id_idx', 'replies_post_id_idx', 'replies_user_id_idx',
    'chat_rooms_participants_unique_idx', 'chat_rooms_user1_id_idx',
    'chat_rooms_user2_id_idx', 'chat_messages_room_created_idx',
    'chat_messages_sender_id_idx', 'review_likes_user_id_idx',
    'user_badges_review_id_idx', 'user_badges_to_user_id_idx'
  ]) AS expected(name)
  WHERE to_regclass('public.' || expected.name) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'missing indexes: %', missing; END IF;

  SELECT string_agg(name, ', ' ORDER BY name) INTO missing
  FROM unnest(ARRAY[
    'posts_public_read', 'posts_own_insert', 'posts_own_delete',
    'replies_public_read', 'replies_own_insert', 'replies_own_delete',
    'chat_rooms_member_read', 'chat_rooms_member_insert',
    'chat_messages_member_read', 'chat_messages_member_insert'
  ]) AS expected(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND policyname = expected.name
  );
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'missing policies: %', missing; END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'chat_messages'
      AND policyname IN (
        'chat_messages_insert', 'chat_messages_own_insert',
        'chat_messages_room_member_read', 'chat_messages_select'
      )
  ) THEN
    RAISE EXCEPTION 'duplicate legacy chat policies remain';
  END IF;
END $$;

COMMIT;
