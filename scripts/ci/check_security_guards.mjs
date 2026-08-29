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

requireMatch('api/send-confirmation.js', /status\(410\)/, '廃止APIが明示的な410を返していない');
forbidMatch('api/send-confirmation.js', /RESEND|sendEmail|generateLink|supabase/i, '廃止APIへメール・Auth処理を戻さないこと');

for (const obsoletePath of ['src/App.jsx', 'src/main.jsx', 'src/pages/LoginPage.jsx.backup_ui']) {
  if (fs.existsSync(obsoletePath)) {
    violations.push(`${obsoletePath}: Next.js移行前の入口・デモ認証を現行ソースへ戻さないこと`);
  }
}
forbidMatch('.npmrc', /legacy-peer-deps\s*=\s*true/, '依存競合を隠すlegacy-peer-depsを有効にしている');
forbidMatch('vercel.json', /legacy-peer-deps/, '本番installで依存競合を隠している');
forbidMatch('.github/workflows/ci.yml', /legacy-peer-deps/, 'CI installで依存競合を隠している');
requireMatch('vercel.json', /"installCommand"\s*:\s*"npm ci"/, '本番installがlock厳守のnpm ciではない');
requireMatch('.github/workflows/ci.yml', /run:\s*npm ci\s*$/m, 'CI installがlock厳守のnpm ciではない');
requireMatch('.vercelignore', /^\.env$/m, 'Vercelへローカル.envがアップロードされ得る');
requireMatch('.vercelignore', /^\.env\.\*$/m, 'Vercelへ.env派生ファイルがアップロードされ得る');
requireMatch('.vercelignore', /^\.gcp-metrics-key\.json$/m, 'VercelへGCP鍵がアップロードされ得る');

requireMatch('api/auth-email-hook.js', /new Webhook\(secret\)\.verify/, 'Standard Webhooks署名検証がない');
requireMatch('api/auth-email-hook.js', /Invalid hook signature/, '不正署名を拒否する処理がない');
forbidMatch('api/auth-email-hook.js', /JSON\.stringify\(req\.body[^)]*\)\.slice/, '認証トークンを含む本文をログへ出している');

requireMatch('api/og.js', /ALLOWED_IMAGE_HOSTS/, 'OG画像の取得先allowlistがない');
requireMatch('api/og.js', /url\.protocol !== 'https:'/, 'HTTPS以外の画像URLを拒否していない');
requireMatch('api/track-view.js', /consumeRateLimit/, 'service_role閲覧更新APIにレート制限がない');
requireMatch('api/notify-review.js', /scope: 'notify-review-user'/, '口コミ通知の連打防止がない');
requireMatch('api/notify-review.js', /\/admin\?review=\$\{encodeURIComponent\(review\.id\)\}/, '新着口コミメールが対象口コミへの管理画面直リンクになっていない');
requireMatch('api/auth/signup.js', /if \(!adminNotifyResponse\.ok\)/, '新規登録の管理者通知失敗を検査していない');
requireMatch('src/pages/AdminPage.jsx', /new URLSearchParams\(location\.search[^)]*\)\.get\(['"]review['"]\)/, '管理画面が通知メールのreview指定を受け取っていない');
requireMatch('src/pages/AdminPage.jsx', /scrollIntoView\(/, '通知メールで指定された口コミへ自動移動しない');
forbidMatch('api/contact.js', /skipped:\s*['"]no_resend_key/, 'メール未設定時に送信成功扱いしている');
forbidMatch('api/notify-review.js', /skipped:\s*['"]no_resend_key/, '通知未設定時に成功扱いしている');

requireMatch('src/components/SeoHead.jsx', /from 'next\/head'/, 'Next.jsの正式なHead管理を使っていない');
requireMatch('pages/request-review.jsx', /destination:\s*['"]\/post-review['"]/, '旧デモ投稿画面を正規投稿へ転送していない');
requireMatch('src/pages/ResetPasswordPage.jsx', /auth\.updateUser\(\{ password \}\)/, 'パスワード再設定処理がない');
requireMatch('src/pages/MyReviewsPage.jsx', /\.eq\(['"]user_id['"], user\.id\)/, '自分の口コミをDBから取得していない');
requireMatch('src/components/LikeButton.jsx', /aria-pressed=/, 'いいねボタンの状態を支援技術へ伝えていない');
requireMatch('src/pages/RankingPage.jsx', /<label[^>]+htmlFor=["']ranking-area["']/, 'ランキング地域選択にアクセシブル名がない');
requireMatch('src/pages/SearchPage.jsx', /<h1[^>]*sr-only/, '検索ページに見出しがない');

forbidMatch('src/context/AppContext.tsx', /submitExistingShopReview|mens_esthe_local_reviews[^'].*setItem/, 'ブラウザだけに保存するデモ口コミが復活している');
requireMatch('src/context/AppContext.tsx', /mens_esthe_favorites:\$\{user\.id\}/, 'お気に入りがユーザー別に分離されていない');
requireMatch('src/pages/FavoritesPage.jsx', /favTherapistList\.length === 0 && favShopList\.length > 0 \? 'shops'/, '店舗だけ保存した会員に空のセラピストタブを初期表示している');
requireMatch('src/pages/ShopDetailPage.jsx', /Array\.isArray\(cloudTherapists\) && cloudTherapists\.length > 0/, '店舗詳細がnullのセラピスト配列でクラッシュする');
requireMatch('src/pages/BoardPage.jsx', /await authHeaders\(/, '掲示板がログインJWTを送っていない');
requireMatch('src/pages/ChatRoomPage.jsx', /await authHeaders\(/, 'チャットがログインJWTを送っていない');

requireMatch('scripts/lib/r2Upload.mjs', /startsWith\(['"]image\//, 'R2保存前のContent-Type検査がない');
requireMatch('scripts/lib/imageDeliveryQuality.mjs', /image signature mismatch/, '画像の実バイト検査がない');
requireMatch('scripts/lib/imageDeliveryQuality.mjs', /attempts = 3/, '一時的な画像配信遅延を再試行せず破損扱いしている');
requireMatch('scripts/monitoring/check_image_health.mjs', /FULL_SCAN/, '全画像を検査するモードがない');
requireMatch('.github/workflows/image-health.yml', /--all --no-history/, '定期的な全画像実体監査がない');
requireMatch('scripts/monitoring/check_site_integrity.mjs', /discoveredImages/, '公開ページが参照する画像の外形監視がない');
requireMatch('scripts/monitoring/check_site_integrity.mjs', /descriptionが短すぎる/, 'sitemap掲載ページのSEO文量を監視していない');
for (const path of [
  'src/pages/Home.jsx',
  'src/pages/AreaSearchPage.jsx',
  'src/pages/LoginPage.jsx',
  'src/pages/RegisterPage.jsx',
  'src/pages/RankingPage.jsx',
  'public/data/shops.json',
  'public/data/tokyo/toshima/ikebukuro/aromamore.json',
  'src/data/tokyo/toshima/ikebukuro/aromamore.json',
]) {
  forbidMatch(path, /images\.unsplash\.com/, '外部写真URLへ再依存すると削除・巨大配信で画面が壊れる');
}

for (const migration of [
  'supabase_migrations/20_harden_community_rls_and_integrity.sql',
  'supabase_migrations/21_consolidate_read_policies_and_indexes.sql',
  'supabase_migrations/22_enforce_shop_integrity_and_view_rls.sql',
]) {
  if (!fs.existsSync(migration)) violations.push(`${migration}: 本番適用済みマイグレーションがリポジトリにない`);
}
requireMatch('supabase_migrations/22_enforce_shop_integrity_and_view_rls.sql', /FOREIGN KEY \(shop_id\) REFERENCES public\.shops\(id\)/, 'セラピストの孤児データを防ぐ外部キーがない');
requireMatch('supabase_migrations/22_enforce_shop_integrity_and_view_rls.sql', /security_invoker\s*=\s*true/, '集計viewが基表RLSを継承していない');
requireMatch('.github/workflows/monitor.yml', /check_site_integrity\.mjs/, 'ページ・内部リンクの定期監視がない');
requireMatch('.github/workflows/monitor.yml', /check_api_contracts\.mjs/, 'API契約の定期監視がない');

const packageJson = JSON.parse(read('package.json') || '{}');
if (packageJson.dependencies?.['react-router-dom']) {
  violations.push('package.json: Next.js移行後に未使用のreact-router-domを本番依存へ戻している');
}
if (packageJson.scripts?.build !== 'next build --webpack') {
  violations.push('package.json: 制限環境で内部ポート作成に失敗するTurbopack本番buildへ戻している');
}
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
