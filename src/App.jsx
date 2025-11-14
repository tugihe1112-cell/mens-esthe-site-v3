// src/App.jsx (ShopDetailPage のtypoを修正)

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext.tsx'; 

// ヘッダーとトースト
import Header from './components/Header.jsx';
import { Toaster } from 'react-hot-toast'; 

// ページコンポーネント (仕様書 1.1)
import Home from './pages/Home.jsx';
import ShopListPage from './pages/ShopListPage.jsx';
import ShopDetailPage from './pages/ShopDetailPage.jsx'; // ★ 9行目のタイポを修正
import ThreadDetailPage from './pages/ThreadDetailPage.jsx';
import MyPage from './pages/MyPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminPendingPage from './pages/AdminPendingPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            className: '!bg-slate-700 !text-white',
          }}
        />
        <Header /> 
        
        <div className="bg-gradient-to-br from-slate-900 to-purple-900 min-h-[calc(100vh-68px)]">
          <Routes>
            {/* ルート表 */}
            <Route path="/" element={<Home />} />
            <Route path="/shops" element={<ShopListPage />} />
            <Route path="/shops/:shopId" element={<ShopDetailPage />} />
            <Route path="/shops/:shopId/threads/:threadId" element={<ThreadDetailPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/pending" element={<AdminPendingPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
        
      </BrowserRouter>
    </AppProvider>
  );
}