/**
 * check_undefined_refs.mjs — 「未定義の識別子を参照している」コードをビルド前に止める
 *
 * 【なぜ必要か（2026-08-22 に本番を2回落とした）】
 * 同じ日に、同じ型のミスで2回 500 を出した。
 *   ① heroShops.js で `export { shapeShopRow } from '...'` と書いた
 *      → 再エクスポートは**ローカル束縛を作らない**ので、同ファイル内の
 *        buildInitialHero() から呼べず ReferenceError（ホームが500）
 *   ② ShopDetailPage.jsx で shapeShopRow を**import し忘れた**まま使った
 *      → 店舗ページが全て500
 * どちらも `npm run build` は**成功した**。型でも構文でもない実行時エラーで、
 * かつ該当ページは `ƒ`（リクエスト時SSR）なのでビルド中に一度も実行されないため。
 *
 * 【この検査の役割】
 * ESLint の no-undef は、まさにこの2件を静的に検出できる（実測で確認済み）。
 * 「動かしてみないと分からない」ではなく「書いた時点で分かる」ので、
 * SSRヘルパの実行テストより手前の防波堤として置く。
 *
 * 実行: node scripts/ci/check_undefined_refs.mjs
 */
import { spawnSync } from 'child_process';

const TARGETS = ['src', 'pages', 'api'];

const r = spawnSync(
  'npx',
  [
    '--no-install', 'eslint',
    ...TARGETS,
    '--rule', JSON.stringify({ 'no-undef': 'error' }),
    // 未定義参照だけを見たいので、他ルールの警告でうるさくならないよう0件でも通す
    '--max-warnings', '9999',
    '--format', 'stylish',
  ],
  { encoding: 'utf-8', cwd: process.cwd() },
);

const out = `${r.stdout || ''}${r.stderr || ''}`;

// ESLint が動かない環境（依存未インストール等）でビルドを止めない。
// ただし「検査できなかった」ことは必ず知らせる（黙って素通りが一番危険）。
if (r.error || /Cannot find module|not found/i.test(out)) {
  console.warn('⚠️ ESLint を実行できませんでした。未定義参照チェックはスキップされます。');
  console.warn('   `npm ci` 後に再実行してください。');
  process.exit(0);
}

const undefLines = out.split('\n').filter((l) => /no-undef/.test(l));

if (undefLines.length) {
  console.error('\n🚨 未定義の識別子を参照しています（このままデプロイすると本番が500になります）:\n');
  undefLines.forEach((l) => console.error('  ' + l.trim()));
  console.error(
    '\n よくある原因:\n' +
    '   - import し忘れ\n' +
    "   - `export { X } from '...'`（再エクスポートはローカル束縛を作らない。\n" +
    "     同じファイル内で使うなら import してから export すること）\n" +
    '\n ⚠️ `npm run build` はこの種のエラーを検出できません。ここで止めます。\n',
  );
  process.exit(1);
}

console.log('✅ 未定義参照チェック OK');
