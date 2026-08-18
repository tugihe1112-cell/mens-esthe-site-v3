/**
 * Next.js _app.jsx
 * main.jsx + App.jsx のProviderラッパー部分を移植。
 * BrowserRouter は不要（Next.js がルーティングを担う）。
 */
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '../src/contexts/AuthContext.jsx';
import { DataProvider } from '../src/contexts/DataContext.jsx';
import { AppProvider } from '../src/context/AppContext.tsx';
import ErrorBoundary from '../src/components/ErrorBoundary.jsx';
import ScrollToTop from '../src/components/ScrollToTop.jsx';
import BottomNav, { POST_REVIEW_ROUTES } from '../src/components/BottomNav.jsx';
import Footer from '../src/components/Footer.jsx';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { GA_ID } from '../src/utils/analytics';
import '../src/index.css';

const HIDE_NAV_PATHS = ['/login', '/register', '/404'];

// ── ChunkLoadError 自動リロード ────────────────────────────────────────
// 事故の型（lessons.md「SSR HTMLに長いSWRを付けたら個別ページが真っ黒に」）:
// CDNが古いHTMLを配信 → HTMLが指す旧ビルドIDのJSチャンクは既に消えている →
// `/_next/static/...js` が404（MIME text/plain）→ Reactが起動せず真っ黒。
// ユーザーは何も操作できない＝Googlebotも同じHTMLを踏んでインデックスが崩落する。
// 対策: script/chunkの読み込み失敗を検知したら1回だけハードリロードして
// 最新HTML+最新チャンクを取り直す。sessionStorageのフラグで無限ループを防ぐ
// （リロード後も直らない場合＝本当に壊れている場合は2度目を撃たない）。
const CHUNK_RELOAD_KEY = '__chunkReloadedAt';
const CHUNK_RELOAD_TTL_MS = 10 * 60 * 1000; // 10分。次のデプロイ事故では再度1回だけ撃てる

function isChunkLoadError(message, target) {
  // ① Next.js/webpack が投げる例外
  if (typeof message === 'string' &&
      /ChunkLoadError|Loading chunk \d+ failed|Loading CSS chunk|Importing a module script failed|Failed to fetch dynamically imported module/i.test(message)) {
    return true;
  }
  // ② <script src="/_next/static/...">自体の読み込み失敗（error イベントはキャプチャ段階でのみ拾える）
  if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
    const url = target.src || target.href || '';
    if (url.includes('/_next/static/')) return true;
  }
  return false;
}

function reloadOnceForChunkError(reason) {
  let last = 0;
  try { last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY)) || 0; } catch { return; }
  // 直近にリロード済み＝2度目は撃たない（無限ループ防止）
  if (last && Date.now() - last < CHUNK_RELOAD_TTL_MS) {
    console.error('[chunk-guard] リロード済みだが再発。無限ループ防止のため停止:', reason);
    return;
  }
  try { sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now())); } catch { return; }
  console.warn('[chunk-guard] JSチャンクの読み込み失敗を検知。最新HTMLを取り直します:', reason);
  // replace() でリロード＝履歴を汚さない。キャッシュされた古いHTMLを避けるため location.reload(true) 相当
  window.location.reload();
}

function ChunkErrorGuard() {
  React.useEffect(() => {
    // script/link の error はバブルしない → キャプチャ段階(true)で拾う
    const onError = (e) => {
      if (isChunkLoadError(e?.message || e?.error?.message, e?.target)) {
        reloadOnceForChunkError(e?.target?.src || e?.target?.href || e?.message);
      }
    };
    const onRejection = (e) => {
      const msg = e?.reason?.message || String(e?.reason || '');
      if (isChunkLoadError(msg, null)) reloadOnceForChunkError(msg);
    };
    window.addEventListener('error', onError, true);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError, true);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}

// ページ遷移中に上部プログレスバーを出す＝タップ直後に必ず反応が見える
// （SSRページはgetServerSidePropsのサーバー往復で数百msかかり、無表示だと「押しても無反応」に感じるため）
function RouteProgress() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    const start = () => setLoading(true);
    const done = () => {
      setLoading(false);
      // アプリ内でSPA遷移が1回でも起きたら印を付ける（戻るボタンのフォールバック判定に使う）
      try { sessionStorage.setItem('hasInternalNav', '1'); } catch { /* noop */ }
    };
    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', done);
    router.events.on('routeChangeError', done);
    return () => {
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', done);
      router.events.off('routeChangeError', done);
    };
  }, [router]);
  return loading ? <div className="route-progress" aria-hidden="true" /> : null;
}

function Layout({ children }) {
  const router = useRouter();
  const shouldHideNav = HIDE_NAV_PATHS.some(p => router.pathname === p);
  // 投稿フローではフッターも出さない（2026-08-17）。
  // BottomNav は以前から非表示にしていたのにフッターだけ残っており、実機で
  // 「サイト全体のフッター」が記入フォームの直下に現れたうえ、fixed の主CTA
  //「次へ進む」がその上に重なって押しにくい状態になっていた。
  // 記入中に他ページへ逃がす導線は不要なので、フッターごと出さないのが正しい。
  const isPostingFlow = POST_REVIEW_ROUTES.includes(router.pathname);
  // フルのフッター（ブランド文・SERVICE/LEGAL・都道府県リンク集）はホームだけ。
  // 他ページでは読む邪魔になるだけなので、法務リンクの1帯だけに落とす。
  const isHome = router.pathname === '/';
  return (
    // 子のどれか1つが数pxはみ出すだけで**ページ全体が横スクロール可能**になり、
    // mx-auto の中央寄せがビューポートでなく「はみ出した幅」を基準にするため、
    // 右端の文字が切れて見える（実機 iPhone で発生）。最後の砦としてここで止める。
    // ⚠️ overflow-x-hidden ではなく **overflow-x-clip** を使うこと。
    //    hidden は祖先を「スクロールコンテナ」にしてしまい、内側の position:sticky が
    //    ビューポートでなくこのdivを基準にするため、サイト内8箇所の sticky
    //    （店舗ページのタブ・ランキングのタブ・検索バー・ホームのサイドバー等）が壊れる。
    //    clip はスクロールコンテナを作らずに切るだけなので sticky に影響しない。
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200 overflow-x-clip">
      <ChunkErrorGuard />
      <RouteProgress />
      <ScrollToTop />
      <main className="flex-grow">{children}</main>
      {!shouldHideNav && !isPostingFlow && <Footer variant={isHome ? 'full' : 'minimal'} />}
      {!shouldHideNav && <BottomNav />}
    </div>
  );
}

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* GA4: 旧Viteのindex.htmlにしか無く未計測だったため、Next.jsで正式ロード（SPA遷移はGA4拡張計測が捕捉） */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
      `}</Script>
      <HelmetProvider>
      <ErrorBoundary>
        <DataProvider>
          <AuthProvider>
            <AppProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </AppProvider>
          </AuthProvider>
        </DataProvider>
      </ErrorBoundary>
    </HelmetProvider>
    </>
  );
}
