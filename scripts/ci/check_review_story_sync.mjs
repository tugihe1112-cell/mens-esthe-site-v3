/**
 * check_review_story_sync.mjs
 * 口コミ本文の「区分」が、クライアントとDBで一致しているかを検証する。
 *
 * 【なぜ必要か】
 * 区分（story_sections のキー）は **4箇所** に散らばって影響する:
 *   ① src/features/reviews/reviewStory.mjs   … 組み立て・文字数（唯一の定義元）
 *   ② supabase_migrations の compose_review_story_content … DB側の本文組み立て
 *   ③ supabase_migrations の review_story_char_length     … DB側の200/700字判定
 *   ④ reviews_story_sections_shape の許可キー一覧          … DB側の型チェック
 * どれか1つでも欠けると「画面では書けたのにDBが拒否する」または
 * 「保存はできたが本文が欠ける」という壊れ方をする。
 * 2026-08-26 に列権限で同型の事故（投稿が4日間できない）を起こしているため機械で止める。
 *
 * 実行: node scripts/ci/check_review_story_sync.mjs
 */
import fs from 'fs';
import path from 'path';

const violations = [];

// ── ① クライアント側の区分ID ────────────────────────────────────────
const clientPath = 'src/features/reviews/reviewStory.mjs';
const clientSrc = fs.readFileSync(clientPath, 'utf-8');
const clientIds = [...clientSrc.matchAll(/\{\s*id:\s*(?:'([a-z_]+)'|RATINGS_NOTE_ID)/g)]
  .map((m) => m[1] || 'ratings_note');
// STORY_SECTIONS の定義範囲だけに絞る（RATING_AXES と混ざらないように）
const secBlock = clientSrc.match(/export const STORY_SECTIONS = \[([\s\S]*?)\];/);
const sectionIds = secBlock
  ? [...secBlock[1].matchAll(/id:\s*(?:'([a-z_]+)'|RATINGS_NOTE_ID)/g)].map((m) => m[1] || 'ratings_note')
  : [];

if (sectionIds.length === 0) {
  violations.push(`${clientPath} から STORY_SECTIONS を読み取れない。書き方を変えたらこの検査も更新すること。`);
}

// ── ②③④ SQL 側（最後に定義されたものが本番の姿）────────────────────
const dir = 'supabase_migrations';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
let composeKeys = null;
let lengthKeys = null;
let shapeKeys = null;

for (const f of files) {
  const sql = fs.readFileSync(path.join(dir, f), 'utf-8');

  const compose = sql.match(/FUNCTION public\.compose_review_story_content[\s\S]*?\$\$([\s\S]*?)\$\$;/);
  if (compose) composeKeys = [...compose[1].matchAll(/sections ->> '([a-z_]+)'/g)].map((m) => m[1]);

  const len = sql.match(/FUNCTION public\.review_story_char_length[\s\S]*?\$\$([\s\S]*?)\$\$;/);
  if (len) lengthKeys = [...len[1].matchAll(/sections ->> '([a-z_]+)'/g)].map((m) => m[1]);

  const shape = sql.match(/ADD CONSTRAINT reviews_story_sections_shape[\s\S]*?ARRAY\[([^\]]*)\]::text\[\]/);
  if (shape) shapeKeys = [...shape[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
}

const eq = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);
const show = (a) => (a ? a.join(', ') : '(読み取れず)');

if (!composeKeys) violations.push('SQLに compose_review_story_content が見つからない');
if (!lengthKeys) violations.push('SQLに review_story_char_length が見つからない');
if (!shapeKeys) violations.push('SQLに reviews_story_sections_shape の許可キーが見つからない');

if (sectionIds.length && composeKeys && !eq(sectionIds, composeKeys)) {
  violations.push(
    'クライアントの区分とDBの本文組み立てがズレています。\n' +
    `        クライアント: ${show(sectionIds)}\n` +
    `        DB(compose)  : ${show(composeKeys)}\n` +
    '        → 順序も一致させること。ズレると保存本文とCHECK制約が食い違い投稿できなくなる。'
  );
}
if (sectionIds.length && lengthKeys) {
  const missing = sectionIds.filter((k) => !lengthKeys.includes(k));
  if (missing.length) {
    violations.push(
      `DBの文字数集計に含まれていない区分があります: ${missing.join(', ')}\n` +
      '        → 画面のカウンターとDBの200字判定がズレ、「画面は達成なのに投稿が拒否される」状態になる。'
    );
  }
}
if (sectionIds.length && shapeKeys) {
  const missing = sectionIds.filter((k) => !shapeKeys.includes(k));
  if (missing.length) {
    violations.push(
      `DBの許可キーに無い区分があります: ${missing.join(', ')}\n` +
      '        → CHECK制約違反(23514)で投稿が必ず失敗する。'
    );
  }
}

// ── 表示側が全区分を描けるか（採点コメントだけ表示漏れ、を防ぐ）────────
const viewPath = 'src/components/ReviewStoryContent.jsx';
const viewSrc = fs.readFileSync(viewPath, 'utf-8');
if (!/STORY_SECTIONS/.test(viewSrc)) {
  violations.push(
    `${viewPath} が STORY_SECTIONS を使っていない。\n` +
    '        区分を足したときに**表示だけ漏れる**（保存はされるのに読者に見えない）ため、\n' +
    '        必ず定義元を回して描くこと。'
  );
}

if (violations.length) {
  console.error('\n🚨 口コミの区分定義がクライアントとDBでズレています:\n');
  violations.forEach((v) => console.error('  - ' + v + '\n'));
  process.exit(1);
}

console.log(`✅ 口コミ区分の同期チェック OK（${sectionIds.length}区分: ${sectionIds.join(', ')}）`);
