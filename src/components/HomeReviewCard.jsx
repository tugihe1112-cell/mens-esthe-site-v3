import React from 'react';
import { Link } from '../compat/router';
import LazyImage from './LazyImage.jsx';
import { trackEvent } from '../utils/analytics';
import { isNotListed, NOT_LISTED_SHORT } from '../utils/therapistStatus.js';
import { PREFERRED_PREF_KEY } from '../utils/homeReviews';
import RatingFingerprint from './RatingFingerprint.jsx';

// ホーム「最新の実体験口コミ」＝呼水カード。2種類ある。
//   hero    … 欄の先頭の最新1件。写真・店舗名・来店情報・要約・6軸・「口コミ全文を読む」
//   compact … その下に並ぶ新着。人物・店舗・★・要約3行・投稿者と日時。カード全体が1つのリンク
//
// ⚠️ 2026-09-08（DESIGN.md U02）: 以前は「続きを読む」→ Supabaseから冒頭300字を取得 →
//    「全文を読む」という**二段階**だった。押してから待たされ、待った先も本文ではない。
//    通常のリンク1回（人物ページの該当口コミへ直行）にしてある。戻さない。
// ⚠️ スマホで写真の右の細い列に本文を閉じ込めない（1行の文字数が少なすぎて読めない）。
//    hero はスマホでは本文から下をカード全幅、PCでは写真の右の列に置く（列が十分広い）。

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

// 写真が無い人の頭文字アバター。色は口コミIDから決める（乱数にするとSSRと画面で色が変わる）。
// 色は墨と朱の濃淡だけ（2026-09-30・デザインA案＝差し色は朱1色）
const AVATAR_GRADIENTS = [
  'from-pink-700 to-slate-900',
  'from-purple-600 to-slate-900',
  'from-slate-600 to-slate-900',
  'from-pink-500 to-purple-800',
  'from-slate-500 to-slate-800',
  'from-purple-500 to-slate-950',
];
function avatarGradient(seed) {
  let h = 0;
  for (const ch of String(seed || '')) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}
const initialOf = (name) => Array.from(String(name || '').replace(/[\s　]/g, ''))[0] || '·';
// 狭いカードでは末尾の読み仮名（カタカナだけの括弧）を外す: "TIGER GATE (タイガーゲート)" → "TIGER GATE"
//   括弧の中にカタカナ以外があるもの（地名・支店名など）は外さない。最新1件の大きいカードは店名をそのまま出す。
const withoutReading = (name) => String(name || '').replace(/[\s　]*[（(][ァ-ヴー・\s　]+[）)]$/u, '').trim() || name;

function InitialAvatar({ name, seed, className = '', textClass = '' }) {
  return (
    <div aria-hidden="true" className={`flex items-center justify-center bg-gradient-to-br ${avatarGradient(seed)} ${className}`}>
      <span className={`font-black text-white/85 ${textClass}`}>{initialOf(name)}</span>
    </div>
  );
}

export default function HomeReviewCard({ r, variant = 'compact', position, pref, tag }) {
  const isHero = variant === 'hero';
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
  const notListed = isNotListed(r);

  const onOpen = () => {
    // 口コミを開いた県を覚える → 次回その県のチップを「すべて」の次に出す（選択まではしない）
    try { if (r.prefecture) localStorage.setItem(PREFERRED_PREF_KEY, r.prefecture); } catch {}
    trackEvent('select_home_review', { position, therapist_id: r.therapistId, variant, pref });
  };

  // 点数は数字の書体で（★の色付きの札はやめた・2026-09-30）。読み上げでは「評価 3.8」。
  const RatingBadge = rating != null ? (
    <span className="shrink-0 font-numeral text-[22px] font-semibold leading-none text-slate-50" aria-label={`評価 ${rating.toFixed(1)}`}>
      {rating.toFixed(1)}
    </span>
  ) : null;

  // ⚠️ 在籍一覧から外れた人を現役として送らない。断定はしない（退店とは書かない）。
  const NotListedBadge = notListed ? (
    <span className="shrink-0 rounded-sm border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 font-bold text-amber-200" style={{ fontSize: '11px' }}>
      {NOT_LISTED_SHORT}
    </span>
  ) : null;

  // ── 新着（コンパクト）──────────────────────────────
  // カード全体を1つのリンクにする（人物名のリンクを after で全面に広げる）。
  // 中に別のリンクを置かない＝どこを押しても同じ口コミへ行く。
  // ⚠️ index.css はスマホ幅で全ての a/button に min-height:44px を付ける。行の中の文字リンクに
  //    そのまま効くと、名前の下に20px以上の空白ができて店名が離れる（2026-09-22 描画して発見）。
  //    押せる範囲は「カード全体（after）」や「py-3 -my-3（見た目の位置は変えずに上下へ広げる）」で確保し、
  //    文字リンク自体は min-h-0 にする。
  if (!isHero) {
    const sub = [withoutReading(r.shopName), r.area].filter(Boolean).join('・');
    const foot = [r.userName ? `by ${r.userName}` : null, time?.label].filter(Boolean).join(' · ');
    return (
      <article
        className="group relative flex h-full flex-col overflow-hidden rounded-sm border border-slate-800 bg-slate-900 px-4 pb-3 pt-3.5 transition-colors hover:border-pink-500/50"
      >
        <div className="flex items-center gap-2.5">
          {r.image ? (
            // 名前は隣のリンクで読み上げるので、写真は読み上げから外す（altは読み込み失敗時の頭文字に使われる）
            <div aria-hidden="true" className="h-10 w-10 shrink-0">
              <LazyImage
                src={r.image}
                alt={r.therapistName}
                width={120}
                className="h-10 w-10 rounded-full bg-slate-800"
                imgClassName="w-full h-full object-cover object-top"
              />
            </div>
          ) : (
            <InitialAvatar name={r.therapistName} seed={r.id} className="h-10 w-10 shrink-0 rounded-full" textClass="text-[15px]" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <Link
                to={reviewLink}
                onClick={onOpen}
                className="min-h-0 truncate font-mincho font-bold text-slate-50 after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-pink-400"
                style={{ fontSize: '15px', lineHeight: 1.35 }}
              >
                {r.therapistName}
                <span className="sr-only">の口コミを読む</span>
              </Link>
              {NotListedBadge}
            </div>
            {sub && <p className="truncate text-slate-400" style={{ fontSize: '12px', lineHeight: 1.5 }}>{sub}</p>}
          </div>
          {RatingBadge}
        </div>
        <p className="mt-2.5 line-clamp-3 text-slate-300" style={{ fontSize: '13px', lineHeight: 1.7 }}>{r.snippet}…</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5 text-slate-400" style={{ fontSize: '12px' }}>
          <span className="min-w-0 truncate">{foot}</span>
          <span aria-hidden="true" className="shrink-0 font-bold text-pink-300 group-hover:text-pink-200">読む →</span>
        </div>
      </article>
    );
  }

  // ── 最新1件（hero）────────────────────────────────
  // 6項目は小さな「採点の形」で出す（棒6本より形の違いが一目で分かる・口コミページと同じ図）。
  const hasAxes = !!dr && DR_LABELS.some(([k]) => Number(dr[k]) > 0);

  return (
    <article className="relative rounded-sm border border-slate-700 bg-slate-900 p-4 md:p-5">
      {tag && (
        <span className="absolute -top-3 left-4 bg-pink-500 px-2.5 py-0.5 font-bold tracking-wide text-slate-950 md:left-5" style={{ fontSize: '11px' }}>
          {tag}
        </span>
      )}
      <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-x-3.5 gap-y-3 md:grid-cols-[132px_minmax(0,1fr)] md:gap-x-5 md:gap-y-0">
        <Link
          to={reviewLink}
          onClick={onOpen}
          tabIndex={-1}
          aria-hidden="true"
          className="h-[110px] w-[84px] overflow-hidden border border-slate-700 bg-slate-800 md:row-span-2 md:h-[172px] md:w-[132px]"
        >
          {r.image ? (
            <LazyImage src={r.image} alt={r.therapistName} width={300} className="h-full w-full" />
          ) : (
            <InitialAvatar name={r.therapistName} seed={r.id} className="h-full w-full" textClass="text-[28px] md:text-[42px]" />
          )}
        </Link>

        <div className="min-w-0">
          <p className="truncate text-xs tracking-[0.12em] text-slate-400">
            {loc && <>{loc} · </>}
            <Link to={shopLink} onClick={onOpen} className="-my-3 min-h-0 py-3 text-slate-300 transition hover:text-pink-300">
              {r.shopName}
            </Link>
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Link to={threadLink} onClick={onOpen} className="-my-3 min-h-0 truncate py-3 font-mincho text-xl font-bold text-slate-50 transition hover:text-pink-300 md:text-2xl">
              {r.therapistName}
            </Link>
            {NotListedBadge}
          </div>
          <div className="mt-2 flex items-center gap-4">
            {rating != null && (
              <span className="flex items-end gap-1.5">
                <span className="font-numeral text-[40px] font-semibold leading-[0.85] text-slate-50" aria-label={`評価 ${rating.toFixed(1)}`}>{rating.toFixed(1)}</span>
                <span className="pb-0.5 text-xs text-slate-400">/ 5</span>
              </span>
            )}
            {hasAxes && <RatingFingerprint values={dr} size="mini" />}
            <div className="min-w-0 text-xs text-slate-400">
              {time && (
                <p className="inline-flex items-center gap-1">
                  {time.isNew && <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />}
                  {time.label}
                </p>
              )}
              {r.userName && <p className="truncate">by {r.userName}</p>}
            </div>
          </div>
          {r.course && (
            <p className="mt-2.5 w-fit max-w-full truncate border border-slate-800 px-2.5 py-1 text-slate-300" style={{ fontSize: '12px' }}>
              {r.course}
            </p>
          )}
        </div>

        <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2">
          <p className="line-clamp-4 text-slate-300 md:mt-3 md:line-clamp-3" style={{ fontSize: '14px', lineHeight: 1.85 }}>{r.snippet}…</p>
          <Link
            to={reviewLink}
            onClick={onOpen}
            className="ui-link mt-2 inline-flex min-h-11 items-center font-bold"
            style={{ fontSize: '13px' }}
          >
            口コミ全文を読む →
          </Link>
        </div>
      </div>
    </article>
  );
}
