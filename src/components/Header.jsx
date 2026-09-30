import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from '../compat/router';
import { useAuth } from "../contexts/AuthContext";
import { useReturnTo } from '../utils/useReturnTo';
import { withReturnTo } from '../utils/authRedirect.js';
import { trackRegisterCtaClick } from '../utils/registerAnalytics';
import { isTransparentHeaderPath } from '../utils/headerTransparency.mjs';

export default function Header() {
  const location = useLocation();
  const { user: authUser } = useAuth();
  // ⚠️ 2026-09-07（FIXES.md F01）: ヘッダーのログイン/登録も戻り先を捨てていた。
  //    どのページから押しても認証後はホームか /mypage に落ちる。
  //    認証ページ自身は normalizeReturnTo が弾くのでループしない。
  const returnTo = useReturnTo();
  const loginHref = withReturnTo('/login', returnTo);
  const registerHref = withReturnTo('/register', returnTo, { source: 'header' });

  // --- スクロール & 表示制御 ---
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // スクロール検知
      setIsScrolled(currentScrollY > 10);

      // 下スクロールで隠し、上スクロールで表示
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- モバイルメニュー制御 ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ページ遷移時にメニューを閉じる
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // トップページなど、初期状態で背景を透過させたいページ
  // ⚠️ /ranking と /brands/ を追加（2026-08-17）:
  //    この2ページも `h-[40vh]` のシネマティック・ヒーローを持つのに透過リストから漏れており、
  //    不透明なヘッダーがヒーローの上端を覆って「板が乗っている」ように見えていた。
  //    ヒーローを持つページは透過にする、というのがこのサイトの一貫した設計。
  // ⚠️ 2026-09-08（FIXES.md F06-D）: 判定を src/utils/headerTransparency.mjs へ一本化した。
  //    以前の配列 some(startsWith) は '/' が全URLへ前方一致し、全ページが透過になっていた。
  const isTransparentPage = isTransparentHeaderPath(location.pathname);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled || mobileMenuOpen
            ? 'bg-slate-950/95 backdrop-blur-md border-b border-slate-800' // スクロール時・メニュー開放時: ほぼ不透明
            : isTransparentPage
              ? 'bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent' // 透明時: 墨のグラデーションで文字を見やすく
              : 'bg-slate-950 border-b border-slate-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* U01-7: 高さの基準はスマホ64px・PC72px。
              ⚠️ 2026-09-30: 外側に上下の余白（py-2.5 など）を足すと、ヘッダーが84〜112pxになり、
                 各ページの上の余白（pt-20＝80px）より高くなって本文の頭が隠れていた。高さはこの行だけで決める。 */}
          <div className="flex items-center justify-between gap-3 sm:gap-4 min-h-[64px] lg:min-h-[72px]">

            {/* ロゴ（デザインA案「夜の文芸誌」・2026-09-30）: 明朝の「メンエスマップ」＋小さな欧文。
                ⚠️ U01: ロゴ表記は「メンエスマップ」に統一（宝石の絵文字のバッジはやめた＝絵文字をアイコンに使わない）。 */}
            <Link to="/" className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 relative z-50 shrink-0 min-h-0">
              <span className="font-mincho font-bold text-[19px] md:text-[22px] leading-none tracking-[0.08em] text-slate-100 whitespace-nowrap">
                メンエスマップ
              </span>
              <span className="font-numeral text-[10px] md:text-[11px] leading-none tracking-[0.32em] text-slate-400 whitespace-nowrap">
                MENS ESTHE MAP
              </span>
            </Link>

            {/* PC用 ナビゲーション */}
            <nav className="hidden lg:flex items-center gap-7">
              {/* ⚠️ U01: PCナビは「セラピストを探す」「口コミを読む」の2本に絞る。
                  ランキングはフッターへ移した（主導線を増やしすぎない）。 */}
              <Link to="/search" className="text-sm text-slate-300 hover:text-slate-100 transition relative group py-3">
                セラピストを探す
                <span className="absolute bottom-1.5 left-0 w-0 h-px bg-pink-400 transition-all group-hover:w-full"></span>
              </Link>
              <Link to="/popular-reviews" className="text-sm text-slate-300 hover:text-slate-100 transition relative group py-3">
                口コミを読む
                <span className="absolute bottom-1.5 left-0 w-0 h-px bg-pink-400 transition-all group-hover:w-full"></span>
              </Link>

              {authUser ? (
                <Link to="/mypage" className="flex items-center gap-2 pl-5 border-l border-slate-800 text-sm text-slate-200 hover:text-pink-300 transition py-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true"><circle cx="12" cy="9" r="4" /><path d="M5 20c1-4 4-6 7-6s6 2 7 6" /></svg>
                  マイページ
                </Link>
              ) : (
                <div className="flex items-center gap-5 pl-1">
                  <Link to={loginHref} className="text-sm text-slate-300 hover:text-slate-100 transition py-3">ログイン</Link>
                  <Link to={registerHref} onClick={() => trackRegisterCtaClick('header')} className="border border-pink-500 text-pink-300 px-5 py-2.5 rounded-sm text-sm font-bold hover:bg-pink-500 hover:text-slate-950 transition">
                    無料登録
                  </Link>
                </div>
              )}
            </nav>

            {/* モバイル用 認証ボタン */}
            {!authUser && (
              <div className="lg:hidden flex items-center gap-1 shrink-0">
                {/* ⚠️ U01-4: ボトムナビの5番目は「登録／マイページ」になったので、
                    既存利用者のログインはヘッダーに常設する（狭い幅でも隠さない）。 */}
                <Link to={loginHref}
                  className="inline-flex min-h-11 items-center text-[13px] text-slate-300 px-2.5 whitespace-nowrap hover:text-slate-100 transition">
                  ログイン
                </Link>
                <Link to={registerHref} onClick={() => trackRegisterCtaClick('header')}
                  className="min-h-11 inline-flex items-center text-[13px] font-bold text-pink-300 border border-pink-500 px-3.5 rounded-sm whitespace-nowrap hover:bg-pink-500 hover:text-slate-950 transition">
                  無料登録
                </Link>
              </div>
            )}
            {authUser && (
              <Link to="/mypage" className="hidden md:inline-flex lg:hidden min-h-10 items-center gap-2 rounded-sm border border-slate-700 px-4 text-xs font-bold text-slate-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true"><circle cx="12" cy="9" r="4" /><path d="M5 20c1-4 4-6 7-6s6 2 7 6" /></svg>
                マイページ
              </Link>
            )}

          </div>
        </div>

      </header>

    </>
  );
}
