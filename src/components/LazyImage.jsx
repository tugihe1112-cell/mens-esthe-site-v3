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
  const [retry, setRetry] = useState(0); // R2の一時エラー(429等)用の再試行カウンタ

  useEffect(() => {
    setError(false);
    setLoaded(false);
    setRetry(0);
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
  const isR2 = optimizedSrc.includes('.workers.dev') || optimizedSrc.includes('.r2.dev');
  // 再試行時はキャッシュバスターを付けて確実に取り直す
  const activeSrc = retry > 0 ? `${optimizedSrc}${optimizedSrc.includes('?') ? '&' : '?'}_r=${retry}` : optimizedSrc;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-slate-700 animate-pulse z-10" />
      )}
      <img
        src={activeSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          // R2はWorker(workers.dev)配信に移行済み＝レート制限(429)が無くなったので、
          // 以前の3回バックオフは不要。ネットワーク瞬断用に1回だけ静かに取り直す。
          // 外部URL(wsrv経由)は死んでる確率が高いので即NO IMAGE。
          if (isR2 && retry < 1) {
            setTimeout(() => setRetry((n) => n + 1), 600);
          } else {
            setError(true);
          }
        }}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
