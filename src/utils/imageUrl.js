// 画像URL最適化ユーティリティ
// 目的: 外部CDNの巨大画像（数MB）をモバイルで軽量化する。
//  - Supabase Storage : Supabaseの画像変換(render/image)でWebP化
//  - Unsplash         : w パラメータを表示幅まで縮小（auto=formatで自動WebP）
//  - その他の外部画像  : images.weserv.nl(wsrv.nl) 経由でリサイズ+WebP化
// ※ wsrv.nl が失敗した場合は、呼び出し側(LazyImage / img onError)で元URLにフォールバックする。

const SUPABASE_STORAGE = 'azuetkuzzmshqfbrhqmf.supabase.co/storage';

// R2画像の配信元。
//  - 旧: pub-xxx.r2.dev（開発URL・レート制限あり→429で「出たり出なかったり」）
//  - 新: Cloudflare Worker（workers.dev・R2バインディング直読み・レート制限なし）
// DBのimage_urlはr2.devのまま。ここでホスト部分だけWorkerに差し替える＝1行戻せば即ロールバック。
const R2_DEV_HOST = 'pub-1eb6e3f48a044dd9b5841a8f4be21a89.r2.dev';
const R2_WORKER_HOST = 'mens-esthe-images.tugihe1112.workers.dev';

export function optimizeImageUrl(src, width = 800) {
  if (!src || typeof src !== 'string') return src;
  if (src.startsWith('data:')) return src; // インラインSVG等はそのまま

  // Supabase Storage → render/image でWebP変換
  if (src.includes(SUPABASE_STORAGE)) {
    return src
      .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
      + `?width=${width}&format=webp&quality=80`;
  }

  // Unsplash → 巨大な w（w=2000等）を表示幅まで縮小
  if (src.includes('images.unsplash.com')) {
    return src.replace(/([?&])w=\d+/i, `$1w=${width}`);
  }

  // すでに wsrv 経由ならそのまま（二重プロキシ防止）
  if (src.includes('wsrv.nl') || src.includes('images.weserv.nl')) return src;

  // 自社R2 → r2.dev(レート制限あり)をWorker(workers.dev・制限なし)に差し替えて直接配信。
  // wsrvは挟まない（Worker側が既に速い・二重プロキシ回避）。
  if (src.includes(R2_DEV_HOST)) return src.replace(R2_DEV_HOST, R2_WORKER_HOST);
  if (src.includes('.workers.dev') || src.includes('.r2.dev') || src.includes('r2.cloudflarestorage.com')) return src;

  // その他の外部画像（http / https / プロトコル相対）→ weserv.nl でリサイズ+WebP化
  if (/^(https?:)?\/\//i.test(src)) {
    const abs = src.startsWith('//') ? `https:${src}` : src;
    return `https://wsrv.nl/?url=${encodeURIComponent(abs)}&w=${width}&output=webp&q=75&we`;
  }

  return src;
}
