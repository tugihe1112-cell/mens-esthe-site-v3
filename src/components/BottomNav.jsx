import React from 'react';
import { useRouter } from 'next/router';
import { Link } from '../compat/router';
import { useAuth } from '../contexts/AuthContext.jsx';

// 投稿フロー（PostReviewPageを描画するルート）ではボトムドックを出さない。
// 理由: 投稿ページの主CTA「次へ進む」も fixed bottom-0 z-50 で、_app.jsx の描画順により
// ドックが上に重なり、フライホイールの唯一の入口でCTAが押せない/押しにくくなっていた。
// フォーム記入中に他タブへ逃がす導線は不要なので、非表示が正解（_app.jsx は編集不可のため自己非表示）。
// _app.jsx からも参照する（フッターも同じルートで隠すため）＝定義を2箇所に持たない
export const POST_REVIEW_ROUTES = [
  '/post-review',
  '/shops/[shopId]/review',
  '/shops/[shopId]/threads/[threadId]/review',
];

// チャットルームは画面下部に専用の入力欄を持つ全画面UI。
// 共通ドックを重ねると送信欄が隠れるため、投稿フローと同様に非表示にする。
export const BOTTOM_NAV_HIDDEN_ROUTES = [
  ...POST_REVIEW_ROUTES,
  '/chat/[roomId]',
];

export default function BottomNav() {
  const { user } = useAuth();
  const router = useRouter();
  const hideBottomNav = BOTTOM_NAV_HIDDEN_ROUTES.includes(router?.pathname);

  // ⚠️ 2026-09-08（DESIGN.md U01-3）: 以前は `md:hidden` だった。
  //    ヘッダーのPCナビは `lg:` から出るので、**768〜1023px では主ナビがどこにも無かった**。
  //    `lg:hidden` へ揃えて穴を塞ぐ。Footer の下余白の境界も同時に lg へ合わせてある。
  const currentPath = (router?.asPath || '/').split('?')[0].split('#')[0];
  const isActivePath = (path) =>
    path === '/' ? currentPath === '/' : currentPath === path || currentPath.startsWith(path + '/');

  // ⚠️ U01-4: 5項目は「ホーム／探す／口コミ／投稿／登録・マイページ」。
  //    ランキングはフッターへ移した。既存利用者のログインはヘッダーに常設してある。
  const navItems = [
    {
      path: '/',
      label: 'ホーム',
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: '/search',
      label: '探す',
      icon: (active) => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      path: '/popular-reviews',
      label: '口コミ',
      icon: (active) => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      path: '/post-review',
      label: '投稿',
      icon: (active) => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
    {
      path: user ? '/mypage' : '/register',
      label: user ? 'マイページ' : '登録',
      // ⚠️ U01-5: 未登録で「投稿」だけを常時発光させない。
      //    強調するのは選択中の項目だけで、未登録の「登録」は文字色をピンクにするに留める。
      accent: !user,
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  if (hideBottomNav) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 lg:hidden pointer-events-none">
      {/* 背景のグラデーションフェード（コンテンツが消える演出） */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent pointer-events-none"></div>

      {/* U01-3: 中央ドックは最大幅600px・中央寄せ */}
      <div className="relative px-2.5 max-w-[600px] mx-auto">
        <nav
          aria-label="メインナビゲーション"
          className="pointer-events-auto relative bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg shadow-black/40 overflow-hidden"
          style={{ marginBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* U01-5: 高さ60px、ラベル12px */}
          <div className="flex justify-around items-center h-[60px]">
            {navItems.map((item) => {
              const active = isActivePath(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex flex-col items-center justify-center gap-0.5 w-full h-full min-w-[44px] select-none active:scale-95 transition-transform duration-200 ${
                    active || item.accent ? 'text-pink-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.icon(active)}
                  <span className={`text-xs leading-none tracking-tight ${active ? 'font-black text-white' : 'font-bold'}`}>
                    {item.label}
                  </span>
                  {active && <span className="absolute bottom-0 w-8 h-0.5 bg-pink-500 rounded-t-full" />}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
