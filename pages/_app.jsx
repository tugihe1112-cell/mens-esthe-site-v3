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
import '../src/index.css';

const HIDE_NAV_PATHS = ['/login', '/register', '/404'];

function Layout({ children }) {
  const router = useRouter();
  const shouldHideNav = HIDE_NAV_PATHS.some(p => router.pathname === p);
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200">
      <ScrollToTop />
      <main className="flex-grow">{children}</main>
      {!shouldHideNav && <Footer />}
      {!shouldHideNav && <BottomNav />}
    </div>
  );
}

export default function MyApp({ Component, pageProps }) {
  return (
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
  );
}
