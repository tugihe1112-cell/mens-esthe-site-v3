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
// ⚠️ 2026-09-08（DESIGN.md U05）: 以前は `sr-only` のH1であることまで要求していたが、
//    仕様が「画面に見えるH1を置く」に変わった。守りたいのは**H1が存在すること**なので、
//    検査は残したまま条件を実態へ合わせる（START.md §5）。
requireMatch('src/pages/SearchPage.jsx', /<h1[\s>]/, '検索ページに見出しがない');
requireMatch('src/pages/SearchPage.jsx', /セラピストを探す/, '検索ページのH1が用件を表していない');

forbidMatch('src/context/AppContext.tsx', /submitExistingShopReview|mens_esthe_local_reviews[^'].*setItem/, 'ブラウザだけに保存するデモ口コミが復活している');
requireMatch('src/context/AppContext.tsx', /mens_esthe_favorites:\$\{(?:user\.id|userId)\}/, 'お気に入りがユーザー別に分離されていない');
requireMatch('src/pages/FavoritesPage.jsx', /favTherapists\.length === 0 && favorites\.length > 0 \? 'shops'/, '店舗だけ保存した会員に空のセラピストタブを初期表示している');
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
requireMatch('scripts/monitoring/check_site_integrity.mjs', /fetchWithRetry/, 'ページ監視が一時的な通信失敗を確認し直さない');
requireMatch('scripts/monitoring/check_chunk_integrity.mjs', /chunksByUrl/, '共通JSチャンクをページごとに重複取得している');
requireMatch('scripts/monitoring/check_chunk_integrity.mjs', /retryStatuses:\s*\[404\]/, 'デプロイ境界の一時的なchunk 404を再確認しない');
forbidMatch('scripts/monitoring/check_chunk_integrity.mjs', /['"]Cache-Control['"]:\s*['"]no-cache/, '通常利用者と異なるno-cache経路ではstale HTML事故を見逃す');
requireMatch('scripts/lib/monitorFetch.mjs', /attempts\s*=\s*3/, '外形監視の既定再試行回数が3回でない');
requireMatch('scripts/lib/monitorFetch.mjs', /status\s*===\s*429[\s\S]*status\s*>?=\s*500/, '429・5xxを一時障害として再試行していない');
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
forbidMatch('src/data/heroShops.js', /url:\s*['"]https:\/\/(?!mens-esthe-images\.tugihe1112\.workers\.dev\/)/, '固定ヒーロー画像は外部公式サイトへ直リンクせず自社R2から配信する');
for (const path of ['src/data/shops.json', 'src/data/all_shops.json', 'public/data/all_shops.json']) {
  forbidMatch(path, /["'](?:image_url|image)["']\s*:\s*["']https:\/\/(?:linda-spa\.com|aromacharm\.net|tokyoaroma\.jp)\//, '固定表示画像の公式サイト直リンクを自社R2へ戻すこと');
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
for (const workflow of ['.github/workflows/ci.yml', '.github/workflows/monitor.yml', '.github/workflows/image-health.yml', '.github/workflows/roster-freshness.yml']) {
  requireMatch(workflow, /actions\/checkout@v7/, 'Node 20版checkout actionへ戻さない');
  requireMatch(workflow, /actions\/setup-node@v7/, 'Node 20版setup-node actionへ戻さない');
}

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

// Google の数字を読む鍵（2026-10-11）: Mac はファイル、クラウドは環境のネットワークシークレット（プロキシが付ける）。
// 鍵の読み方は scripts/lib/metricsAuth.mjs の1か所だけ。道具ごとに書くと、片方だけクラウドで読めない・値を表示する、が起きる。
// Search Console の窓口も同じ所の searchConsole() だけ（2026-10-12）: クラウドのプロキシは URL の途中の「%2F」を崩すので、
// 検索の数字（searchanalytics.query）は batch の本文で送り直している。道具が google.searchconsole を直接作ると、クラウドだけ 404 になる。
{
  const { selfTestMetricsAuth } = await import('../lib/metricsAuth.mjs');
  for (const problem of selfTestMetricsAuth()) violations.push(`scripts/lib/metricsAuth.mjs: ${problem}`);
  const metricsDir = 'scripts/metrics';
  for (const file of fs.readdirSync(metricsDir).filter((f) => f.endsWith('.mjs'))) {
    const path = `${metricsDir}/${file}`;
    // 説明のコメントは除く（行コメントを先に外す＝コメント内の「/*」で後ろを丸ごと消さない）
    const source = (read(path) || '').replace(/(^|[^:])\/\/.*$/gm, '$1').replace(/\/\*[\s\S]*?\*\//g, '');
    if (/new google\.auth\.GoogleAuth|keyFile\s*:|gcp-metrics-key\.json'\s*\)/.test(source)) {
      violations.push(`${path}: Google の鍵を自前で読んでいる（scripts/lib/metricsAuth.mjs の metricsAuth を使う）`);
    }
    if (/GCP_METRICS_KEY_JSON/.test(source)) {
      violations.push(`${path}: 鍵の中身（GCP_METRICS_KEY_JSON）を道具が直接触っている（表示・記録の事故のもと）`);
    }
    if (/\.searchconsole\s*\(/.test(source)) {
      violations.push(`${path}: Search Console の窓口を自前で作っている（scripts/lib/metricsAuth.mjs の searchConsole を使う＝クラウドで検索の数字が 404 になる）`);
    }
  }
  // batch で送り直すのはクラウド（プロキシ）のときだけ。Mac の毎朝の取得は googleapis の窓口のまま（通信はしない＝作るだけ）
  const { searchConsole } = await import('../lib/metricsAuth.mjs');
  const saved = process.env.CCR_AGENT_PROXY_ENABLED;
  try {
    delete process.env.CCR_AGENT_PROXY_ENABLED;
    if (Object.hasOwn((await searchConsole(undefined)).searchanalytics, 'query')) {
      violations.push('scripts/lib/metricsAuth.mjs: プロキシの無い Mac でも検索の数字を batch で送っている（毎朝の取得の通り道を変えない）');
    }
    process.env.CCR_AGENT_PROXY_ENABLED = '1';
    const cloudSc = await searchConsole(undefined);
    if (!Object.hasOwn(cloudSc.searchanalytics, 'query')) {
      violations.push('scripts/lib/metricsAuth.mjs: クラウドで検索の数字を batch で送っていない（プロキシが URL の「%2F」を崩して 404 になる）');
    } else {
      // 通信そのものが切れたとき（Node の fetch は "fetch failed" とだけ言う）、理由の文字が止まる文に入ること＝毎朝の再試行が効く。
      // 本物の通信はしない（fetch を差し替えて、切れた形の失敗を返す）
      const realFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        throw Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }) });
      };
      try {
        const msg = await cloudSc.searchanalytics.query({ siteUrl: 'https://www.example.com/', requestBody: {} })
          .then(() => '(止まらなかった)', (e) => e?.message || '');
        if (!/ECONNRESET/.test(msg)) {
          violations.push(`scripts/lib/metricsAuth.mjs: クラウドの batch で通信が切れたとき、理由（ECONNRESET など）が文に入らない＝再試行されずに止まる（実際の文: ${msg.slice(0, 80)}）`);
        }
      } finally {
        globalThis.fetch = realFetch;
      }
    }
  } finally {
    if (saved === undefined) delete process.env.CCR_AGENT_PROXY_ENABLED; else process.env.CCR_AGENT_PROXY_ENABLED = saved;
  }
}

if (violations.length) {
  console.error('\n🚨 既知の本番事故を再発させる変更が検出されました:\n');
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exit(1);
}

console.log('✅ セキュリティ・整合性の回帰チェック OK');
