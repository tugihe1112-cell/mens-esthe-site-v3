import React from 'react';
import { useRouter } from 'next/router';
import { Link } from '../compat/router';
import { useAuth } from '../contexts/AuthContext.jsx';
import { trackRegisterCtaClick } from '../utils/registerAnalytics';

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
  // デザインA案（2026-09-30）: 線の細いアイコンに揃える（選択中は線を少し太く＝塗りつぶしで形を変えない）。
  const icon = (d) => (active) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
  const navItems = [
    { path: '/', label: 'ホーム', icon: icon(<path d="M4 11l8-6 8 6v8h-5v-5H9v5H4z" />) },
    { path: '/search', label: '探す', icon: icon(<><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></>) },
    { path: '/popular-reviews', label: '口コミ', icon: icon(<path d="M5 5h14v10H9l-4 4z" />) },
    { path: '/post-review', label: '投稿', icon: icon(<path d="M4 20l4-1 11-11-3-3L5 16z" />) },
    {
      path: user ? '/mypage' : '/register',
      label: user ? 'マイページ' : '登録',
      // ⚠️ U01-5: 未登録で「投稿」だけを常時発光させない。
      //    強調するのは選択中の項目だけで、未登録の「登録」は文字色を朱にするに留める。
      accent: !user,
      icon: icon(<><circle cx="12" cy="9" r="4" /><path d="M5 20c1-4 4-6 7-6s6 2 7 6" /></>),
    },
  ];

  if (hideBottomNav) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 lg:hidden pointer-events-none">
      {/* 背景のフェード（コンテンツが消える演出） */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent pointer-events-none"></div>

      {/* U01-3: 中央ドックは最大幅600px・中央寄せ */}
      <div className="relative px-3 max-w-[600px] mx-auto">
        <nav
          aria-label="メインナビゲーション"
          className="pointer-events-auto relative bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-sm shadow-lg shadow-black/40 overflow-hidden"
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
                  onClick={item.path === '/register' ? () => trackRegisterCtaClick('bottom_nav') : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex flex-col items-center justify-center gap-1 w-full h-full min-w-[44px] select-none active:scale-95 transition-transform duration-200 ${
                    active ? 'text-slate-100' : item.accent ? 'text-pink-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {active && <span className="absolute top-0 w-7 h-0.5 bg-pink-400" />}
                  {item.icon(active)}
                  <span className={`text-xs leading-none ${active ? 'font-bold' : ''}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
