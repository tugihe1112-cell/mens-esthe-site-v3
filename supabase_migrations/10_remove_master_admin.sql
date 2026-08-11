-- 10_remove_master_admin.sql — 管理者リストから master@mens-esthe.jp を外す
--
-- 【なぜ必要か（2026-08-12）】
-- 1. このアカウントのパスワードが `src/pages/LoginPage.jsx` に平文でハードコードされ、
--    「Fill Master ID」ボタンとして**本番のログイン画面に公開**されていた。
--    誰でもボタンを押すだけで管理者としてログインできる状態だった。
-- 2. さらに深刻なのは、ドメイン `mens-esthe.jp` が当サイト（mens-esthe-map.jp）の
--    所有ドメインではないこと。管理者判定はメールアドレスの完全一致なので、
--    **そのドメインの所有者が同名のメールボックスを作って新規登録すれば管理者になれる**。
--    ＝ Supabase のユーザーを削除するだけでは塞がらず、ポリシー側から外す必要がある。
--
-- 【実行前に】
--   Supabase Authentication → Users から master@mens-esthe.jp を削除しておくこと。
--   （reviews の運営投稿は user_id='owner_manual' という文字列で、この auth ユーザーとは
--     紐づいていないため、削除しても口コミは消えない。コード内にこのUUIDの参照も無い）
--
-- 【今後のルール】
--   管理者を追加する場合も、**自分が所有しているドメインのアドレスだけ**にする。
--   将来的にはメールアドレス直書きをやめ、専用の admins テーブルか app_metadata で管理する。

-- reviews の削除権限
DROP POLICY IF EXISTS "reviews_admin_delete" ON reviews;
CREATE POLICY "reviews_admin_delete"
  ON reviews FOR DELETE
  USING (
    auth.jwt()->>'email' IN ('tugihe1112@gmail.com')
  );

-- user_badges の管理権限
-- ⚠️ ポリシー名は 04_rls_policies.sql の定義に合わせること（user_badges_admin_write）。
--    名前を間違えると DROP IF EXISTS が何もせず、古いポリシーが残ったままになる。
DROP POLICY IF EXISTS "user_badges_admin_write" ON user_badges;
CREATE POLICY "user_badges_admin_write"
  ON user_badges FOR ALL
  USING (
    auth.jwt()->>'email' IN ('tugihe1112@gmail.com')
  );

-- 確認用:
--   SELECT policyname, qual FROM pg_policies
--   WHERE schemaname='public' AND qual LIKE '%mens-esthe.jp%';
--   → 0件になっていれば完了
