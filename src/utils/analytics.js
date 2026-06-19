// GA4 計測ヘルパー（Next.jsアプリ用）
// ⚠️ 重要: GAタグは旧Viteの index.html にしか無く、Next.js移行後は読み込まれていなかった
//    （＝本番で一切計測されていなかった。GA4の"143イベント"は旧Vite時代の残存データ）。
//    pages/_app.jsx で next/script を使って正式にロードする。
export const GA_ID = 'G-EQ2V44DN4X';

// カスタムイベント送信（gtag未ロード時・SSR時は安全に無視）
export function trackEvent(name, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}
