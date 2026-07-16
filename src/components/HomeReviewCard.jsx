import React, { useState } from 'react';
import { Link } from '../compat/router';
import LazyImage from './LazyImage.jsx';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../utils/analytics';
import { ratingGradientClass } from '../utils/ratingStyle';

// ホーム「最新の本物口コミ」＝呼水カード。
// 情報序列は【店舗ファースト】で全variant統一:
//   1行目: 🏢 店舗名(白bold・/search?shopId) ＋ 📍エリアピル ＋ ★バッジ
//   2行目: セラピスト名(1段小さく) ＋ 相対日付 ＋ by ペンネーム ＋ 🧾course
//   → 写真・ティーザー・続きを読む・6軸ミニバー(ヒーロー)
// variant='hero'(2カラムぶち抜き・写真大・6軸バー)／'small'／写真なしは引用カード。
// SSRはティーザー(snippet=120字)のみ。「続きを読む」で冒頭300字をidフェッチ（全文は本命ページへ）。

const DR_LABELS = [
  ['cleanliness', '清潔感'], ['looks', 'ルックス'], ['style', 'スタイル'],
  ['service', '接客'], ['massage', '施術'], ['intimacy', '密着'],
];

function relTime(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  const day = Math.floor((Date.now() - t) / 86400000);
  if (day <= 0) return { label: '今日', isNew: true };
  if (day < 7) return { label: `${day}日前`, isNew: true };
  if (day < 30) return { label: `${Math.floor(day / 7)}週間前`, isNew: false };
  if (day < 365) return { label: `${Math.floor(day / 30)}ヶ月前`, isNew: false };
  return { label: `${Math.floor(day / 365)}年前`, isNew: false };
}

export default function HomeReviewCard({ r, variant = 'small', position, pref }) {
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState(null);
  const [loading, setLoading] = useState(false);

  const isHero = variant === 'hero';
  const isQuote = !r.image; // 写真なし＝引用カード
  const rating = r.rating != null ? Number(r.rating) : null;
  const time = relTime(r.createdAt);

  const threadLink = `/shops/${r.shopId}/threads/${r.therapistId}`;
  const shopLink = `/search?shopId=${encodeURIComponent(r.shopId)}`; // 表記揺れ回避のためshopIdで解決（SearchPageが店名に変換）
  const loc = [r.prefecture, r.area].filter(Boolean).join('・');
  const dr = r.detailedRatings || null;

  const onOpen = () => trackEvent('select_home_review', { position, therapist_id: r.therapistId, variant: isQuote ? 'quote' : variant, pref });

  const handleExpand = async (e) => {
    e.preventDefault();
    trackEvent('expand_home_review', { therapist_id: r.therapistId, position, pref });
    if (body == null && r.id) {
      setLoading(true);
      try {
        const { data } = await supabase.from('reviews').select('content').eq('id', r.id).single();
        setBody((data?.content || '').slice(0, 300)); // 冒頭300字だけ（全文は本命ページへ）
      } catch { setBody(''); }
      setLoading(false);
    }
    setExpanded(true);
  };

  // ── 共通パーツ（全variant同一序列） ──────────────
  const RatingBadge = rating != null ? (
    <span className={`inline-flex items-center text-[11px] font-black text-white bg-gradient-to-br ${ratingGradientClass(rating)} rounded-md px-1.5 py-0.5 shrink-0 shadow`}>
      ★ {rating.toFixed(1)}
    </span>
  ) : null;

  // 1行目: 店舗名(主役) ＋ エリアピル ＋ ★バッジ
  const ShopLine = (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link to={shopLink} onClick={onOpen} className={`inline-flex items-center gap-1.5 min-w-0 font-black text-white hover:text-pink-300 transition ${isHero ? 'text-base' : 'text-sm'}`}>
          <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[9px] shrink-0">🏢</span>
          <span className="truncate">{r.shopName}</span>
        </Link>
        {loc && (
          <span className="text-[10px] font-bold text-pink-200 bg-pink-500/10 border border-pink-500/20 rounded-full px-2 py-0.5 shrink-0">📍 {loc}</span>
        )}
      </div>
      {RatingBadge}
    </div>
  );

  // 2行目: セラピスト名(1段小さく) ＋ 相対日付 ＋ by ペンネーム ＋ course
  const TherapistLine = (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
      <Link to={threadLink} onClick={onOpen} className={`font-bold text-slate-200 truncate hover:text-pink-300 transition ${isHero ? 'text-sm' : 'text-xs'}`}>{r.therapistName}</Link>
      {time && (
        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
          {time.isNew && <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow shadow-pink-500/50" />}
          {time.label}
        </span>
      )}
      {r.userName && <span className="text-[10px] text-slate-400">by <span className="font-bold text-slate-300">{r.userName}</span></span>}
      {r.course && (
        <span className="text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">🧾 {r.course}</span>
      )}
    </div>
  );

  const BodyBlock = !expanded ? (
    <>
      <p className={`text-slate-300/90 leading-relaxed ${isHero || isQuote ? 'text-sm line-clamp-4' : 'text-xs line-clamp-2'}`}>{r.snippet}…</p>
      <button type="button" onClick={handleExpand} className="self-start mt-1.5 text-[11px] font-bold text-pink-400 hover:text-pink-300 transition">続きを読む ↓</button>
    </>
  ) : (
    <>
      <p className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
        {loading ? '読み込み中…' : body}{!loading && '…'}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        <Link to={threadLink} onClick={onOpen} className="text-[11px] font-black text-pink-400 hover:text-pink-300 transition">全文を読む → セラピストページ</Link>
        <Link to={shopLink} className="text-[11px] font-bold text-slate-300 hover:text-pink-300 transition">🏢 店舗ページ（料金・出勤）</Link>
      </div>
    </>
  );

  const MiniBars = (isHero && dr) ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 mt-2.5">
      {DR_LABELS.map(([k, label]) => {
        const v = Number(dr[k]) || 0;
        if (!v) return null;
        return (
          <div key={k} className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-500 w-9 shrink-0">{label}</span>
            <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${ratingGradientClass(v)}`} style={{ width: `${Math.min((v / 5) * 100, 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  ) : null;

  // ── 引用カード（写真なし）＝文章が主役 ──────────
  if (isQuote) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/50 via-slate-900 to-slate-900 p-4 hover:border-purple-400/40 transition-all duration-300 ${isHero ? 'md:col-span-2' : ''}`}>
        <span aria-hidden className="absolute -top-3 left-2 text-6xl font-black text-purple-500/25 leading-none select-none">“</span>
        <div className="relative pl-6">
          {ShopLine}
          {TherapistLine}
          <div className="mt-2">{BodyBlock}</div>
        </div>
      </div>
    );
  }

  // ── ヒーローカード（先頭・2カラムぶち抜き・写真大・6軸ミニバー） ──────────
  if (isHero) {
    return (
      <div className="md:col-span-2 flex gap-4 rounded-2xl border border-pink-500/25 bg-gradient-to-br from-slate-900 to-slate-900/60 hover:border-pink-500/50 transition-all duration-300 p-4 shadow-lg shadow-pink-900/10">
        <Link to={threadLink} onClick={onOpen} className="w-24 h-32 md:w-28 md:h-36 shrink-0 rounded-xl overflow-hidden bg-slate-800">
          <LazyImage src={r.image} alt={r.therapistName} width={320} className="w-full h-full object-cover" />
        </Link>
        <div className="min-w-0 flex-1 flex flex-col">
          {ShopLine}
          {TherapistLine}
          {MiniBars}
          <div className="mt-2">{BodyBlock}</div>
        </div>
      </div>
    );
  }

  // ── 小カード ──────────
  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-slate-900 hover:border-pink-500/40 transition-all duration-300 p-3">
      <Link to={threadLink} onClick={onOpen} className="w-16 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-800">
        <LazyImage src={r.image} alt={r.therapistName} width={160} className="w-full h-full object-cover" />
      </Link>
      <div className="min-w-0 flex-1 flex flex-col">
        {ShopLine}
        {TherapistLine}
        <div className="mt-1.5">{BodyBlock}</div>
      </div>
    </div>
  );
}
