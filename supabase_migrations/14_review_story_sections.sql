-- 14_review_story_sections.sql
-- 投稿画面の「入店・ご対面・施術・総評」を本文とは別の構造として保存する。
-- content はユーザーが書いた本文だけを保持し、200/700字特典の文字数を水増ししない。
BEGIN;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS story_sections jsonb;

-- クライアントと同じ順序・trim規則で、構造化セクションから本文を再構成する。
-- CHECK制約でのみ使う純粋関数。可変search_pathを持たせない。
CREATE OR REPLACE FUNCTION public.compose_review_story_content(sections jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT coalesce(
    pg_catalog.array_to_string(
      pg_catalog.array_remove(ARRAY[
        nullif(pg_catalog.btrim(sections ->> 'entrance'), ''),
        nullif(pg_catalog.btrim(sections ->> 'meeting'), ''),
        nullif(pg_catalog.btrim(sections ->> 'session'), ''),
        nullif(pg_catalog.btrim(sections ->> 'exit'), '')
      ], NULL),
      E'\n\n'
    ),
    ''
  );
$$;

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_story_sections_shape;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_story_sections_shape
  CHECK (
    story_sections IS NULL
    OR (
      pg_catalog.jsonb_typeof(story_sections) = 'object'
      AND story_sections - ARRAY['entrance', 'meeting', 'session', 'exit']::text[] = '{}'::jsonb
      AND (NOT (story_sections ? 'entrance') OR pg_catalog.jsonb_typeof(story_sections -> 'entrance') = 'string')
      AND (NOT (story_sections ? 'meeting') OR pg_catalog.jsonb_typeof(story_sections -> 'meeting') = 'string')
      AND (NOT (story_sections ? 'session') OR pg_catalog.jsonb_typeof(story_sections -> 'session') = 'string')
      AND (NOT (story_sections ? 'exit') OR pg_catalog.jsonb_typeof(story_sections -> 'exit') = 'string')
      AND public.compose_review_story_content(story_sections) = content
    )
  ) NOT VALID;

-- 既存行はすべてNULLなので安全に検証できる。既存口コミ本文は変更しない。
ALTER TABLE public.reviews
  VALIDATE CONSTRAINT reviews_story_sections_shape;

COMMENT ON COLUMN public.reviews.story_sections IS
  '投稿画面の区分別本文。keys: entrance, meeting, session, exit。contentとDB制約で一致を保証';

-- 自己検証: カラム・制約・関数のいずれかが欠けた状態ではCOMMITしない。
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews'
      AND column_name = 'story_sections' AND data_type = 'jsonb'
  ) THEN
    RAISE EXCEPTION 'reviews.story_sections jsonb がありません';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conname = 'reviews_story_sections_shape' AND convalidated
  ) THEN
    RAISE EXCEPTION 'reviews_story_sections_shape が検証済みではありません';
  END IF;

  IF public.compose_review_story_content(
    '{"entrance":" A ","meeting":"B","session":"","exit":" C "}'::jsonb
  ) <> E'A\n\nB\n\nC' THEN
    RAISE EXCEPTION 'compose_review_story_content の整形結果が想定外です';
  END IF;
END $$;

COMMIT;
