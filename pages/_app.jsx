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
import BottomNav from '../src/components/BottomNav.jsx';
import Footer from '../src/components/Footer.jsx';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { GA_ID } from '../src/utils/analytics';
import '../src/index.css';

const HIDE_NAV_PATHS = ['/login', '/register', '/404'];

// ページ遷移中に上部プログレスバーを出す＝タップ直後に必ず反応が見える
// （SSRページはgetServerSidePropsのサーバー往復で数百msかかり、無表示だと「押しても無反応」に感じるため）
function RouteProgress() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    const start = () => setLoading(true);
    const done = () => setLoading(false);
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
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200">
      <RouteProgress />
      <ScrollToTop />
      <main className="flex-grow">{children}</main>
      {!shouldHideNav && <Footer />}
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
