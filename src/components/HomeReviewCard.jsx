import React, { useState } from 'react';
import { Link } from '../compat/router';
import LazyImage from './LazyImage.jsx';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../utils/analytics';

// ホーム「最新の本物口コミ」カード
// - SSRにはティーザー(snippet)のみ＝ホームと本命セラピストページの重複コンテンツを回避
// - 「続きを読む」でクライアントがreview idから本文をフェッチし冒頭300字だけ展開（全文は出さない）
// - 展開末尾にセラピストページ(全文)＋店舗リンクを併置／展開を計測
export default function HomeReviewCard({ r }) {
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState(null);
  const [loading, setLoading] = useState(false);

  const threadLink = `/shops/${r.shopId}/threads/${r.therapistId}`;
  const shopLink = `/search?shopId=${encodeURIComponent(r.shopId)}`; // タグ絞り込みバーがある店舗ページ(SearchPage)へ。shopIdで確実に解決
  const loc = [r.prefecture, r.area].filter(Boolean).join('・');

  const handleExpand = async (e) => {
    e.preventDefault();
    trackEvent('expand_home_review', { therapist_id: r.therapistId });
    if (body == null && r.id) {
      setLoading(true);
      try {
        const { data } = await supabase.from('reviews').select('content').eq('id', r.id).single();
        // 冒頭300字だけ（全文は出さない＝本命ページへ誘導）
        setBody((data?.content || '').slice(0, 300));
      } catch { setBody(''); }
      setLoading(false);
    }
    setExpanded(true);
  };

  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-slate-900 hover:border-pink-500/40 transition-all duration-300 p-3">
      <Link to={threadLink} className="w-16 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-800">
        {r.image ? (
          <LazyImage src={r.image} alt={r.therapistName} width={160} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-600">写真なし</div>
        )}
      </Link>
      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <Link to={threadLink} className="text-sm font-black text-white truncate hover:text-pink-300 transition">{r.therapistName}</Link>
          {r.rating != null && <span className="text-[11px] font-black text-white bg-pink-600/90 rounded-md px-1.5 py-0.5 shrink-0">★ {Number(r.rating).toFixed(1)}</span>}
        </div>

        {/* エリアピル＋店舗名（店名だけだと場所が分からない問題の解消・店名を目立たせる） */}
        {loc && (
          <div className="mb-1">
            <span className="text-[10px] font-bold text-pink-200 bg-pink-500/10 border border-pink-500/20 rounded-full px-2 py-0.5">📍 {loc}</span>
          </div>
        )}
        <Link to={shopLink} className="inline-flex items-center gap-1 mb-1.5 min-w-0 text-xs font-bold text-slate-200 hover:text-pink-300 transition">
          <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] shrink-0">🏢</span>
          <span className="truncate">{r.shopName}</span>
          <span className="text-[10px] text-slate-500 font-normal shrink-0">の店舗ページ ›</span>
        </Link>

        {!expanded ? (
          <>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{r.snippet}…</p>
            <button
              type="button"
              onClick={handleExpand}
              className="self-start mt-1 text-[11px] font-bold text-pink-400 hover:text-pink-300 transition"
            >
              続きを読む ↓
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {loading ? '読み込み中…' : body}{!loading && '…'}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <Link to={threadLink} className="text-[11px] font-black text-pink-400 hover:text-pink-300 transition">全文を読む → セラピストページ</Link>
              <Link to={shopLink} className="text-[11px] font-bold text-slate-300 hover:text-pink-300 transition">🏢 店舗ページ（料金・出勤）</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
