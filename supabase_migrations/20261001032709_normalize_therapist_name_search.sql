-- 名前の表記揺れを取得前に吸収する。既存の名前・人物ID・口コミは更新しない。
-- この読取RPCを適用してからSearchPageをデプロイすること。
-- SECURITY INVOKERで呼出元のSELECT権限とRLSを継承する。
BEGIN;

SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '60s';

CREATE OR REPLACE FUNCTION public.normalize_therapist_search_name(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SECURITY INVOKER
SET search_path = ''
AS $normalize$
  SELECT pg_catalog.translate(
    pg_catalog.regexp_replace(
      pg_catalog.lower(pg_catalog.normalize(coalesce(value, ''), 'NFKC')),
      U&'[\0009-\000D\0020\0085\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]+',
      '',
      'g'
    ),
    'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵヶヽヾ',
    'ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔゕゖゝゞ'
  );
$normalize$;

REVOKE ALL ON FUNCTION public.normalize_therapist_search_name(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_therapist_search_name(text) TO anon, authenticated, service_role;

-- 各入力で全在籍者の名前を走査しないよう、公開検索対象だけをGIN索引へ入れる。
-- pg_trgmが別schemaに既存の場合も、そのschemaのopclassを使う。
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
DO $index$
DECLARE
  trigram_schema text;
BEGIN
  SELECT n.nspname INTO trigram_schema
  FROM pg_catalog.pg_extension AS e
  JOIN pg_catalog.pg_namespace AS n ON n.oid = e.extnamespace
  WHERE e.extname = 'pg_trgm';

  EXECUTE pg_catalog.format(
    'CREATE INDEX IF NOT EXISTS therapists_normalized_name_search_idx
      ON public.therapists USING gin (public.normalize_therapist_search_name(name) %I.gin_trgm_ops)
      WHERE image_url IS NOT NULL AND image_url <> '''' AND (is_active IS NULL OR is_active = true)',
    trigram_schema
  );
END;
$index$;

CREATE OR REPLACE FUNCTION public.search_therapists_by_normalized_name(
  p_name_query text,
  p_shop_ids text[] DEFAULT NULL,
  p_limit integer DEFAULT 501
)
RETURNS TABLE (
  id text,
  shop_id text,
  name text,
  image_url text,
  raw_data jsonb,
  is_active boolean
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $search$
DECLARE
  normalized_query text;
  escaped_query text;
BEGIN
  IF pg_catalog.char_length(p_name_query) > 256 THEN
    RAISE EXCEPTION 'Name query is too long' USING ERRCODE = '22023';
  END IF;
  IF coalesce(pg_catalog.array_length(p_shop_ids, 1), 0) > 100 THEN
    RAISE EXCEPTION 'Too many shop ids' USING ERRCODE = '22023';
  END IF;

  normalized_query := public.normalize_therapist_search_name(p_name_query);
  IF normalized_query = '' THEN RETURN; END IF;

  -- LIKEのメタ文字は文字として検索する（%・_で全件を取得させない）。
  escaped_query := pg_catalog.replace(
    pg_catalog.replace(
      pg_catalog.replace(normalized_query, pg_catalog.chr(92), pg_catalog.chr(92) || pg_catalog.chr(92)),
      '%', pg_catalog.chr(92) || '%'
    ),
    '_', pg_catalog.chr(92) || '_'
  );

  RETURN QUERY
  SELECT t.id, t.shop_id, t.name, t.image_url, t.raw_data, t.is_active
  FROM public.therapists AS t
  WHERE t.image_url IS NOT NULL
    AND t.image_url <> ''
    AND (t.is_active IS NULL OR t.is_active = true)
    AND (p_shop_ids IS NULL OR t.shop_id = ANY(p_shop_ids))
    AND public.normalize_therapist_search_name(t.name) LIKE '%' || escaped_query || '%' ESCAPE pg_catalog.chr(92)
  ORDER BY
    (public.normalize_therapist_search_name(t.name) = normalized_query) DESC,
    pg_catalog.char_length(public.normalize_therapist_search_name(t.name)),
    t.name,
    t.id
  LIMIT greatest(1, least(coalesce(p_limit, 501), 1001));
END;
$search$;

REVOKE ALL ON FUNCTION public.search_therapists_by_normalized_name(text, text[], integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_therapists_by_normalized_name(text, text[], integer) TO anon, authenticated, service_role;

-- 自己検証：失敗した場合はDDLを含めてすべてロールバックする。
DO $verify$
BEGIN
  IF public.normalize_therapist_search_name('天音　しおり') <> public.normalize_therapist_search_name('天音シオリ')
     OR public.normalize_therapist_search_name('天音 ｼｵﾘ') <> '天音しおり'
     OR public.normalize_therapist_search_name(U&'天音\00A0\2009\202Fしおり') <> '天音しおり'
     OR public.normalize_therapist_search_name('ガール') <> public.normalize_therapist_search_name('がーる')
     OR public.normalize_therapist_search_name('サザ') <> 'さざ'
  THEN
    RAISE EXCEPTION 'Therapist search normalization verification failed';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc
    WHERE oid IN (
      'public.normalize_therapist_search_name(text)'::regprocedure,
      'public.search_therapists_by_normalized_name(text,text[],integer)'::regprocedure
    ) AND prosecdef
  ) THEN
    RAISE EXCEPTION 'Therapist search must remain SECURITY INVOKER';
  END IF;
END;
$verify$;

NOTIFY pgrst, 'reload schema';
COMMIT;
