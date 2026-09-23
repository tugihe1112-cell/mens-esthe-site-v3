import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
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
        className={`inline-flex h-[34px] items-center gap-1.5 rounded-full border px-3.5 font-bold transition-colors group-focus-visible:ring-2 group-focus-visible:ring-pink-400 ${
          pressed
            ? 'border-slate-50 bg-slate-50 text-slate-900'
            : 'border-white/15 bg-white/[0.03] text-slate-200 hover:border-pink-400/50'
        }`}
        style={{ fontSize: '13px' }}
      >
        {label}
        {hasCount(count) && <span className={pressed ? 'text-slate-500' : 'text-slate-400'}>{fmt(count)}</span>}
      </span>
    </button>
  );
}

function NeutralStatement({ displayedCounts }) {
  // D-003: 中立宣言は消さない。母数は掲載数であって口コミ件数ではない（口コミ件数のように見せない）。
  return (
    <div className="mt-6 flex flex-col gap-1 rounded-2xl border border-pink-500/20 bg-gradient-to-r from-pink-500/10 to-pink-500/[0.02] px-4 py-3.5 md:flex-row md:items-center md:gap-4 md:px-5">
      <div className="flex min-w-0 items-start gap-3 md:flex-1 md:items-center">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-500/15 text-pink-300">
          <ShieldCheck size={18} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className="font-bold text-slate-50" style={{ fontSize: '14px', lineHeight: 1.6 }}>
            {NEUTRAL_REVIEW_NOTE}
          </p>
          <p className="mt-0.5 font-semibold text-slate-400" style={{ fontSize: '12px' }}>
            掲載 {fmt(displayedCounts.totalShops)}店舗／在籍 {fmt(displayedCounts.totalTherapists)}人
          </p>
        </div>
      </div>
      <Link
        to="/stats"
        className="ml-12 inline-flex min-h-11 shrink-0 items-center font-bold text-pink-300 hover:text-pink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 md:ml-0"
        style={{ fontSize: '13px' }}
      >
        集計を見る →
      </Link>
    </div>
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
        <div className="ui-card p-5 text-center">
          <p className="text-lg font-black text-white">まだ公開口コミがありません</p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/popular-reviews" className="ui-link inline-flex min-h-11 items-center justify-center px-2">公開口コミを探す</Link>
            <Link to="/shops" className="ui-link inline-flex min-h-11 items-center justify-center px-2">店舗を探す</Link>
          </div>
        </div>
        <NeutralStatement displayedCounts={displayedCounts} />
      </section>
    );
  }

  return (
    <section aria-labelledby="home-reviews-title">
      <div className="flex flex-col gap-2 px-1 md:flex-row md:items-end md:justify-between md:gap-4">
        <div>
          {recent !== null && recent >= LIVE_BADGE_MIN && (
            <p className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-pink-500/25 bg-pink-500/10 px-2.5 py-0.5 font-bold text-pink-300" style={{ fontSize: '12px' }}>
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-pink-500 shadow-[0_0_0_3px_rgba(236,72,153,0.25)]" />
              直近{LIVE_WINDOW_DAYS}日で{fmt(recent)}件
            </p>
          )}
          <h3 id="home-reviews-title" className="text-[22px] font-black tracking-tight text-white md:text-[26px]">最新の実体験口コミ</h3>
          <p className="mt-1 text-slate-400" style={{ fontSize: '13px' }}>来店情報と評価を確認してから本文を読めます。</p>
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
          <p className="mt-6 px-1 font-extrabold text-slate-300" style={{ fontSize: '14px' }}>
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
            className="flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-4 font-black text-white transition-colors hover:border-pink-400/50"
            style={{ fontSize: '14px' }}
          >
            {active.pref}の店舗と口コミを見る →
          </Link>
        ) : (
          <Link
            to="/popular-reviews"
            onClick={() => trackEvent('click_home_reviews_more', { pref: active?.pref || 'all' })}
            className="flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-4 font-black text-white transition-colors hover:border-pink-400/50"
            style={{ fontSize: '14px' }}
          >
            口コミをもっと読む{total !== null ? `（${fmt(total)}件）` : ''} →
          </Link>
        )}
      </div>

      <NeutralStatement displayedCounts={displayedCounts} />
    </section>
  );
}
