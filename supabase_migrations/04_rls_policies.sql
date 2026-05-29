-- ============================================================
-- RLS ポリシー設定
-- Supabase ダッシュボード → SQL Editor に貼り付けて実行する
-- ============================================================

-- ── reviews テーブル ──────────────────────────────────────

-- RLS を有効化（まだの場合）
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 全員が読める（口コミは公開コンテンツ）
CREATE POLICY "reviews_public_read"
  ON reviews FOR SELECT USING (true);

-- ログイン済みユーザーのみ自分の口コミを挿入可能
CREATE POLICY "reviews_authenticated_insert"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid()::text = user_id);

-- anon key からの UPDATE を完全ブロック
-- （auto_rewrite スクリプトは Service Role Key で実行すること）
CREATE POLICY "reviews_no_anon_update"
  ON reviews FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 管理者のみ削除可能
CREATE POLICY "reviews_admin_delete"
  ON reviews FOR DELETE
  USING (
    auth.jwt()->>'email' IN ('tugihe1112@gmail.com', 'master@mens-esthe.jp')
  );


-- ── user_credits テーブル ─────────────────────────────────

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のクレジットのみ読める
CREATE POLICY "user_credits_read_own"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE は Service Role（API）経由のみ
-- → api/admin-grant-credit.js が SUPABASE_SERVICE_ROLE_KEY を使うため
-- → フロントエンドからの直接操作はすべてブロック
CREATE POLICY "user_credits_no_direct_write"
  ON user_credits FOR ALL
  USING (false)
  WITH CHECK (false);
-- ※ Service Role はRLSをバイパスするので上記ポリシーの影響を受けない


-- ── shops / therapists テーブル ──────────────────────────

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shops_public_read"
  ON shops FOR SELECT USING (true);
-- 書き込みは Service Role からのみ（メンテナンススクリプト）

ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "therapists_public_read"
  ON therapists FOR SELECT USING (true);


-- ── review_likes テーブル ────────────────────────────────

ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_likes_public_read"
  ON review_likes FOR SELECT USING (true);
CREATE POLICY "review_likes_own_insert"
  ON review_likes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "review_likes_own_delete"
  ON review_likes FOR DELETE
  USING (auth.uid() = user_id);


-- ── user_badges テーブル ─────────────────────────────────

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_public_read"
  ON user_badges FOR SELECT USING (true);
CREATE POLICY "user_badges_admin_write"
  ON user_badges FOR ALL
  USING (
    auth.jwt()->>'email' IN ('tugihe1112@gmail.com', 'master@mens-esthe.jp')
  );


-- ── chat_messages テーブル ───────────────────────────────

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
-- 自分が参加しているルームのメッセージのみ読める
CREATE POLICY "chat_messages_room_member_read"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_messages.room_id
        AND (cr.user1_id = auth.uid() OR cr.user2_id = auth.uid())
    )
  );
CREATE POLICY "chat_messages_own_insert"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
