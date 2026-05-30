import React, { useState, useEffect } from 'react';

// 画像なし用のインライン SVG（外部リクエスト不要）
const NO_IMAGE_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'><rect width='300' height='400' fill='%231e293b'/><circle cx='150' cy='155' r='55' fill='%23334155'/><ellipse cx='150' cy='310' rx='90' ry='65' fill='%23334155'/><text x='150' y='370' text-anchor='middle' font-size='13' fill='%2394a3b8' font-family='sans-serif'>NO IMAGE</text></svg>`;

const SUPABASE_STORAGE = 'azuetkuzzmshqfbrhqmf.supabase.co/storage';

// Supabase Storage の画像URLをWebP変換URLに変換
function toWebP(src, width = 800) {
  if (!src || !src.includes(SUPABASE_STORAGE)) return src;
  // /object/public/ → /render/image/public/ に変換してWebPパラメータを付与
  return src
    .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    + `?width=${width}&format=webp&quality=80`;
}

export default function LazyImage({ src, alt, className = '', fallback = NO_IMAGE_SVG, width = 800 }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [src]);

  if (!src || error) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img
          src={fallback}
          alt={alt}
          className="w-full h-full object-cover opacity-100"
        />
      </div>
    );
  }

  const optimizedSrc = toWebP(src, width);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-slate-700 animate-pulse z-10" />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          // WebP変換URLが失敗したら元のURLで再試行
          if (optimizedSrc !== src) {
            // フォールバックとして元URLを使う
            setError(false);
          } else {
            setError(true);
          }
        }}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
