/**
 * タグ定義が src/data/constants.js の1箇所に保たれているかを検査する。
 *
 * 【なぜ必要か（2026-09-04 実測）】
 *   同じタグ定義が **4箇所** に重複し、既に食い違っていた:
 *     - src/data/constants.js（投稿画面）      … 属性4個
 *     - src/pages/SearchPage.jsx              … 属性5個（「新人」が余分）
 *     - src/pages/ShopDetailPage.jsx          … 属性5個（同上）
 *     - scripts/maintenance/insert_owner_review.mjs … 同上
 *   結果、**検索の絞り込みには「新人」ボタンがあるのに投稿画面では選べない**という状態になり、
 *   誰も付けられないタグが常時0件で並んでいた。
 *   コメントで「同一に保つこと」と書いても必ず割れる（D-011 で同じ事故を経験済み）ので機械で止める。
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SOURCE = 'src/data/constants.js';

// タグ定義を持ってはいけない（constants.js から import すべき）ファイル
const MUST_IMPORT = [
  'src/pages/SearchPage.jsx',
  'src/pages/ShopDetailPage.jsx',
  'scripts/maintenance/insert_owner_review.mjs',
];

// 実際のタグ文字列。これが constants.js 以外に**配列リテラルとして**現れたら重複定義とみなす。
const SAMPLE_TAGS = ['スレンダー', '可愛い系', '20代前半', '色白'];

const errors = [];

// ① 定義元が存在すること
const srcPath = path.join(ROOT, SOURCE);
if (!fs.existsSync(srcPath)) {
  errors.push(`[TAG] 定義元 ${SOURCE} が見つからない`);
} else {
  const src = fs.readFileSync(srcPath, 'utf8');
  if (!/export const TAG_CATEGORIES/.test(src) || !/export const AVAILABLE_TAGS/.test(src)) {
    errors.push(`[TAG] ${SOURCE} から TAG_CATEGORIES / AVAILABLE_TAGS の export が消えている`);
  }
}

// ② 他のファイルがタグを直書きしていないこと
for (const rel of MUST_IMPORT) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) continue;
  const code = fs.readFileSync(p, 'utf8')
    // コメント内の言及（このガードの説明文など）は対象外にする
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  const directCount = SAMPLE_TAGS.filter(t => code.includes(`'${t}'`) || code.includes(`"${t}"`)).length;
  if (directCount >= 2) {
    errors.push(
      `[TAG] ${rel} がタグを直書きしている（${directCount}種を検出）。\n` +
      `      src/data/constants.js から import すること。\n` +
      `      直書きすると投稿画面と検索の絞り込みが食い違い、"誰も付けられないタグ"が生まれる。`
    );
  }

  if (!/from ['"].*data\/constants(\.js)?['"]/.test(code)) {
    errors.push(`[TAG] ${rel} が src/data/constants.js を import していない`);
  }
}

if (errors.length) {
  console.error('\n❌ タグ定義の一元化チェックに失敗\n');
  errors.forEach(e => console.error(e + '\n'));
  process.exit(1);
}

// 参考情報として現在のタグ数を出す
const src = fs.readFileSync(srcPath, 'utf8');
const tagCount = (src.match(/'[^']+'/g) || []).filter(s => !/^'(body|vibe|age|attribute|■|BODY|ATMOSPHERE|AGE|ATTRIBUTES)/.test(s)).length;
console.log(`✅ タグ定義の一元化チェック OK（定義元 ${SOURCE} のみ）`);
