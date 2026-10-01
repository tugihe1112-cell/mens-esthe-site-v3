import React from 'react';
import { Link } from '../compat/router';
import { useAuth } from '../contexts/AuthContext';
import { useViewingCredits } from '../hooks/useViewingCredits';
import { trackEvent } from '../utils/analytics';
import { withReturnTo } from '../utils/authRedirect.js';
import { trackRegisterCtaClick } from '../utils/registerAnalytics';
import { FREE_READ_NOTE } from '../data/siteCopy.js';

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
  const { status, retry } = useViewingCredits();

  const postHref = (shopId && therapistId)
    ? `/shops/${shopId}/threads/${therapistId}/review`
    : '/post-review';

  // 主ボタンは朱に墨の文字（5.3:1。白文字の 3.5:1 より読みやすい）・角は立てる（デザインA案）
  const primaryClass =
    'inline-flex w-full sm:w-auto sm:min-w-[260px] items-center justify-center gap-2 rounded-sm bg-pink-500 px-6 text-[15px] font-bold text-slate-950 transition hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300';
  const primaryStyle = { minHeight: '52px' };
  const boxClass = 'mt-4 border border-slate-700 bg-slate-900 px-5 py-7 lg:px-8';
  const headClass = 'font-mincho text-xl font-bold leading-[1.5] text-slate-50';

  // ── 未登録 ─────────────────────────────────────────────
  if (!user && status !== 'loading') {
    return (
      <div data-cta="review-end" className={boxClass}>
        <h3 className={headClass}>気になる口コミを、もっと読む</h3>
        <p className="mt-2 text-sm font-bold text-pink-300">無料登録で3日間、口コミ読み放題</p>
        <p className="ui-help mt-1.5">{FREE_READ_NOTE}</p>
        <div className="mt-5 flex flex-col items-stretch gap-2 sm:items-start">
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
            className="ui-link inline-flex min-h-11 items-center justify-center sm:justify-start"
            style={{ fontSize: '13px' }}
          >
            すでに登録済みの方はログイン
          </Link>
          <Link to={postHref} className="ui-muted inline-flex min-h-11 items-center justify-center hover:text-white sm:justify-start">
            体験談を投稿する
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'loading' || status === 'error') {
    return (
      <div data-cta="review-end" className={boxClass} role={status === 'error' ? 'alert' : 'status'}>
        <p className="text-sm text-slate-200">{status === 'loading' ? '閲覧権を確認しています…' : '閲覧権を確認できませんでした。通信状況を確認して、もう一度お試しください。'}</p>
        {status === 'error' && <button type="button" onClick={retry} className="ui-link mt-2 inline-flex min-h-11 items-center font-bold">閲覧権を再確認する</button>}
      </div>
    );
  }

  // ── 登録済み・閲覧権切れ ────────────────────────────────
  if (status === 'expired') {
    return (
      <div data-cta="review-end" className={boxClass}>
        <h3 className={headClass}>体験談を投稿して、閲覧期間を延長</h3>
        <p className="ui-muted mt-2">200字で3日間、700字で7日間の閲覧権が即時付与されます</p>
        <div className="mt-5 flex">
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

  // ── 登録済み・閲覧権あり ──
  return (
    <div data-cta="review-end" className={boxClass}>
      <h3 className={headClass}>あなたの体験談も共有しませんか</h3>
      <p className="ui-muted mt-2">200字で3日間、700字で7日間の閲覧権が即時付与されます</p>
      <div className="mt-5 flex">
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
