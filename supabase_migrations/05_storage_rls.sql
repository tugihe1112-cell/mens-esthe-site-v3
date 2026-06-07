-- ============================================================
-- Storage RLS: therapist-images バケット
-- 実行場所: Supabase Dashboard → SQL Editor
-- 目的: フロントエンドから直接アップロード・削除できないようにする
--       (service_role は RLS をバイパスするのでスクリプトは引き続き動作)
-- ============================================================

-- 既存ポリシーを削除（冪等実行のため）
DROP POLICY IF EXISTS "Public read access for therapist-images" ON storage.objects;
DROP POLICY IF EXISTS "Block uploads from clients" ON storage.objects;
DROP POLICY IF EXISTS "Block updates from clients" ON storage.objects;
DROP POLICY IF EXISTS "Block deletes from clients" ON storage.objects;

-- ① 全員が画像を読める（CDN 配信と同じ扱い）
CREATE POLICY "Public read access for therapist-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'therapist-images');

-- ② anon / authenticated からの直接アップロードを禁止
--    service_role（スクリプト経由）は RLS をバイパスするので影響なし
CREATE POLICY "Block uploads from clients"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (false);

-- ③ 同様に UPDATE を禁止
CREATE POLICY "Block updates from clients"
ON storage.objects FOR UPDATE TO anon, authenticated
USING (false);

-- ④ 同様に DELETE を禁止
CREATE POLICY "Block deletes from clients"
ON storage.objects FOR DELETE TO anon, authenticated
USING (false);

-- ============================================================
-- 確認クエリ（実行後にポリシー一覧を確認）
-- ============================================================
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%therapist%'
ORDER BY cmd;
