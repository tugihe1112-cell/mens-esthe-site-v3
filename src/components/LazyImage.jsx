import React, { useState, useEffect, useRef } from 'react';
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
  const imgRef = useRef(null);

  // src変化時のリセット。ただし**キャッシュ済み画像はonLoadが発火しない**ため、
  // ここで`img.complete`を同期チェックして手動でloaded化する。
  // これをしないと、SPA遷移(一覧→詳細)や再フィルタで既にキャッシュにある画像が
  // onLoad不発→opacity-0のまま＝「ロード済みなのに透明で見えない」になる
  // （＝ハードリロードだと出るがクリック遷移だと出ない、の正体）。
  // リセットとcompleteチェックを同一effectで行うのが要点＝loadイベントとの巻き戻しレースを断つ。
  useEffect(() => {
    setError(false);
    setRetry(0);
    setLoaded(false);
    const img = imgRef.current;
    if (!img) return;
    // Reactの合成onLoadはSPA遷移/キャッシュ済み画像で発火を取りこぼすことがある
    // （＝ロード済みでも loaded=false のまま opacity-0 で透明）。
    // ネイティブの load リスナーを img に直付けし、さらに「登録より前に既にcomplete」も同期で拾う。
    // この2段構えで、①既にキャッシュ完了 ②これから完了 のどちらも確実に loaded 化する。
    const onload = () => setLoaded(true);
    img.addEventListener('load', onload);
    if (img.complete && img.naturalWidth > 0) setLoaded(true);
    return () => img.removeEventListener('load', onload);
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
      {/* スケルトンは画像の“裏”に敷く（z-10を付けない）。
          画像はloadされ次第この上に描画され裏を隠す＝表示が`loaded`stateに一切依存しない。
          onLoadの取りこぼし/再フェッチのレースで`loaded`がfalseのままでも、画像は必ず見える。 */}
      {!loaded && (
        <div className="absolute inset-0 bg-slate-700 animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={activeSrc}
        alt={alt}
        /* loading="lazy" は付けない。Next.jsのSPA遷移で挿入された画像に対し
           ネイティブlazyのIntersectionObserverが発火し損ね、画面内なのに永久に読み込まない
           （＝ハードリロードなら出るがクリック遷移だと出ない、の真犯人・Chromeで実証済み）。
           画像は600px WebP(~20KB)・Worker配信(無制限)なので即読みで問題なし。 */
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
        /* opacity で隠さない（loaded非依存）。relativeで裏のスケルトンより前面に。
           軽いフェードは残す（透明→不透明でなく、描画時に自然表示）。 */
        className="relative w-full h-full object-cover"
      />
    </div>
  );
}
