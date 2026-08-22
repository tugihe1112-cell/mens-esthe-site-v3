/**
 * 本番事故として一度発生した認証・通知・権限・デモ実装の回帰を、デプロイ前に止める。
 * 網羅的なセキュリティ検査ではなく「既知の事故パターンを二度と戻さない」ためのガード。
 */
import fs from 'fs';

const violations = [];
const read = (path) => {
  try { return fs.readFileSync(path, 'utf8'); } catch { return null; }
};
const requireMatch = (path, pattern, message) => {
  const source = read(path);
  if (source === null || !pattern.test(source)) violations.push(`${path}: ${message}`);
};
const forbidMatch = (path, pattern, message) => {
  const source = read(path);
  if (source !== null && pattern.test(source)) violations.push(`${path}: ${message}`);
};

if (fs.existsSync('api/send-confirmation.js')) {
  violations.push('api/send-confirmation.js: 任意メールへ確認リンクを送れる旧公開APIを復活させないこと');
}

for (const obsoletePath of ['src/App.jsx', 'src/main.jsx', 'src/pages/LoginPage.jsx.backup_ui']) {
  if (fs.existsSync(obsoletePath)) {
    violations.push(`${obsoletePath}: Next.js移行前の入口・デモ認証を現行ソースへ戻さないこと`);
  }
}
forbidMatch('.npmrc', /legacy-peer-deps\s*=\s*true/, '依存競合を隠すlegacy-peer-depsを有効にしている');

requireMatch('api/auth-email-hook.js', /new Webhook\(secret\)\.verify/, 'Standard Webhooks署名検証がない');
requireMatch('api/auth-email-hook.js', /Invalid hook signature/, '不正署名を拒否する処理がない');
forbidMatch('api/auth-email-hook.js', /JSON\.stringify\(req\.body[^)]*\)\.slice/, '認証トークンを含む本文をログへ出している');

requireMatch('api/og.js', /ALLOWED_IMAGE_HOSTS/, 'OG画像の取得先allowlistがない');
requireMatch('api/og.js', /url\.protocol !== 'https:'/, 'HTTPS以外の画像URLを拒否していない');
requireMatch('api/track-view.js', /consumeRateLimit/, 'service_role閲覧更新APIにレート制限がない');
requireMatch('api/notify-review.js', /scope: 'notify-review-user'/, '口コミ通知の連打防止がない');
requireMatch('api/notify-review.js', /\/admin\?review=\$\{encodeURIComponent\(review\.id\)\}/, '新着口コミメールが対象口コミへの管理画面直リンクになっていない');
requireMatch('src/pages/AdminPage.jsx', /new URLSearchParams\(location\.search[^)]*\)\.get\(['"]review['"]\)/, '管理画面が通知メールのreview指定を受け取っていない');
requireMatch('src/pages/AdminPage.jsx', /scrollIntoView\(/, '通知メールで指定された口コミへ自動移動しない');
forbidMatch('api/contact.js', /skipped:\s*['"]no_resend_key/, 'メール未設定時に送信成功扱いしている');
forbidMatch('api/notify-review.js', /skipped:\s*['"]no_resend_key/, '通知未設定時に成功扱いしている');

requireMatch('src/components/SeoHead.jsx', /from 'next\/head'/, 'Next.jsの正式なHead管理を使っていない');
requireMatch('pages/request-review.jsx', /destination:\s*['"]\/post-review['"]/, '旧デモ投稿画面を正規投稿へ転送していない');
requireMatch('src/pages/ResetPasswordPage.jsx', /auth\.updateUser\(\{ password \}\)/, 'パスワード再設定処理がない');
requireMatch('src/pages/MyReviewsPage.jsx', /\.eq\(['"]user_id['"], user\.id\)/, '自分の口コミをDBから取得していない');

forbidMatch('src/context/AppContext.tsx', /submitExistingShopReview|mens_esthe_local_reviews[^'].*setItem/, 'ブラウザだけに保存するデモ口コミが復活している');
requireMatch('src/context/AppContext.tsx', /mens_esthe_favorites:\$\{user\.id\}/, 'お気に入りがユーザー別に分離されていない');
requireMatch('src/pages/FavoritesPage.jsx', /favTherapistList\.length === 0 && favShopList\.length > 0 \? 'shops'/, '店舗だけ保存した会員に空のセラピストタブを初期表示している');
requireMatch('src/pages/ShopDetailPage.jsx', /Array\.isArray\(cloudTherapists\) && cloudTherapists\.length > 0/, '店舗詳細がnullのセラピスト配列でクラッシュする');
requireMatch('src/pages/BoardPage.jsx', /await authHeaders\(/, '掲示板がログインJWTを送っていない');
requireMatch('src/pages/ChatRoomPage.jsx', /await authHeaders\(/, 'チャットがログインJWTを送っていない');

requireMatch('scripts/lib/r2Upload.mjs', /startsWith\(['"]image\//, 'R2保存前のContent-Type検査がない');
requireMatch('scripts/lib/imageDeliveryQuality.mjs', /image signature mismatch/, '画像の実バイト検査がない');
requireMatch('scripts/monitoring/check_image_health.mjs', /FULL_SCAN/, '全画像を検査するモードがない');
requireMatch('.github/workflows/image-health.yml', /--all --no-history/, '定期的な全画像実体監査がない');

for (const migration of [
  'supabase_migrations/20_harden_community_rls_and_integrity.sql',
  'supabase_migrations/21_consolidate_read_policies_and_indexes.sql',
]) {
  if (!fs.existsSync(migration)) violations.push(`${migration}: 本番適用済みマイグレーションがリポジトリにない`);
}

const packageJson = JSON.parse(read('package.json') || '{}');
const nextMajor = Number(String(packageJson.dependencies?.next || '').match(/\d+/)?.[0] || 0);
const ogMajor = Number(String(packageJson.dependencies?.['@vercel/og'] || '').match(/\d+/)?.[0] || 0);
if (nextMajor < 16) violations.push('package.json: 脆弱性修正版のNext.js 16以上が必要');
if (ogMajor < 1) violations.push('package.json: 脆弱性修正版の@vercel/og 1以上が必要');

if (violations.length) {
  console.error('\n🚨 既知の本番事故を再発させる変更が検出されました:\n');
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exit(1);
}

console.log('✅ セキュリティ・整合性の回帰チェック OK');
