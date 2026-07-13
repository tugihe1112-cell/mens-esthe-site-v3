/**
 * r2-images Worker — R2バケットを workers.dev 経由で配信（r2.devのレート制限を回避）
 *
 * r2.dev(開発URL)はCloudflare公式に「レート制限あり・CDNキャッシュ不可・非本番用」。
 * このWorkerはR2バインディング(env.BUCKET)で直接読み、レート制限なしで配信する。
 * DBの image_url は r2.dev のままでOK（フロントの imageUrl.js がホストだけ差し替える）。
 *
 * デプロイ: Cloudflareダッシュボード → Workers & Pages → 新規Worker → このコードを貼付 → Deploy
 *           → Settings → Bindings → R2バケット追加（変数名 BUCKET / バケット mens-esthe-images）
 */
export default {
  async fetch(request, env) {
    // 読み取り専用
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''));

    // キー先頭を許可リストで制限（ホットリンク/バケット総なめ対策）
    const ALLOWED = ['therapist-images/', 'shop-logos/', 'shops/'];
    if (!key || !ALLOWED.some((p) => key.startsWith(p))) {
      return new Response('Not Found', { status: 404 });
    }

    const obj = await env.BUCKET.get(key);
    if (!obj || !obj.body) {
      return new Response('Not Found', { status: 404 });
    }

    const headers = new Headers();
    obj.writeHttpMetadata(headers); // 元のContent-Type等を復元
    headers.set('etag', obj.httpEtag);
    // 画像は不変（同一キー＝同一画像）。ブラウザに恒久キャッシュさせる。
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(request.method === 'HEAD' ? null : obj.body, { headers });
  },
};
