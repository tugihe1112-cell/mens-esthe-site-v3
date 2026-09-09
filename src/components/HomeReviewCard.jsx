import React from 'react';
import { Link } from '../compat/router';
import LazyImage from './LazyImage.jsx';
import { trackEvent } from '../utils/analytics';
import { ratingGradientClass } from '../utils/ratingStyle';

// ホーム「最新の実体験口コミ」＝呼水カード。
// 情報序列は【店舗ファースト】:
//   上段: 写真80×104 ＋ 店舗名(16px・2行) / セラピスト名(14px) / 日時・投稿者(12px) / ★
//   下段: 要約本文（カード全幅・14px・行高1.7）→ 6軸 → 「口コミ全文を読む」
//
// ⚠️ 2026-09-08（DESIGN.md U02）: 以前は「続きを読む」→ Supabaseから冒頭300字を取得 →
//    「全文を読む」という**二段階**だった。押してから待たされ、待った先も本文ではない。
//    通常のリンク1回（人物ページの該当口コミへ直行）に変更し、
//    そのためだけの `body/loading/expanded/handleExpand` とSupabase取得を削除した。
// ⚠️ 写真の右の細い列に本文を閉じ込めない。スマホで1行あたりの文字数が少なすぎて読めない。

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
  const isHero = variant === 'hero';
  const isQuote = !r.image; // 写真なし＝引用カード
  const rating = r.rating != null ? Number(r.rating) : null;
  const time = relTime(r.createdAt);

  // ⚠️ F01/U04: 該当の口コミそのものへ着地させる。`#review-<id>` は
  //    ModernReviewCard 側の article id と対になっている。片方だけ変えない。
  const threadLink = `/shops/${r.shopId}/threads/${r.therapistId}`;
  const reviewLink = r.id ? `${threadLink}#review-${r.id}` : threadLink;
  // 検索中継ではなく正規の店舗URLへ直結し、利用者とクローラーの行き止まりをなくす。
  const shopLink = `/shops/${r.shopId}`;
  const loc = [r.prefecture, r.area].filter(Boolean).join('・');
  const dr = r.detailedRatings || null;

  const onOpen = () => {
    // パーソナライズ: クリックした県を記憶→次回訪問時にその県ブロックを先頭へ（UIなし・自動）
    try { if (r.prefecture) localStorage.setItem('preferredReviewPref', r.prefecture); } catch {}
    trackEvent('select_home_review', { position, therapist_id: r.therapistId, variant: isQuote ? 'quote' : variant, pref });
  };

  const RatingBadge = rating != null ? (
    <span className={`inline-flex items-center font-black text-white bg-gradient-to-br ${ratingGradientClass(rating)} rounded-md px-1.5 py-0.5 shrink-0 shadow`} style={{ fontSize: '12px' }}>
      ★ {rating.toFixed(1)}
    </span>
  ) : null;

  const Meta = (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <Link
          to={shopLink}
          onClick={onOpen}
          className="min-w-0 font-black text-white hover:text-pink-300 transition line-clamp-2"
          style={{ fontSize: '16px', lineHeight: 1.5 }}
        >
          {r.shopName}
        </Link>
        {RatingBadge}
      </div>
      <Link
        to={threadLink}
        onClick={onOpen}
        className="mt-1 block truncate font-bold text-slate-200 hover:text-pink-300 transition"
        style={{ fontSize: '14px' }}
      >
        {r.therapistName}
      </Link>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-400" style={{ fontSize: '12px' }}>
        {time && (
          <span className="inline-flex items-center gap-1">
            {time.isNew && <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />}
            {time.label}
          </span>
        )}
        {r.userName && <span>by <span className="font-bold text-slate-300">{r.userName}</span></span>}
        {loc && <span className="text-pink-200">📍 {loc}</span>}
        {r.course && <span className="text-slate-300">🧾 {r.course}</span>}
      </div>
    </div>
  );

  // 値のない軸は表示しない（0点として描かない）。3列×2行。
  const MiniBars = dr ? (
    <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 mt-3">
      {DR_LABELS.map(([k, label]) => {
        const v = Number(dr[k]) || 0;
        if (!v) return null;
        return (
          <div key={k} className="min-w-0">
            <div className="flex items-center justify-between gap-1 text-slate-400" style={{ fontSize: '12px' }}>
              <span className="truncate">{label}</span>
              <span className="font-bold text-slate-200">{v.toFixed(1)}</span>
            </div>
            <div className="mt-0.5 h-1 rounded-full bg-slate-800 overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${ratingGradientClass(v)}`} style={{ width: `${Math.min((v / 5) * 100, 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  ) : null;

  const Body = (
    <>
      <p className="mt-3 text-slate-300" style={{ fontSize: '14px', lineHeight: 1.7 }}>{r.snippet}…</p>
      {isHero && MiniBars}
      <Link
        to={reviewLink}
        onClick={onOpen}
        className="ui-link mt-2 inline-flex min-h-11 items-center font-bold"
        style={{ fontSize: '13px' }}
      >
        口コミ全文を読む →
      </Link>
    </>
  );

  const shell = `rounded-2xl border bg-slate-900 p-4 transition-all duration-300 ${
    isHero ? 'md:col-span-2 border-pink-500/25 hover:border-pink-500/50' : 'border-white/10 hover:border-pink-500/40'
  }`;

  // ── 引用カード（写真なし）＝文章が主役 ──────────
  if (isQuote) {
    return (
      <article className={shell}>
        <div className="flex gap-3">{Meta}</div>
        {Body}
      </article>
    );
  }

  return (
    <article className={shell}>
      <div className="flex gap-3">
        <Link to={reviewLink} onClick={onOpen} className="shrink-0 overflow-hidden rounded-xl bg-slate-800" style={{ width: '80px', height: '104px' }}>
          <LazyImage src={r.image} alt={r.therapistName} width={240} className="w-full h-full object-cover" />
        </Link>
        {Meta}
      </div>
      {Body}
    </article>
  );
}
