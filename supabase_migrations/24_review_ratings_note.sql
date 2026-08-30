-- 24_review_ratings_note.sql
--
-- 【目的】採点(6軸)の一言コメントを、口コミ本文の最後に「採点コメント」区分として保存する。
--
-- 【なぜ本文に入れるのか（2026-08-26 オーナー判断）】
-- 「一言を書かせておいて文字数に数えないのは筋が通らない」。
-- ただし体験談の各欄に**混ぜてはいけない**（「ドアを開けると写真より可愛かった。
-- 写真より可愛かった。」のように文章が破綻する）。
-- → 独立した区分 `ratings_note` として **本文の最後にまとめて** 置く。
--
-- 【この変更が必要な理由】
-- 200/700字の判定は画面ではなく **DB側の制約** で強制している。
-- クライアントだけで数えると「画面は250字・DBは180字で拒否」というズレになり、
-- 2026-08-26 に列権限で起こしたのと同型の「投稿できない」事故が再発する。
--
-- ⚠️ 列は追加しない（story_sections jsonb の中にキーを1つ増やすだけ）。
--    そのため 12_ の列単位 GRANT の更新は不要。
--    ⚠️ ただし新しい列を足す場合は GRANT INSERT の更新を絶対に忘れないこと（23_参照）。
--
-- 【既存データへの影響】なし。
--   `sections ->> 'ratings_note'` はキーが無ければ NULL を返し、
--   array_remove / coalesce により従来と同じ結果になる。
--   既存の口コミ（4区分のみ）は content も文字数も変わらないので、
--   reviews_story_sections_shape / reviews_content_min_length を再検証しても通る。

BEGIN;

-- ── ① 本文の組み立てに ratings_note を追加（必ず最後） ──────────────────
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
        nullif(pg_catalog.btrim(sections ->> 'exit'), ''),
        -- ⚠️ 採点コメントは必ず最後。体験談の流れを分断しないため。
        nullif(pg_catalog.btrim(sections ->> 'ratings_note'), '')
      ], NULL),
      E'\n\n'
    ),
    ''
  );
$$;

-- ── ② 文字数（200/700判定）にも ratings_note を含める ────────────────────
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
    + pg_catalog.char_length(pg_catalog.btrim(coalesce(sections ->> 'exit', '')))
    + pg_catalog.char_length(pg_catalog.btrim(coalesce(sections ->> 'ratings_note', '')));
$$;

-- ── ③ 許可キーに ratings_note を追加（型は文字列のみ） ──────────────────
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_story_sections_shape;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_story_sections_shape
  CHECK (
    story_sections IS NULL
    OR (
      pg_catalog.jsonb_typeof(story_sections) = 'object'
      AND story_sections - ARRAY['entrance', 'meeting', 'session', 'exit', 'ratings_note']::text[] = '{}'::jsonb
      AND (NOT (story_sections ? 'entrance') OR pg_catalog.jsonb_typeof(story_sections -> 'entrance') = 'string')
      AND (NOT (story_sections ? 'meeting') OR pg_catalog.jsonb_typeof(story_sections -> 'meeting') = 'string')
      AND (NOT (story_sections ? 'session') OR pg_catalog.jsonb_typeof(story_sections -> 'session') = 'string')
      AND (NOT (story_sections ? 'exit') OR pg_catalog.jsonb_typeof(story_sections -> 'exit') = 'string')
      AND (NOT (story_sections ? 'ratings_note') OR pg_catalog.jsonb_typeof(story_sections -> 'ratings_note') = 'string')
      AND public.compose_review_story_content(story_sections) = content
    )
  ) NOT VALID;

-- 既存行（4区分のみ）は上の関数変更後も content と一致するので検証を通す。
-- ⚠️ ここで失敗したら既存の口コミが壊れる変更をしたということ。必ず検証すること。
ALTER TABLE public.reviews
  VALIDATE CONSTRAINT reviews_story_sections_shape;

COMMENT ON COLUMN public.reviews.story_sections IS
  '投稿画面の区分別本文。keys: entrance, meeting, session, exit, ratings_note（採点コメント・最後）。contentとDB制約で一致を保証';

-- ── ④ 自己検証：組み立て・字数・既存行の健全性 ───────────────────────
DO $$
DECLARE
  composed text;
  len int;
  broken int;
BEGIN
  -- 採点コメントが最後に連結されること
  composed := public.compose_review_story_content(
    '{"entrance":"あ","meeting":"い","session":"う","exit":"え","ratings_note":"ルックス（★2）お"}'::jsonb
  );
  IF composed <> E'あ\n\nい\n\nう\n\nえ\n\nルックス（★2）お' THEN
    RAISE EXCEPTION '本文の組み立てが想定と違います: %', composed;
  END IF;

  -- 採点コメントが字数に入ること（あ/い/う/え=4 + 「ルックス（★2）お」=9 → 13）
  len := public.review_story_char_length(
    '{"entrance":"あ","meeting":"い","session":"う","exit":"え","ratings_note":"ルックス（★2）お"}'::jsonb
  );
  IF len <> 13 THEN
    RAISE EXCEPTION '文字数の集計が想定と違います: %', len;
  END IF;

  -- ratings_note が無い場合は従来と完全に同じ
  IF public.compose_review_story_content('{"entrance":"あ","exit":"え"}'::jsonb) <> E'あ\n\nえ' THEN
    RAISE EXCEPTION '既存形式の組み立てが変わっています';
  END IF;

  -- 既存の口コミが1件も壊れていないこと
  SELECT count(*) INTO broken
    FROM public.reviews
   WHERE story_sections IS NOT NULL
     AND public.compose_review_story_content(story_sections) <> content;
  IF broken > 0 THEN
    RAISE EXCEPTION '既存の口コミ % 件で本文が一致しません', broken;
  END IF;
END $$;

COMMIT;
