/**
 * check_guard_parity.mjs
 * 「手元の npm run build で通れば、CIも必ず通る」状態を保証する。
 *
 * 【事故】2026-08-26、口コミの区分を4→5に増やしたとき、
 *   手元の `npm run build` は成功したのに **GitHub Actions のCIだけが失敗**した。
 *   原因は ci.yml と check_release_guards.mjs が **別々のガードを並べていた**こと。
 *     - CI専用       : therapist_image_quality / admin_review_notification /
 *                      review_story_format / core_safety_guards（4本）
 *     - prebuild専用 : undefined_refs / ssr_helpers / review_insert_columns /
 *                      review_story_sync / monitor_resilience（5本）
 *     - 共通         : design_decisions（1本だけ）
 *   ＝ 手元のビルド成功が「CIも通る」ことを何も保証していなかった。
 *
 * 【この検査】
 * ci.yml が個別のガードを直接呼んでいないこと（＝一覧を二重管理していないこと）を確認する。
 * ガードを足すときは check_release_guards.mjs に1行足すだけでよい。
 */
import fs from 'fs';

const violations = [];

const guardsSrc = fs.readFileSync('scripts/ci/check_release_guards.mjs', 'utf-8');
const listed = [...guardsSrc.matchAll(/await import\('\.\/([a-z_]+\.mjs)'\)/g)].map((m) => m[1]);

if (listed.length === 0) {
  violations.push('check_release_guards.mjs からガードの一覧を読み取れない。書き方を変えたらこの検査も更新すること。');
}

// ci.yml が個別のガードを直接叩いていないか
const ciPath = '.github/workflows/ci.yml';
if (fs.existsSync(ciPath)) {
  const ci = fs.readFileSync(ciPath, 'utf-8');
  const direct = [...ci.matchAll(/node scripts\/ci\/([a-z_]+\.mjs)/g)]
    .map((m) => m[1])
    .filter((f) => f !== 'check_release_guards.mjs');
  if (direct.length) {
    violations.push(
      `${ciPath} が個別のガードを直接実行しています: ${[...new Set(direct)].join(', ')}\n` +
      '        → 一覧が二重管理になり、手元で通ってもCIが落ちる状態に戻ります。\n' +
      '        → check_release_guards.mjs に集約し、ci.yml はそれだけを呼ぶこと。'
    );
  }
  if (!/check_release_guards\.mjs/.test(ci)) {
    violations.push(`${ciPath} が check_release_guards.mjs を実行していません。`);
  }
}

// 一覧に書かれたファイルが実在するか（名前を間違えると静かに素通りする）
for (const f of listed) {
  if (!fs.existsSync(`scripts/ci/${f}`)) {
    violations.push(`check_release_guards.mjs が存在しないガードを読み込んでいます: ${f}`);
  }
}

if (violations.length) {
  console.error('\n🚨 ガードの一覧が二重管理になっています（手元とCIで結果が食い違います）:\n');
  violations.forEach((v) => console.error('  - ' + v + '\n'));
  process.exit(1);
}

console.log(`✅ ガード一覧の一致チェック OK（${listed.length}本を手元・CIの両方で実行）`);
