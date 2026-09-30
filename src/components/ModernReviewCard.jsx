import React, { useState, useEffect } from "react";
import { authHeaders } from '../utils/supabaseRest';
import { Link, useNavigate } from '../compat/router';
import ReviewLikeButton from './ReviewLikeButton.jsx';
import ThanksBadgeButton from './ThanksBadgeButton.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { trackEvent } from '../utils/analytics';
import ReviewStoryContent from './ReviewStoryContent.jsx';
import { useReturnTo } from '../utils/useReturnTo';
import { withReturnTo } from '../utils/authRedirect.js';
import { trackRegisterCtaClick } from '../utils/registerAnalytics';
import RatingFingerprint, { hasFingerprint } from './RatingFingerprint.jsx';
import { countReviewStoryChars } from '../features/reviews/reviewStory.mjs';

// --- ウォーターマーク ---
function Watermark({ text }) {
  if (!text) return null;
  const items = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none z-20"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {items.map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${(i % 4) * 28 - 5}%`,
            left: `${Math.floor(i / 4) * 38 - 10}%`,
            transform: 'rotate(-30deg)',
            fontSize: '11px',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.045)',
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
          }}
        >
          {text}
        </div>
      ))}
    </div>
  );
}

// DMボタン: チャットルームを作成または既存ルームに遷移
function DMButton({ toUserId, currentUser, navigate }) {
  const [isLoading, setIsLoading] = useState(false);
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  // ⚠️ 2026-08-12: anonキー固定をやめる（TO authenticated のRLSが発火しないため）

  const startDM = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const uid = currentUser.id;
      const tid = toUserId;
      // 既存ルームを検索（user1/user2どちらでも）
      const res = await fetch(
        `${url}/rest/v1/chat_rooms?or=(and(user1_id.eq.${uid},user2_id.eq.${tid}),and(user1_id.eq.${tid},user2_id.eq.${uid}))&select=id`,
        { headers: await authHeaders() }
      );
      const existing = await res.json();
      if (Array.isArray(existing) && existing.length > 0) {
        navigate(`/chat/${existing[0].id}`);
        return;
      }
      // 新規作成
      // ⚠️ 2026-08-12: ここは削除済みのモジュール定数 `headers` を参照しており
      //    ReferenceError になっていた（既存ルームが無い＝新規作成時のみ発生する回帰）。
      const createRes = await fetch(`${url}/rest/v1/chat_rooms`, {
        method: 'POST',
        headers: await authHeaders({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
        body: JSON.stringify({ user1_id: uid, user2_id: tid }),
      });
      // ⚠️ 2026-08-12: HTTPエラーと「0件しか返らない」を両方確認する
      //    （PostgREST は RLS で弾かれても 2xx を返しうるため res.ok だけでは足りない）
      if (!createRes.ok) throw new Error(`チャットを開始できませんでした (HTTP ${createRes.status})`);
      const created = await createRes.json().catch(() => []);
      if (!Array.isArray(created) || created.length === 0) {
        throw new Error('チャットルームを作成できませんでした（権限不足の可能性があります）');
      }
      if (created[0]) {
        navigate(`/chat/${created[0].id}`);
      } else if (created?.id) {
        navigate(`/chat/${created.id}`);
      }
    } catch (e) {
      alert('DMの開始に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={startDM}
      disabled={isLoading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border bg-slate-800 border-white/10 text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300 disabled:opacity-50"
    >
      <span style={{ fontSize: '12px' }}>💬</span>
      <span>DM</span>
    </button>
  );
}

// 日付は日本時間で「2026.09.05」。サーバー（UTC）と画面（JST）で日付がずれないよう自前で組む。
function formatJstDate(value) {
  const t = value ? new Date(value).getTime() : NaN;
  if (!Number.isFinite(t)) return null;
  const d = new Date(t + 9 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
}

// 引用（大きな明朝で1文だけ見せる）。総評の中から**本文の文をそのまま**選ぶ。言い換えない・つながない。
// ⚠️ 後読みの正規表現（(?<=…)）は古い iPhone の Safari で読み込みごと止まるので使わない。
function pickPullQuote(storySections) {
  const src = String(storySections?.exit || '').trim();
  if (!src) return '';
  const sentences = (src.match(/[^。！？!?\n]+[。！？!?]?/g) || []).map((s) => s.trim());
  // 長すぎる文は引用にしない（大きな文字で4行を超えると、引用ではなく本文の繰り返しに見える）
  return sentences.find((s) => s.length >= 12 && s.length <= 46 && !/^[「『（(・]/.test(s)) || '';
}

// 最初は畳んでおく区分。「ご対面（写真との違い）」と「総評」を開けておく＝判断に効く2つを先に読ませる。
const COLLAPSED_SECTIONS = ['entrance', 'session', 'ratings_note'];

const PenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 20l4-1 11-11-3-3L5 16z" /></svg>
);

/**
 * @param reportNo      この人の何本目のレポートか（古い順に 01〜）。一覧側が数える。
 * @param showTherapist 人物ページでは見出しに名前があるので出さない
 */
export default function ModernReviewCard({ review, reportNo = null, showTherapist = true }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const reviewReturnTo = useReturnTo();
  const { user, userPlan } = useAuth();
  const navigate = useNavigate();
  const [creditDays, setCreditDays] = useState(null);
  // 来店時期と投稿日は別物。来店月が無いときに投稿日を「来店日」と誤表示しない。
  const postedDate = formatJstDate(review.created_at || review.createdAt || review.timestamp || review.date || null);
  const visitMonthRaw = review.visit_month || review.visitMonth || null;
  const visitMonth = visitMonthRaw
    ? `${String(visitMonthRaw).replace(/来店$/, '')}来店`
    : null;
  const totalAmountRaw = review.total_amount ?? review.totalAmount ?? review.total_price ?? review.totalPrice;
  const totalAmount = Number(totalAmountRaw);
  const totalLabel = Number.isFinite(totalAmount) && totalAmount > 0
    ? `総額 ¥${totalAmount.toLocaleString('ja-JP')}`
    : null;

  const isPremium = userPlan === 'premium' || userPlan === 'vip';

  // 閲覧日数を取得（ログイン済みのみ）
  useEffect(() => {
    if (!user) { setCreditDays(0); return; }
    const url = process.env.VITE_SUPABASE_URL;
    // ⚠️ 2026-08-12: user_credits_read_own は TO authenticated。
    //    anonキー固定で送っていたため、12_適用後は残高が必ず空になりW2Rが死ぬ。
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${url}/rest/v1/user_credits?user_id=eq.${user.id}&select=credits_days,expires_at`,
          { headers: await authHeaders() }
        );
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          const { credits_days, expires_at } = data[0];
          const expired = expires_at && new Date(expires_at) < new Date();
          setCreditDays(expired ? 0 : (credits_days || 0));
        } else {
          setCreditDays(0);
        }
      } catch {
        if (!cancelled) setCreditDays(0);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // 閲覧権限: プレミアム OR 閲覧日数あり OR owner_manual口コミ OR 公開口コミ（各セラピストの1件目）
  // ⚠️ 2026-08-12 追加: **投稿者本人**の条件が抜けていた。
  //    DB側の reviews_own_read は本人へ非公開口コミを返すのに、UIがロックしていた。
  //    影響例＝200字未満でcreditsが付かなかった自分の投稿・manual投稿・credits期限切れ後の自分の投稿。
  //    「自分が書いたものが自分で読めない」は最も不合理なので必ず通す。
  const isOwnReview = !!(user?.id && review.user_id && String(review.user_id) === String(user.id));
  const canReadFull =
    isOwnReview
    || isPremium
    || (creditDays !== null && creditDays > 0)
    || review.user_id === 'owner_manual'
    || review.is_public === true;

  // ⚠️ U04: URLのアンカー（#review-<id>）で名指しされた口コミは折り畳みを開く。
  //    登録→メール確認→元の口コミへ戻る、の最後の一歩がここ。
  //    **権限のない本文をURLだけで開かない**ので canReadFull を条件に入れる。
  useEffect(() => {
    if (!canReadFull || !review.id) return;
    if (typeof window === 'undefined') return;
    if (window.location.hash === `#review-${review.id}`) setIsExpanded(true);
  }, [canReadFull, review.id]);

  // ── セラピストへのリンク可否（snake/camel 両対応・manual_ は非リンク）──
  const cardShopId = review.shop_id || review.shopId || '';
  const cardTherapistId = review.therapist_id || review.therapistId || '';
  const therapistLabel = review.therapist_name || review.therapistName || 'セラピスト';
  const therapistLinkable =
    !!cardShopId && !!cardTherapistId && !/^manual_/i.test(cardTherapistId);

  // 6軸（snake/camel両対応・DBは detailed_ratings）
  const dr = review.detailedRatings || review.detailed_ratings || {};
  const hasScores = hasFingerprint(dr);
  const evidenceFacts = [visitMonth, review.course || null, totalLabel].filter(Boolean);

  const storySections = review.story_sections || review.storySections;
  const isStructured = !!storySections && typeof storySections === 'object' && !Array.isArray(storySections);
  const charCount = isStructured ? countReviewStoryChars(storySections) : String(review.content || '').length;
  const pullQuote = canReadFull && isStructured ? pickPullQuote(storySections) : '';
  const rating = Number(review.rating || 0);
  const trackOpen = () => trackEvent('expand_review', { therapist_id: review.therapistId || review.therapist_id });

  // ウォーターマーク用テキスト（ログイン済みはメールの一部、未ログインはサイト名）
  const wmText = user?.email
    ? `${user.email.split('@')[0]} · mens-esthe.map`
    : 'mens-esthe.map';

  return (
    // ⚠️ F01/U04: 登録から戻ってきた人・ホームからのリンクが、同じ口コミを開けるようにする。
    //    scroll-margin-top はヘッダー(64/72px)ぶん。付けないとアンカー先が隠れる。
    <article
      id={review.id ? `review-${review.id}` : undefined}
      style={{ scrollMarginTop: '96px' }}
      className="relative w-full max-w-3xl mx-auto mb-10 border-t border-slate-700 pt-7"
    >
      {/* ウォーターマーク */}
      <Watermark text={wmText} />

      <div className="relative z-10">
        {/* 1. 号数と種別 */}
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <span className="font-numeral text-[16px] tracking-wide text-pink-300">
            {reportNo ? `Report No.${String(reportNo).padStart(2, '0')}` : 'Report'}
          </span>
          <span className="text-[11px] tracking-[0.12em] text-slate-400">実体験レポート</span>
        </div>

        {/* PC（sm以上）では、左に点数・投稿者・証拠行、右に採点の形を並べる */}
        <div className={hasScores ? 'sm:grid sm:grid-cols-[minmax(0,1fr)_300px] sm:items-start sm:gap-8' : ''}>
          <div className="min-w-0">
            {/* 2. 点数（大きな数字）・投稿者・字数 */}
            <div className="flex items-end gap-3.5">
              <span className="font-numeral text-[64px] font-semibold leading-[0.85] text-slate-50" aria-label={`評価 ${rating.toFixed(1)}（5点満点）`}>
                {rating.toFixed(1)}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5 pb-1 text-xs">
                <span className="text-slate-400">/ 5</span>
                <span className="truncate text-slate-300">
                  {review.userName || review.user_name || '匿名'}{postedDate && <span className="text-slate-400"> · {postedDate}</span>}
                </span>
                {charCount > 0 && <span className="text-slate-400">{charCount.toLocaleString('ja-JP')}字</span>}
              </div>
            </div>

            {/* 対象名（一覧で使うとき）。RESTのsnake_caseとmanual IDの扱いを維持する。 */}
            {showTherapist && (
              <div className="mt-4">
                {therapistLinkable ? (
                  <Link
                    to={`/shops/${cardShopId}/threads/${cardTherapistId}`}
                    className="inline-flex min-h-11 items-center font-mincho text-xl font-bold text-slate-50 hover:text-pink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                  >
                    {therapistLabel}
                  </Link>
                ) : (
                  <h2 className="font-mincho text-xl font-bold leading-tight text-slate-50">{therapistLabel}</h2>
                )}
              </div>
            )}

            {/* 3. 証拠行: 来店月→コース→総額。無い項目は表示しない。 */}
            {evidenceFacts.length > 0 && (
              <p className="mt-5 border border-slate-800 px-3.5 py-3 text-[13px] leading-relaxed text-slate-300">
                {evidenceFacts.join(' / ')}
              </p>
            )}
          </div>

          {/* 4. 採点の指紋（6項目の形） */}
          {hasScores && <RatingFingerprint values={dr} className="mt-6 sm:mt-0" />}
        </div>

        {/* 5. 引用（読める口コミだけ。ロック中の本文を大きな文字で漏らさない） */}
        {pullQuote && (
          <blockquote aria-hidden="true" className="relative mt-8 mb-2 max-w-[26em] pt-7 font-mincho text-[22px] font-bold leading-[1.6] text-slate-50 sm:text-[25px]" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
            <span className="absolute -left-0.5 -top-3 font-numeral text-[64px] leading-none text-pink-500">&ldquo;</span>
            {pullQuote}
          </blockquote>
        )}

        {/* 6. 本文 */}
        <div className="relative mt-6">
          {canReadFull ? (
            isStructured ? (
              <ReviewStoryContent
                content={review.content || ''}
                storySections={review.story_sections || review.storySections}
                collapseIds={isExpanded ? [] : COLLAPSED_SECTIONS}
                onSectionOpen={trackOpen}
                className="max-w-[42em] border-t border-slate-800 pt-5 text-[15px] leading-[2] text-slate-200"
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                onCopy={e => e.preventDefault()}
                onCut={e => e.preventDefault()}
                onContextMenu={e => e.preventDefault()}
              />
            ) : (
              <>
                <ReviewStoryContent
                  content={review.content || ''}
                  storySections={review.story_sections || review.storySections}
                  className={`border-t border-slate-800 pt-5 text-[15px] leading-[2] text-slate-200 whitespace-pre-wrap ${!isExpanded && "line-clamp-6"}`}
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                  onCopy={e => e.preventDefault()}
                  onCut={e => e.preventDefault()}
                  onContextMenu={e => e.preventDefault()}
                />
                {(review.content || "").length > 150 && (
                  <button
                    onClick={() => {
                      // 「読みたくなった瞬間」の量を可視化＝W2Rの入口の需要指標。
                      if (!isExpanded) trackOpen();
                      setIsExpanded(!isExpanded);
                    }}
                    className="mt-2 inline-flex min-h-11 items-center text-xs font-bold text-pink-400 hover:text-pink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                  >
                    {isExpanded ? "閉じる" : "続きを読む"}
                  </button>
                )}
              </>
            )
          ) : (
            /* ロック表示: 冒頭を少し読ませてから焦らす（メータード） */
            <div className="relative border-t border-slate-800 pt-5">
              {/* チラ見せ（冒頭をクリアに表示し、下にいくほどフェード） */}
              <div
                className="text-[15px] leading-[2] text-slate-300 line-clamp-3 select-none pointer-events-none"
                style={{
                  WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                  maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                }}
                onCopy={e => e.preventDefault()}
                onContextMenu={e => e.preventDefault()}
              >
                {(review.content || "").replace(/[【】]/g, ' ').slice(0, 140)}
              </div>
              {/* 焦らしCTA */}
              <div className="mt-3 border border-pink-500/30 bg-slate-950 px-5 py-5 text-center">
                <p className="mb-2 text-xs font-bold text-pink-300">続き{Math.max(0, (review.content || '').length - 140)}文字は限定公開</p>
                <p className="mb-1 font-mincho text-base font-bold leading-snug text-slate-50">体験談を投稿すると<br/>この続きが読めます</p>
                <p className="mb-4 text-xs text-slate-400">1件投稿で<span className="font-bold text-pink-300">最大7日間読み放題</span>（即時自動付与）</p>
                {/* ⚠️ U04: ここは会員・未登録の区別なく「投稿して続きを読む」だけだった。
                       未登録の人にとって投稿は登録より遠い操作で、行き止まりになる。
                       未登録には登録CTA、会員には投稿CTAを出す。 */}
                {user ? (
                  <Link
                    to="/post-review"
                    onClick={() => trackEvent('click_paywall_cta', { target: 'post_review', source: 'review_lock' })}
                    className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-pink-500 px-6 text-sm font-bold text-slate-950 transition hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                  >
                    <PenIcon />体験談を投稿して続きを読む
                  </Link>
                ) : (
                  <Link
                    to={withReturnTo('/register', reviewReturnTo, { source: 'review_lock' })}
                    onClick={() => { trackEvent('click_paywall_cta', { target: 'register', source: 'review_lock' }); trackRegisterCtaClick('review_lock'); }}
                    className="inline-flex min-h-11 items-center rounded-sm bg-pink-500 px-6 text-sm font-bold text-slate-950 transition hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                  >
                    無料登録して続きを読む
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 7. タグ・参考になった */}
        {/* ⚠️ 2026-08-12: 感謝バッジ(ThanksBadgeButton)とDM(DMButton)の導線を一時的に外した。
            オーナー確定事項 D-006「掲示板・チャット・感謝バッジは一時的に非表示」に従う。
            再開したいときはこのブロックにボタンを戻すだけでよい（コードは残してある）。 */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {(review.tags || []).map((tag, i) => (
              <span key={i} className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                {tag}
              </span>
            ))}
          </div>
          <div className="ml-auto"><ReviewLikeButton reviewId={review.id} initialLikeCount={review.like_count || 0} /></div>
        </div>
      </div>
    </article>
  );
}
