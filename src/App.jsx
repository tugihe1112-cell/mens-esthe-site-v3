import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from '../compat/router';
import { HelmetProvider } from 'react-helmet-async';
import PropTypes from 'prop-types';

import { AppProvider } from './context/AppContext';
import { DataProvider } from './contexts/DataContext';

// 常時必要なコンポーネント（lazy 不要）
import ScrollToTop from './components/ScrollToTop';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/Footer';

// Pages（全てlazy load）
const Home               = lazy(() => import('./pages/Home'));
const SearchPage         = lazy(() => import('./pages/SearchPage'));
const AreaSearchPage     = lazy(() => import('./pages/AreaSearchPage'));
const PrefecturePage     = lazy(() => import('./pages/PrefecturePage'));
const ShopListPage       = lazy(() => import('./pages/ShopListPage'));
const RankingPage        = lazy(() => import('./pages/RankingPage'));
const ShopDetailPage     = lazy(() => import('./pages/ShopDetailPage'));
const ThreadDetailPage   = lazy(() => import('./pages/ThreadDetailPage'));
const PostReviewPage     = lazy(() => import('./pages/PostReviewPage'));
const BrandPage          = lazy(() => import('./pages/BrandPage'));
const MyPage             = lazy(() => import('./pages/MyPage'));
const LoginPage          = lazy(() => import('./pages/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/RegisterPage'));
const HistoryPage        = lazy(() => import('./pages/HistoryPage'));
const FavoritesPage      = lazy(() => import('./pages/FavoritesPage'));
const MyReviewsPage      = lazy(() => import('./pages/MyReviewsPage'));
const RequestReviewPage  = lazy(() => import('./pages/RequestReviewPage'));
const NotFoundPage       = lazy(() => import('./pages/NotFoundPage'));
const NewTherapistsPage  = lazy(() => import('./pages/NewTherapistsPage'));
const PopularReviewsPage = lazy(() => import('./pages/PopularReviewsPage'));
const BoardPage          = lazy(() => import('./pages/BoardPage'));
const BoardDetailPage    = lazy(() => import('./pages/BoardDetailPage'));
const ChatListPage       = lazy(() => import('./pages/ChatListPage'));
const ChatRoomPage       = lazy(() => import('./pages/ChatRoomPage'));
const AdminPage          = lazy(() => import('./pages/AdminPage'));
const PremiumPage        = lazy(() => import('./pages/PremiumPage'));
const LegalPage          = lazy(() => import('./pages/LegalPage'));
const TermsPage          = lazy(() => import('./pages/TermsPage'));
const PrivacyPage        = lazy(() => import('./pages/PrivacyPage'));
const ContactPage        = lazy(() => import('./pages/ContactPage'));
const AuthConfirmPage    = lazy(() => import('./pages/AuthConfirmPage'));

// ローディングフォールバック（ダークテーマに合わせたシンプルなスピナー）
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-950">
    <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavPaths = ['/login', '/register', '/404'];
  const shouldHideNav = hideNavPaths.some(path => location.pathname === path);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200">
      <ScrollToTop />
      <main className="flex-grow">
        {children}
      </main>
      {!shouldHideNav && <Footer />}
      {!shouldHideNav && <BottomNav />}
    </div>
  );
};

Layout.propTypes = { children: PropTypes.node.isRequired };

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <AppProvider>
            <DataProvider>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* メインルート */}
                    <Route path="/"                element={<Home />} />
                    <Route path="/search"          element={<SearchPage />} />
                    <Route path="/area-search"     element={<AreaSearchPage />} />
                    <Route path="/area/:pref"      element={<PrefecturePage />} />
                    <Route path="/shops"           element={<ShopListPage />} />
                    <Route path="/ranking"         element={<RankingPage />} />
                    <Route path="/new-therapists"  element={<NewTherapistsPage />} />
                    <Route path="/popular-reviews" element={<PopularReviewsPage />} />
                    <Route path="/board"           element={<BoardPage />} />
                    <Route path="/board/:postId"   element={<BoardDetailPage />} />
                    <Route path="/chat"            element={<ChatListPage />} />
                    <Route path="/chat/:roomId"    element={<ChatRoomPage />} />
                    <Route path="/admin"           element={<AdminPage />} />

                    {/* 詳細ページ */}
                    <Route path="/shops/:shopId"                              element={<ShopDetailPage />} />
                    <Route path="/shops/:shopId/threads/:threadId"            element={<ThreadDetailPage />} />
                    <Route path="/brands/:brandId"                            element={<BrandPage />} />

                    {/* クチコミ投稿関連 */}
                    <Route path="/shops/:shopId/threads/:threadId/review" element={<PostReviewPage />} />
                    <Route path="/shops/:shopId/review"                   element={<PostReviewPage />} />
                    <Route path="/post-review"                            element={<PostReviewPage />} />
                    <Route path="/request-review"                         element={<RequestReviewPage />} />

                    {/* ユーザー機能 */}
                    <Route path="/mypage"      element={<MyPage />} />
                    <Route path="/my-reviews"  element={<MyReviewsPage />} />
                    <Route path="/history"     element={<HistoryPage />} />
                    <Route path="/favorites"   element={<FavoritesPage />} />

                    {/* 認証 */}
                    <Route path="/login"        element={<LoginPage />} />
                    <Route path="/register"     element={<RegisterPage />} />
                    <Route path="/auth/confirm" element={<AuthConfirmPage />} />

                    {/* その他・法律ページ */}
                    <Route path="/premium" element={<PremiumPage />} />
                    <Route path="/legal"   element={<LegalPage />} />
                    <Route path="/terms"   element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/404"     element={<NotFoundPage />} />
                    <Route path="*"        element={<Navigate to="/404" replace />} />
                  </Routes>
                </Suspense>
              </Layout>
            </DataProvider>
          </AppProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </HelmetProvider>
  );
}
