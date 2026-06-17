// 画像URL最適化ユーティリティ
// 目的: 外部CDNの巨大画像（数MB）をモバイルで軽量化する。
//  - Supabase Storage : Supabaseの画像変換(render/image)でWebP化
//  - Unsplash         : w パラメータを表示幅まで縮小（auto=formatで自動WebP）
//  - その他の外部画像  : images.weserv.nl(wsrv.nl) 経由でリサイズ+WebP化
// ※ wsrv.nl が失敗した場合は、呼び出し側(LazyImage / img onError)で元URLにフォールバックする。

const SUPABASE_STORAGE = 'azuetkuzzmshqfbrhqmf.supabase.co/storage';

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

  // その他の外部画像（http / https / プロトコル相対）→ weserv.nl でリサイズ+WebP化
  if (/^(https?:)?\/\//i.test(src)) {
    const abs = src.startsWith('//') ? `https:${src}` : src;
    return `https://wsrv.nl/?url=${encodeURIComponent(abs)}&w=${width}&output=webp&q=75&we`;
  }

  return src;
}
