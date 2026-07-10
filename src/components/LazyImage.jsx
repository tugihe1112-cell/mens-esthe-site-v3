import React, { useState, useEffect } from 'react';
import { optimizeImageUrl } from '../utils/imageUrl';

// 画像なし用のインライン SVG（外部リクエスト不要）
const NO_IMAGE_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'><rect width='300' height='400' fill='%231e293b'/><circle cx='150' cy='155' r='55' fill='%23334155'/><ellipse cx='150' cy='310' rx='90' ry='65' fill='%23334155'/><text x='150' y='370' text-anchor='middle' font-size='13' fill='%2394a3b8' font-family='sans-serif'>NO IMAGE</text></svg>`;

// 店舗サムネイルとして不適切なURL（ロゴ・アイコン・ファビコン系）
const ICON_PATTERNS = [
  'apple-touch-icon',
  '/shop_icon/',
  '/shop_logo/',
  'favicon',
  'h-logo',
  'header_logo',
  'visual-logo',
  'cropped-logo',
  'cropped-icon',
  'cropped-favicon',
];
function isIconUrl(src) {
  if (!src) return false;
  const lower = src.toLowerCase();
  return ICON_PATTERNS.some(p => lower.includes(p));
}

export default function LazyImage({ src, alt, className = '', fallback = NO_IMAGE_SVG, width = 800 }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [src]);

  if (!src || error || isIconUrl(src)) {
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

  const optimizedSrc = optimizeImageUrl(src, width);

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
        // 失敗したら即NO IMAGE。以前は「元URLで再試行」していたが、wsrv失敗→死んでる元URLで再試行＝5秒×2段の待ちになっていたので廃止（フェイルファスト）。
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
