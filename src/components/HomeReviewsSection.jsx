import React, { useEffect, useState } from 'react';
import { NEUTRAL_REVIEW_NOTE } from '../data/siteCopy.js';
import { Link } from '../compat/router';
import HomeReviewCard from './HomeReviewCard.jsx';
import { trackEvent } from '../utils/analytics';
import {
  pickLeadReview,
  pickFeedReviews,
  orderPrefs,
  LIVE_BADGE_MIN,
  LIVE_WINDOW_DAYS,
  PREFERRED_PREF_KEY,
} from '../utils/homeReviews';

// ホーム「最新の実体験口コミ」欄（呼水）。組み立ての決まりは src/utils/homeReviews.js の冒頭。
//
// ⚠️ 地域は「チップで欄全体を絞る」形。全県ぶんを縦に並べない（ホームが口コミの倉庫になって読み終われない）。
// ⚠️ 初期表示は必ず「すべて」。保存した県を自動で選ぶと、SSRのHTMLと表示後の中身が入れ替わる（ちらつき・CLS）。
//    保存した県はチップの並び順（「すべて」の次）にだけ使う。
// ⚠️ 件数は数えられたときだけ出す（null なら数字を出さない）。

const fmt = (n) => Number(n).toLocaleString('ja-JP');
const hasCount = (n) => Number.isInteger(n) && n >= 0;

function RegionChip({ label, count, pressed, onClick }) {
  // 見た目は34pxのピル、押せる範囲は44px（U01のタップ最小値）
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="group flex min-h-11 shrink-0 items-center focus-visible:outline-none"
    >
      <span
        className={`inline-flex h-[34px] items-center gap-1.5 rounded-full border px-3.5 transition-colors group-focus-visible:ring-2 group-focus-visible:ring-pink-400 ${
          pressed
            ? 'border-pink-500 bg-pink-500 font-bold text-slate-950'
            : 'border-slate-700 text-slate-200 hover:border-pink-400/60'
        }`}
        style={{ fontSize: '13px' }}
      >
        {label}
        {hasCount(count) && <span className={pressed ? 'text-slate-900' : 'text-slate-400'}>{fmt(count)}</span>}
      </span>
    </button>
  );
}

// 「編集方針」の囲み（2026-09-30・デザインA案＋B案の囲み）。朱の印・中立宣言・掲載数。
// D-003: 中立宣言は消さない。母数は掲載数であって口コミ件数ではない（口コミ件数のように見せない）。
// ⚠️ 文は siteCopy の NEUTRAL_REVIEW_NOTE だけ（写しを作らない）。
function NeutralStatement({ displayedCounts, className = '' }) {
  return (
    <section aria-label="編集方針" className={`border border-slate-700 bg-slate-900 px-5 py-5 md:px-6 ${className}`}>
      <p className="text-[11px] tracking-[0.2em] text-pink-300">編集方針</p>
      <div className="mt-3 flex items-center gap-4">
        <svg width="74" height="74" viewBox="0 0 74 74" aria-hidden="true" className="shrink-0">
          <circle cx="37" cy="37" r="34" fill="none" stroke="#E0613F" strokeWidth="2" />
          <circle cx="37" cy="37" r="29" fill="none" stroke="#E0613F" strokeWidth="0.8" />
          <text x="37" y="36" textAnchor="middle" fontSize="17" fontWeight="700" fill="#E0613F" style={{ fontFamily: 'var(--font-mincho), serif' }}>中立</text>
          <text x="37" y="50" textAnchor="middle" fontSize="7.5" letterSpacing="1" fill="#E0613F">掲載料ゼロ</text>
        </svg>
        <p className="font-mincho font-bold text-slate-50" style={{ fontSize: '16px', lineHeight: 1.7 }}>
          {NEUTRAL_REVIEW_NOTE}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-2 border-t border-slate-800 pt-3">
        <p className="text-xs text-slate-400">掲載店舗<span className="ml-2 font-numeral text-2xl text-slate-50">{fmt(displayedCounts.totalShops)}</span></p>
        <p className="text-xs text-slate-400">在籍セラピスト<span className="ml-2 font-numeral text-2xl text-slate-50">{fmt(displayedCounts.totalTherapists)}</span></p>
        <Link
          to="/stats"
          className="ml-auto inline-flex min-h-11 shrink-0 items-center font-bold text-pink-300 hover:text-pink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
          style={{ fontSize: '13px' }}
        >
          集計を見る →
        </Link>
      </div>
    </section>
  );
}

export default function HomeReviewsSection({
  latestReviews = [],
  reviewsByPref = [],
  reviewStats = null,
  displayedCounts = { totalShops: 0, totalTherapists: 0 },
}) {
  const [prefs, setPrefs] = useState(reviewsByPref);
  const [selected, setSelected] = useState(''); // '' ＝すべて

  useEffect(() => {
    let saved = null;
    try { saved = localStorage.getItem(PREFERRED_PREF_KEY); } catch {}
    setPrefs(orderPrefs(reviewsByPref, saved));
  }, [reviewsByPref]);

  const total = hasCount(reviewStats?.total) ? reviewStats.total : null;
  const recent = hasCount(reviewStats?.recent) ? reviewStats.recent : null;
  const active = selected ? prefs.find((b) => b.pref === selected) || null : null;
  const list = active ? active.reviews : latestReviews;
  const lead = pickLeadReview(list);
  const feed = pickFeedReviews(list, lead?.id);

  const choose = (pref) => {
    setSelected(pref);
    trackEvent('select_home_review_region', { pref: pref || 'all' });
  };

  // ⚠️ U02: 口コミが0件でも架空のカードを作らない。探せる場所へ送る。中立宣言はこの場合も出す。
  if (!lead) {
    return (
      <section>
        <NeutralStatement displayedCounts={displayedCounts} className="mb-8" />
        <div className="border border-slate-700 p-5 text-center">
          <p className="font-mincho text-lg font-bold text-slate-50">まだ公開口コミがありません</p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/popular-reviews" className="ui-link inline-flex min-h-11 items-center justify-center px-2">公開口コミを探す</Link>
            <Link to="/shops" className="ui-link inline-flex min-h-11 items-center justify-center px-2">店舗を探す</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="home-reviews-title">
      {/* 編集方針（中立宣言）は口コミを読む前に置く */}
      <NeutralStatement displayedCounts={displayedCounts} className="mb-10" />

      <div className="flex flex-col gap-2 border-b border-slate-700 pb-3 md:flex-row md:items-end md:justify-between md:gap-4">
        <div>
          <h3 id="home-reviews-title" className="font-mincho text-[26px] font-bold leading-[1.3] text-slate-50 md:text-[32px]">最新の実体験口コミ</h3>
          <p className="mt-1 text-slate-400" style={{ fontSize: '13px' }}>
            {recent !== null && recent >= LIVE_BADGE_MIN && (
              <span className="mr-2 text-pink-300">直近{LIVE_WINDOW_DAYS}日で<span className="mx-0.5 font-numeral text-base">{fmt(recent)}</span>件</span>
            )}
            来店情報と評価を確認してから本文を読めます。
          </p>
        </div>
        <Link
          to="/popular-reviews"
          className="-my-2 inline-flex min-h-11 shrink-0 items-center font-bold text-pink-300 hover:text-pink-200"
          style={{ fontSize: '13px' }}
        >
          すべての口コミ{total !== null ? `（${fmt(total)}件）` : ''} →
        </Link>
      </div>

      {prefs.length > 0 && (
        <div role="group" aria-label="口コミの地域" className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          <RegionChip label="すべて" count={total} pressed={!active} onClick={() => choose('')} />
          {prefs.map((b) => (
            <RegionChip key={b.pref} label={b.pref} count={b.total} pressed={active?.pref === b.pref} onClick={() => choose(b.pref)} />
          ))}
        </div>
      )}

      <div className="mt-5">
        <HomeReviewCard
          r={lead}
          variant="hero"
          position="latest_lead"
          pref={active?.pref || 'all'}
          tag={active ? `${active.pref}でいちばん新しい口コミ` : 'いちばん新しい口コミ'}
        />
      </div>

      {feed.length > 0 && (
        <>
          <p className="mt-8 font-mincho font-bold text-slate-200" style={{ fontSize: '16px' }}>
            {active ? `${active.pref}のほかの新着` : 'ほかの新着'}
          </p>
          {/* スマホは横スクロール（次のカードが少し見える＝続きがあると分かる）、PCは2列 */}
          <ul className="no-scrollbar -mx-4 mt-3 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:px-0">
            {feed.map((r, i) => (
              <li key={r.id || i} className="w-[80%] max-w-[300px] shrink-0 snap-start md:w-auto md:max-w-none">
                <HomeReviewCard r={r} variant="compact" position={i + 1} pref={active?.pref || 'all'} />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-4">
        {active && active.slug ? (
          <Link
            to={`/area/${active.slug}`}
            onClick={() => trackEvent('click_pref_more', { pref: active.pref })}
            className="flex min-h-12 items-center justify-center rounded-sm border border-slate-600 px-4 font-bold text-slate-50 transition-colors hover:border-pink-400/60"
            style={{ fontSize: '14px' }}
          >
            {active.pref}の店舗と口コミを見る →
          </Link>
        ) : (
          <Link
            to="/popular-reviews"
            onClick={() => trackEvent('click_home_reviews_more', { pref: active?.pref || 'all' })}
            className="flex min-h-12 items-center justify-center rounded-sm border border-slate-600 px-4 font-bold text-slate-50 transition-colors hover:border-pink-400/60"
            style={{ fontSize: '14px' }}
          >
            口コミをもっと読む{total !== null ? `（${fmt(total)}件）` : ''} →
          </Link>
        )}
      </div>

    </section>
  );
}
