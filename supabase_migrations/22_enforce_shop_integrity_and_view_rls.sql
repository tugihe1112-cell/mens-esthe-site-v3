-- 22_enforce_shop_integrity_and_view_rls.sql
-- 全件監査で判明した「存在しない店舗にぶら下がるセラピスト」と、
-- RLSを継承しない既定viewを修復し、同じ孤児データの再発をDBで止める。

BEGIN;

-- 2026-03-03から残っていた明示的なテスト口コミ。実店舗・実ユーザーではなく、
-- 200字制約導入前の31字データで、shop/therapistとも存在しない。
DELETE FROM public.reviews
WHERE id = 'test-review-001'
  AND shop_id = 'test_shop'
  AND therapist_id = 'test_therapist'
  AND user_id = 'test_user';

-- 親店舗が存在せず、口コミからも一度も参照されていない旧名簿だけを削除する。
-- 公開口コミがある退店セラピストは別設計（アーカイブプロフィール）で保持するため、
-- review参照が1件でもある行は削除対象にしない。
DELETE FROM public.therapists AS therapist
WHERE NOT EXISTS (
  SELECT 1 FROM public.shops AS shop WHERE shop.id = therapist.shop_id
)
AND NOT EXISTS (
  SELECT 1 FROM public.reviews AS review WHERE review.therapist_id = therapist.id
);

-- 今後、存在しないshop_idのセラピストを登録できなくする。
-- 店舗を正規の管理導線で削除した場合は、その店舗の名簿も同時に除去する。
ALTER TABLE public.therapists
  DROP CONSTRAINT IF EXISTS therapists_shop_id_fkey;
ALTER TABLE public.therapists
  ADD CONSTRAINT therapists_shop_id_fkey
  FOREIGN KEY (shop_id) REFERENCES public.shops(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

-- viewは既定で所有者権限を使い、基表のRLSを迂回し得る。
-- 現在このviewはservice_roleだけに付与されているが、将来grantが変わっても
-- user_badgesのRLSを必ず適用するようsecurity_invokerへ固定する。
ALTER VIEW public.user_badge_counts SET (security_invoker = true);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.therapists AS therapist
    LEFT JOIN public.shops AS shop ON shop.id = therapist.shop_id
    WHERE shop.id IS NULL
  ) THEN
    RAISE EXCEPTION 'therapists without a parent shop remain';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.reviews AS review
    LEFT JOIN public.shops AS shop ON shop.id = review.shop_id
    WHERE shop.id IS NULL
  ) THEN
    RAISE EXCEPTION 'reviews without a parent shop remain';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'therapists_shop_id_fkey'
      AND conrelid = 'public.therapists'::regclass
      AND confrelid = 'public.shops'::regclass
      AND convalidated
  ) THEN
    RAISE EXCEPTION 'therapists_shop_id_fkey is missing or invalid';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'public.user_badge_counts'::regclass
      AND reloptions @> ARRAY['security_invoker=true']
  ) THEN
    RAISE EXCEPTION 'user_badge_counts is not security_invoker';
  END IF;
END $$;

COMMIT;
