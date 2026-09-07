/**
 * 新着口コミメール→管理画面の回帰ガード。
 *
 * 2026-08-22、通知メールの /admin をメールアプリ内ブラウザで開くと、
 * セッションが無いまま AdminPage が null を返し、何も表示されなかった。
 * メールに口コミIDも無く、開けても対象を探す必要があった。
 * この導線は複数ファイルに跨がるため、どれか一つの変更で壊れないようCIで検査する。
 */
import fs from 'fs';

const violations = [];
const read = (path) => {
  try { return fs.readFileSync(path, 'utf8'); } catch { return ''; }
};
const requirePattern = (path, pattern, message) => {
  const source = read(path);
  if (!source) violations.push(`${path} が見つかりません`);
  else if (!pattern.test(source)) violations.push(message);
};

requirePattern(
  'api/notify-review.js',
  /\/admin\?review=/,
  '新着口コミメールから review ID 付きの管理画面リンクが消えています'
);
requirePattern(
  'api/notify-review.js',
  /auth\.getUser\(token\)/,
  'notify-review が投稿者のJWTをSupabase Authで検証していません'
);
requirePattern(
  'api/notify-review.js',
  /review\.user_id[\s\S]{0,120}user\.id/,
  'notify-review が口コミ所有者とJWTのユーザーを照合していません'
);
requirePattern(
  'src/pages/PostReviewPage.jsx',
  /Authorization:[\s\S]{0,120}session\.access_token/,
  '投稿完了時のnotify-review呼び出しに認証トークンがありません'
);
requirePattern(
  'src/pages/PostReviewPage.jsx',
  /reviewId:\s*result\.reviewId/,
  '投稿完了時のnotify-review呼び出しに reviewId がありません'
);
requirePattern(
  'src/pages/AdminPage.jsx',
  /get\(['"]review['"]\)/,
  '管理画面がメールの review クエリを読んでいません'
);
requirePattern(
  'src/pages/AdminPage.jsx',
  /\/login\?redirect=/,
  '未ログイン時に管理画面へ戻る redirect 付きログイン導線がありません'
);
requirePattern(
  'src/pages/AdminPage.jsx',
  /setExpandedId\(target\.id\)/,
  '管理画面が指定された口コミを自動展開していません'
);
// ⚠️ 2026-09-07 更新（FIXES.md F01）:
//    以前ここは LoginPage 内の自前検証（requestedRedirect.startsWith('/') …）を
//    **文字列で**探していた。戻り先の検証を src/utils/authRedirect.mjs へ一本化した際に
//    このガードが新しい正しい実装に反応して落ちた。
//    検査そのものを外すのではなく、**同じ保護対象（ログイン後の遷移先が
//    同一サイト内パスに限られること）を、実際に関数を動かして確認する形**へ更新する。
requirePattern(
  'src/pages/LoginPage.jsx',
  /normalizeReturnTo\(\s*requestedRedirect/,
  'ログイン後の redirect が normalizeReturnTo を通っていません（自前検証に戻すと抜けが再発します）'
);

const hostileRedirects = [
  '//evil.example',
  '/%2F%2Fevil.example',
  'https://evil.example/admin',
  'javascript:alert(1)',
];
try {
  const { normalizeReturnTo } = await import('../../src/utils/authRedirect.mjs');
  for (const value of hostileRedirects) {
    const got = normalizeReturnTo(value, '/mypage');
    if (got !== '/mypage') {
      violations.push(`ログイン後の redirect が外部へ出ます: ${value} → ${got}`);
    }
  }
  // 管理画面へ戻す本来の導線は壊さないこと
  const adminPath = '/admin?review=r_1787333476619_i1oi0';
  if (normalizeReturnTo(adminPath, '/mypage') !== adminPath) {
    violations.push('メールからの /admin?review=... の戻り先が保持されません');
  }
} catch (error) {
  violations.push(`src/utils/authRedirect.mjs を読み込めません: ${error.message}`);
}

if (violations.length) {
  console.error('\n🚨 新着口コミメール→管理画面の導線が壊れています:\n');
  violations.forEach((violation) => console.error(`  - ${violation}`));
  process.exit(1);
}

console.log('✅ 新着口コミメール→管理画面チェック OK');
