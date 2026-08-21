-- 15_review_story_character_count.sql
-- 14_で区分構造を保存できるようにした後、区分間へ自動挿入する空行が
-- 200/700字特典へ加算されないよう、ユーザー入力本文だけを数える。
BEGIN;

CREATE OR REPLACE FUNCTION public.review_story_char_length(sections jsonb)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT
    pg_catalog.char_length(pg_catalog.btrim(coalesce(sections ->> 'entrance', '')))
    + pg_catalog.char_length(pg_catalog.btrim(coalesce(sections ->> 'meeting', '')))
    + pg_catalog.char_length(pg_catalog.btrim(coalesce(sections ->> 'session', '')))
    + pg_catalog.char_length(pg_catalog.btrim(coalesce(sections ->> 'exit', '')));
$$;

-- 新規の構造化投稿は各欄の本文合計、旧投稿は従来どおりcontent全体で判定する。
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_content_min_length;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_content_min_length
  CHECK (
    CASE
      WHEN story_sections IS NOT NULL
        THEN public.review_story_char_length(story_sections) >= 200
      ELSE pg_catalog.char_length(pg_catalog.btrim(content)) >= 200
    END
  ) NOT VALID;

CREATE OR REPLACE FUNCTION public.auto_grant_credits_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  len integer := CASE
    WHEN NEW.story_sections IS NOT NULL
      THEN public.review_story_char_length(NEW.story_sections)
    ELSE pg_catalog.length(coalesce(NEW.content, ''))
  END;
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

REVOKE EXECUTE ON FUNCTION public.auto_grant_credits_on_review() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  fn_def text;
BEGIN
  IF public.review_story_char_length(
    jsonb_build_object('entrance', repeat('あ', 194), 'meeting', repeat('い', 6))
  ) <> 200 THEN
    RAISE EXCEPTION 'review_story_char_length が本文文字数と一致しません';
  END IF;

  SELECT pg_catalog.pg_get_functiondef(p.oid) INTO fn_def
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'auto_grant_credits_on_review';

  IF fn_def NOT LIKE '%review_story_char_length(NEW.story_sections)%' THEN
    RAISE EXCEPTION 'credits付与関数が構造化本文の文字数を使っていません';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conname = 'reviews_content_min_length' AND NOT convalidated
  ) THEN
    RAISE EXCEPTION 'reviews_content_min_length がNOT VALIDで存在しません';
  END IF;
END $$;

COMMIT;

