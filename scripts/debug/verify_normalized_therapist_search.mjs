/**
 * 実際のPostgreSQLで検索migrationを検証。本番DBには接続しない。
 * PGliteは一時フォルダーへnpm install --prefix <tmp> @electric-sql/pgliteで取得し、
 * PGLITE_MODULE=<tmp>/node_modules/@electric-sql/pglite/dist/index.jsを渡す。
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PGLITE_MODULE;
if (!modulePath) throw new Error('Set PGLITE_MODULE to the local PGlite runtime path');
const { PGlite } = await import(pathToFileURL(path.resolve(modulePath)).href);
const { pg_trgm } = await import(pathToFileURL(path.join(path.dirname(modulePath), 'contrib/pg_trgm.js')).href);
const db = new PGlite({ extensions: { pg_trgm } });
const migrationPath = 'supabase_migrations/20261001032709_normalize_therapist_name_search.sql';
const migration = fs.readFileSync(migrationPath, 'utf8');

try {
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role;
    CREATE TABLE public.therapists (
      id text PRIMARY KEY, shop_id text, name text, image_url text,
      raw_data jsonb, is_active boolean
    );
    ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT SELECT ON public.therapists TO anon, authenticated, service_role;
    CREATE POLICY visible_profiles ON public.therapists FOR SELECT
      TO anon, authenticated USING (shop_id <> 'private');
    INSERT INTO public.therapists VALUES
      ('amane', 'relax', '天音　しおり', 'https://example.test/a.jpg', '{}', true),
      ('kana', 'other', '天音 シオリ', 'https://example.test/k.jpg', '{}', null),
      ('private', 'private', '天音しおり', 'https://example.test/p.jpg', '{}', true),
      ('inactive', 'relax', '天音しおり', 'https://example.test/i.jpg', '{}', false),
      ('no-photo', 'relax', '天音しおり', null, '{}', true),
      ('blank-photo', 'relax', '天音しおり', '', '{}', true),
      ('partial', 'relax', '天音しおり新人', 'https://example.test/n.jpg', '{}', true),
      ('percent', 'relax', '100%のしおり', 'https://example.test/q.jpg', '{}', true),
      ('underscore', 'relax', 'しおり_特別', 'https://example.test/u.jpg', '{}', true),
      ('slash', 'relax', 'しおり\\記録', 'https://example.test/s.jpg', '{}', true);
  `);
  await db.exec(migration);
  const definitions = await db.query(`
    SELECT proname, prosecdef, proconfig FROM pg_proc
    WHERE proname IN ('normalize_therapist_search_name', 'search_therapists_by_normalized_name')
  `);
  assert.equal(definitions.rows.length, 2);
  for (const row of definitions.rows) {
    assert.equal(row.prosecdef, false);
    assert.deepEqual(row.proconfig, ['search_path=""']);
  }
  await db.exec('SET ROLE anon');
  const search = async (query, shops = null, limit = 501) =>
    (await db.query('SELECT id FROM public.search_therapists_by_normalized_name($1, $2, $3)', [query, shops, limit])).rows.map(row => row.id);

  for (const query of ['天音しおり', '天音 しおり', '天音　しおり', '天音シオリ', '天音 ｼｵﾘ', '天音\u00a0\u2009\u202fしおり']) {
    const ids = await search(query);
    assert.deepEqual(new Set(ids), new Set(['amane', 'kana', 'partial']), query);
    assert.equal(ids.at(-1), 'partial', 'Exact names precede names with suffixes');
    assert.deepEqual(await search(query, ['relax']), ['amane', 'partial'], 'Shop AND name filter is applied before limit');
  }
  assert.deepEqual(await search('天音しおり', ['absent']), []);
  assert.deepEqual(await search('天音しおり', []), []);
  assert.deepEqual(await search(' \u3000\u00a0 '), []);
  assert.deepEqual(await search('%'), ['percent'], '% must be literal');
  assert.deepEqual(await search('_'), ['underscore'], '_ must be literal');
  assert.deepEqual(await search('\\'), ['slash'], 'Backslash must be literal');
  assert.equal((await search('天音しおり', ['relax'], 1))[0], 'amane', 'Normalization and shop matching happen before limit');
  await assert.rejects(search('a'.repeat(257)), /too long/);
  await assert.rejects(search('しおり', Array(101).fill('relax')), /Too many/);
  await db.exec('RESET ROLE');
  await db.exec(`
    INSERT INTO public.therapists
      SELECT 'many-' || g, 'many', '上限テスト' || g, 'https://example.test/m.jpg', '{}', true
      FROM generate_series(1, 1100) AS g;
  `);
  assert.equal((await search('上限テスト', null, 10000)).length, 1001, 'Untrusted callers cannot remove the upper bound');
  await db.exec('SET enable_seqscan = off');
  const plan = await db.query(`
    EXPLAIN SELECT id FROM public.therapists
      WHERE image_url IS NOT NULL AND image_url <> ''
        AND (is_active IS NULL OR is_active = true)
        AND public.normalize_therapist_search_name(name) LIKE '%天音しおり%';
  `);
  assert.match(JSON.stringify(plan.rows), /therapists_normalized_name_search_idx/);
  await db.exec('SET enable_seqscan = on');

  // 妨害検証：DB側のカナ変換を壊すと同じ検索でカナ表記が漏れることを確認。
  await db.exec(`
    CREATE OR REPLACE FUNCTION public.normalize_therapist_search_name(value text)
    RETURNS text LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = ''
    AS $$ SELECT replace(value, '　', '') $$;
  `);
  assert.notDeepEqual(new Set(await search('天音シオリ', ['relax'])), new Set(['amane', 'partial']));
  // 元のmigrationを再適用し、自己検証と検索が回復することを確認。
  await db.exec(migration);
  assert.deepEqual(await search('天音シオリ', ['relax']), ['amane', 'partial']);
  console.log('PASS: SQL normalization, retrieval-before-limit, shop AND, RLS, literal wildcards, result bound, index, mutation verification');
} finally {
  await db.close();
}
