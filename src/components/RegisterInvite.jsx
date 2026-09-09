import React from 'react';
import { Link } from '../compat/router';
import { useAuth } from '../contexts/AuthContext';
import { useViewingCredits } from '../hooks/useViewingCredits';
import { trackEvent } from '../utils/analytics';
import { withReturnTo } from '../utils/authRedirect.js';
import { trackRegisterCtaClick } from '../utils/registerAnalytics';

/**
 * 口コミを読み終えた地点に置く共通の案内（DESIGN.md U04）。
 *
 * ⚠️ 公開口コミが読めている場所なので「登録してこの続きを読む」とは書かない。
 *    いま読めている本文が読めなくなる、という誤解になる。
 * ⚠️ 会員向け口コミの件数は取得していないので「全○件」を作らない。
 * ⚠️ 戻り先は F01 の契約（withReturnTo）だけを使う。別方式を作らない。
 * ⚠️ リスト末尾に1枚。カードの途中へ割り込ませない。
 */
export default function RegisterInvite({ source = 'review_end', returnTo = '', shopId = '', therapistId = '' }) {
  const { user } = useAuth();
  const { status } = useViewingCredits();

  const postHref = (shopId && therapistId)
    ? `/shops/${shopId}/threads/${therapistId}/review`
    : '/post-review';

  const primaryClass =
    'inline-flex w-full sm:w-auto sm:min-w-[240px] items-center justify-center rounded-xl bg-[#be185d] px-6 text-sm font-black text-white transition hover:bg-[#9d174d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400';
  const primaryStyle = { minHeight: '48px' };

  // ── 未登録 ─────────────────────────────────────────────
  if (!user) {
    return (
      <div data-cta="review-end" className="ui-card p-5 lg:p-6 text-center">
        <h4 className="text-white font-black text-lg leading-snug">気になる口コミを、もっと読む</h4>
        <p className="text-pink-300 font-bold text-sm mt-2">無料登録で3日間、口コミ読み放題</p>
        <p className="ui-help mt-1.5">メール確認後に利用できます。閲覧期間は登録手続き時から3日間です</p>
        <div className="mt-5 flex flex-col items-center gap-3">
          <Link
            to={withReturnTo('/register', returnTo, { source })}
            onClick={() => { trackEvent('click_paywall_cta', { target: 'register', source }); trackRegisterCtaClick(source); }}
            className={primaryClass}
            style={primaryStyle}
          >
            無料登録する
          </Link>
          <Link
            to={withReturnTo('/login', returnTo)}
            className="ui-link inline-flex min-h-11 items-center justify-center px-2"
            style={{ fontSize: '13px' }}
          >
            すでに登録済みの方はログイン
          </Link>
          <Link to={postHref} className="ui-muted inline-flex min-h-11 items-center justify-center px-2 hover:text-white">
            体験談を投稿する
          </Link>
        </div>
      </div>
    );
  }

  // ── 登録済み・閲覧権切れ ────────────────────────────────
  if (status === 'expired') {
    return (
      <div data-cta="review-end" className="ui-card p-5 lg:p-6 text-center">
        <h4 className="text-white font-black text-lg leading-snug">体験談を投稿して、閲覧期間を延長</h4>
        <p className="ui-muted mt-2">200字で3日間、700字で7日間の閲覧権が即時付与されます</p>
        <div className="mt-5 flex justify-center">
          <Link
            to={postHref}
            onClick={() => trackEvent('click_paywall_cta', { target: 'post_review', source })}
            className={primaryClass}
            style={primaryStyle}
          >
            体験談を書く
          </Link>
        </div>
      </div>
    );
  }

  // ── 登録済み・閲覧権あり（取得中もこちらを出す。権利がある人に延長を勧めない） ──
  return (
    <div data-cta="review-end" className="ui-card p-5 lg:p-6 text-center">
      <h4 className="text-white font-black text-lg leading-snug">あなたの体験談も共有しませんか</h4>
      <p className="ui-muted mt-2">200字で3日間、700字で7日間の閲覧権が即時付与されます</p>
      <div className="mt-5 flex justify-center">
        <Link
          to={postHref}
          onClick={() => trackEvent('click_paywall_cta', { target: 'post_review', source })}
          className={primaryClass}
          style={primaryStyle}
        >
          体験談を書く
        </Link>
      </div>
    </div>
  );
}
