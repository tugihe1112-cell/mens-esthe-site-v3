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
requirePattern(
  'src/pages/LoginPage.jsx',
  /requestedRedirect\.startsWith\(['"]\/['"]\)[\s\S]{0,160}!requestedRedirect\.startsWith\(['"]\/\/['"]\)/,
  'ログイン後の redirect が同一サイト内パスに制限されていません'
);

if (violations.length) {
  console.error('\n🚨 新着口コミメール→管理画面の導線が壊れています:\n');
  violations.forEach((violation) => console.error(`  - ${violation}`));
  process.exit(1);
}

console.log('✅ 新着口コミメール→管理画面チェック OK');
