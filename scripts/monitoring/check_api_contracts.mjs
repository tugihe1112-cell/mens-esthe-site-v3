/**
 * 本番APIの安全な契約テスト。メール送信・ユーザー作成・DB更新は行わない。
 * 認証必須APIが匿名アクセスを拒否し、公開APIが正しい型で応答することを確認する。
 */

const BASE = new URL(process.env.BASE_URL || 'https://www.mens-esthe-map.jp');
const UA = 'mens-esthe-map-api-contract/1.0';
const failures = [];

async function request(path, init = {}) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetch(new URL(path, BASE), {
        ...init,
        redirect: 'manual',
        headers: {
          'User-Agent': UA,
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...(init.headers || {}),
        },
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  throw lastError;
}

async function expectStatus(name, path, expected, init) {
  try {
    const response = await request(path, init);
    if (!expected.includes(response.status)) {
      failures.push(`${name}: HTTP ${response.status}（期待 ${expected.join('/')}）`);
    }
    return response;
  } catch (error) {
    failures.push(`${name}: 取得失敗 (${error.message})`);
    return null;
  }
}

const [sitemap, shops] = await Promise.all([
  expectStatus('sitemap GET', '/api/sitemap.xml', [200], { method: 'GET' }),
  expectStatus('shops-lite GET', '/api/shops-lite', [200], { method: 'GET' }),
]);
if (sitemap) {
  const body = await sitemap.text();
  if (!/application\/xml/i.test(sitemap.headers.get('content-type') || '')) failures.push('sitemap: Content-TypeがXMLではない');
  if ((body.match(/<loc>/g) || []).length < 15) failures.push('sitemap: locが少なすぎる');
}

if (shops) {
  try {
    const body = await shops.json();
    if (!Array.isArray(body) || body.length < 900) failures.push(`shops-lite: 店舗配列が不正 (${body?.length ?? 'not-array'})`);
  } catch { failures.push('shops-lite: JSONが不正'); }
}

await Promise.all([
  expectStatus('廃止API', '/api/send-confirmation', [410], { method: 'GET' }),
  expectStatus('cron匿名拒否', '/api/cron/retention-email', [401], { method: 'GET' }),
  expectStatus('管理者credits匿名拒否', '/api/admin-grant-credit', [401], { method: 'POST', body: '{}' }),
  expectStatus('credits通知匿名拒否', '/api/notify-credit', [401], { method: 'POST', body: '{}' }),
  expectStatus('口コミ通知匿名拒否', '/api/notify-review', [401], { method: 'POST', body: '{}' }),
  expectStatus('auth hook署名拒否', '/api/auth-email-hook', [401], { method: 'POST', body: '{}' }),
  expectStatus('signup入力拒否', '/api/auth/signup', [400], { method: 'POST', body: '{}' }),
  expectStatus('contact入力拒否', '/api/contact', [400], { method: 'POST', body: '{}' }),
  expectStatus('track-view空入力', '/api/track-view', [204], { method: 'POST', body: '{"ids":[]}' }),
]);

await Promise.all([
  '/api/sitemap.xml', '/api/shops-lite', '/api/admin-grant-credit', '/api/notify-credit',
  '/api/notify-review', '/api/auth-email-hook', '/api/auth/signup', '/api/contact', '/api/track-view',
].map((path) => expectStatus(`method制限 ${path}`, path, [405], { method: 'DELETE' })));

const og = await expectStatus('OG SSRF拒否', '/api/og?shop=test&image=http%3A%2F%2F127.0.0.1%2Fsecret', [200], { method: 'GET' });
if (og && !/^image\//i.test(og.headers.get('content-type') || '')) failures.push('OG: Content-Typeが画像ではない');

const home = await expectStatus('security headers', '/', [200], { method: 'GET' });
if (home) {
  const requiredHeaders = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
  };
  for (const [name, expected] of Object.entries(requiredHeaders)) {
    if (home.headers.get(name) !== expected) failures.push(`/: ${name}が不正`);
  }
  const csp = home.headers.get('content-security-policy') || '';
  for (const directive of ["object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'"]) {
    if (!csp.includes(directive)) failures.push(`/: CSPに ${directive} が無い`);
  }
}

if (failures.length) {
  console.error(`\n🚨 API契約監視で${failures.length}件の異常を検出:\n`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log('✅ 公開API・認証拒否・メソッド制限・セキュリティヘッダー正常');
