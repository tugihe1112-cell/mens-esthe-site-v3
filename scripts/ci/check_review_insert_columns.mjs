/**
 * check_review_insert_columns.mjs
 * アプリが reviews に INSERT する列と、SQLで GRANT した許可列の食い違いを検出する。
 *
 * 【事故】2026-08-26、口コミ投稿が**4日間まったくできない**状態だった。
 *   14_review_story_sections.sql で `story_sections` 列を足したとき、
 *   12_lock_privileges_and_reviews_rls.sql の
 *   `GRANT INSERT (…列を列挙…) ON public.reviews TO authenticated` を更新し忘れた。
 *   → `permission denied for column story_sections`（SQLSTATE 42501）
 *   → アプリは42501を「セッション切れ」と誤案内 → 原因に辿り着けない。
 *
 * 【なぜテストをすり抜けたか】マイグレーションのE2Eを **service_role** で流していた。
 *   service_role は列単位の GRANT を迂回するので、一般ユーザーでは通らないINSERTが通ってしまう。
 *
 * 【この検査の役割】
 *   列の追加は「テーブル定義」と「権限」の2箇所を同時に直す必要があるが、
 *   人間はほぼ確実に片方を忘れる（実際に忘れた）。だから機械で突き合わせる。
 *
 * 実行: node scripts/ci/check_review_insert_columns.mjs
 */
import fs from 'fs';
import path from 'path';

const violations = [];

// ── ① アプリが送る列を DataContext から抽出 ────────────────────────────
const ctxPath = 'src/contexts/DataContext.jsx';
const ctx = fs.readFileSync(ctxPath, 'utf-8');

// `supabase.from('reviews').insert([{ ... }])` の中身を取り出す
const m = ctx.match(/from\('reviews'\)\s*\.insert\(\s*\[\s*\{([\s\S]*?)\}\s*\]\s*\)/);
if (!m) {
  violations.push(
    `${ctxPath} から reviews への INSERT が見つからない。\n` +
    '        書き方を変えた場合はこの検査も更新すること（黙って素通りさせない）。'
  );
}

const appColumns = new Set();
if (m) {
  const body = m[1]
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  // `列名:` の形だけを拾う（ネストした値の中のキーは深さで除外する）
  let depth = 0;
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (depth === 0) {
      const km = trimmed.match(/^([a-z_][a-z0-9_]*)\s*:/i);
      if (km) appColumns.add(km[1]);
    }
    depth += (line.match(/[[{(]/g) || []).length;
    depth -= (line.match(/[\]})]/g) || []).length;
    if (depth < 0) depth = 0;
  }
}

// ── ② SQL で GRANT された列を集める ───────────────────────────────────
const dir = 'supabase_migrations';
const granted = new Set();
for (const f of fs.readdirSync(dir).sort()) {
  if (!f.endsWith('.sql')) continue;
  const sql = fs.readFileSync(path.join(dir, f), 'utf-8');
  // GRANT INSERT ( … ) ON public.reviews
  const re = /GRANT\s+INSERT\s*\(([^)]*)\)\s*ON\s+(?:public\.)?reviews/gi;
  let g;
  while ((g = re.exec(sql)) !== null) {
    for (const c of g[1].split(',')) {
      const name = c.trim().replace(/["\s]/g, '');
      if (name) granted.add(name);
    }
  }
}

if (granted.size === 0) {
  violations.push(
    `${dir} に reviews への GRANT INSERT が1つも見つからない。\n` +
    '        12_lock_privileges_and_reviews_rls.sql の列単位GRANTが消えていないか確認すること。'
  );
}

// ── ③ 突き合わせ ─────────────────────────────────────────────────────
if (appColumns.size && granted.size) {
  const missing = [...appColumns].filter((c) => !granted.has(c));
  if (missing.length) {
    violations.push(
      `アプリが reviews に INSERT する列のうち、SQLで許可されていない列があります: ${missing.join(', ')}\n` +
      `        → このままだと一般ユーザーの投稿が\n` +
      `          「permission denied for column …」(42501) で**必ず失敗**します。\n` +
      `        → supabase_migrations に GRANT INSERT (列名) ON public.reviews TO authenticated; を追加し、\n` +
      `          本番のSupabaseにも適用すること。\n` +
      `        ⚠️ service_role は列GRANTを迂回するため、管理用スクリプトでは再現しません。`
    );
  }
}

if (violations.length) {
  console.error('\n🚨 口コミ投稿が壊れる可能性のある不整合を検出しました:\n');
  violations.forEach((v) => console.error('  - ' + v + '\n'));
  process.exit(1);
}

console.log(`✅ reviews INSERT列チェック OK（アプリ${appColumns.size}列 / 許可${granted.size}列）`);
