import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import PropTypes from 'prop-types';

import { AppProvider } from './context/AppContext';
import { DataProvider } from './contexts/DataContext';

import PremiumPage from './pages/PremiumPage';
import ScrollToTop from './components/ScrollToTop';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import SearchPage from './pages/SearchPage';
import AreaSearchPage from './pages/AreaSearchPage';
import ShopListPage from './pages/ShopListPage';
import RankingPage from './pages/RankingPage';
import ShopDetailPage from './pages/ShopDetailPage';
import ThreadDetailPage from './pages/ThreadDetailPage';
import PostReviewPage from './pages/PostReviewPage';
import BrandPage from './pages/BrandPage';
import MyPage from './pages/MyPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HistoryPage from './pages/HistoryPage';
import FavoritesPage from './pages/FavoritesPage';
import MyReviewsPage from './pages/MyReviewsPage';
import RequestReviewPage from './pages/RequestReviewPage';
import NotFoundPage from './pages/NotFoundPage';

import NewTherapistsPage from './pages/NewTherapistsPage';
import PopularReviewsPage from './pages/PopularReviewsPage';
import BoardPage from './pages/BoardPage';
import BoardDetailPage from './pages/BoardDetailPage';
import ChatListPage from './pages/ChatListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import AdminPage from './pages/AdminPage';

// 🌟 法律関連の3ページをすべてインポート！
import LegalPage from './pages/LegalPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import PrefecturePage from './pages/PrefecturePage';

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
                <Routes>
                  {/* メインルート */}
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/area-search" element={<AreaSearchPage />} />
                  <Route path="/area/:pref" element={<PrefecturePage />} />
                  <Route path="/shops" element={<ShopListPage />} />
                  <Route path="/ranking" element={<RankingPage />} />
                  <Route path="/new-therapists" element={<NewTherapistsPage />} />
                  <Route path="/popular-reviews" element={<PopularReviewsPage />} />
                  <Route path="/board" element={<BoardPage />} />
                  <Route path="/board/:postId" element={<BoardDetailPage />} />
                  <Route path="/chat" element={<ChatListPage />} />
                  <Route path="/chat/:roomId" element={<ChatRoomPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  
                  {/* 詳細ページ */}
                  <Route path="/shops/:shopId" element={<ShopDetailPage />} />
                  <Route path="/shops/:shopId/threads/:threadId" element={<ThreadDetailPage />} />
                  <Route path="/brands/:brandId" element={<BrandPage />} />
                  
                  {/* クチコミ投稿関連 */}
                  <Route path="/shops/:shopId/threads/:threadId/review" element={<PostReviewPage />} />
                  <Route path="/shops/:shopId/review" element={<PostReviewPage />} />
                  <Route path="/post-review" element={<PostReviewPage />} />
                  <Route path="/request-review" element={<RequestReviewPage />} />
                  
                  {/* ユーザー機能 */}
                  <Route path="/mypage" element={<MyPage />} />
                  <Route path="/my-reviews" element={<MyReviewsPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  
                  {/* 認証 */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  
                  {/* エラー・その他・法律ページ */}
                  <Route path="/premium" element={<PremiumPage />} />
                  <Route path="/legal" element={<LegalPage />} />
                  <Route path="/terms" element={<TermsPage />} />       {/* 🌟 ルートを追加！ */}
                  <Route path="/privacy" element={<PrivacyPage />} />   {/* 🌟 ルートを追加！ */}
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </Layout>
            </DataProvider>
          </AppProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </HelmetProvider>
  );
}
