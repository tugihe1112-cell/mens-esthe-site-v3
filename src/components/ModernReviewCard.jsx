import React, { useState, useEffect } from "react";
import { authHeaders } from '../utils/supabaseRest';
import { Link, useNavigate } from '../compat/router';
import ReviewLikeButton from './ReviewLikeButton.jsx';
import ThanksBadgeButton from './ThanksBadgeButton.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { trackEvent } from '../utils/analytics';
import ReviewStoryContent from './ReviewStoryContent.jsx';

// --- ウォーターマーク ---
function Watermark({ text }) {
  if (!text) return null;
  const items = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-20"
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

// タグの系統別色分け（体型=ピンク・雰囲気=パープル・年代=ブルー・属性=スレート）
const TAG_BODY = ['スレンダー', 'グラマー', '巨乳', '美脚', '小柄', '高身長'];
const TAG_MOOD = ['可愛い系', '美人系', '清楚系', 'ギャル系', 'お姉さん系'];
const TAG_AGE = ['10代', '20代前半', '20代後半', '30代', '40代'];
const tagStyle = (tag) => {
  if (TAG_BODY.includes(tag)) return 'bg-pink-500/15 text-pink-200 border-pink-500/40';
  if (TAG_MOOD.includes(tag)) return 'bg-purple-500/15 text-purple-200 border-purple-500/40';
  if (TAG_AGE.includes(tag)) return 'bg-blue-500/15 text-blue-200 border-blue-500/40';
  return 'bg-slate-600/20 text-slate-300 border-slate-500/40'; // 属性・その他
};

// --- アイコン (Lucide互換) ---
const Icons = {
  Eye: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Heart: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
  Sparkles: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
  Activity: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Hand: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>,
  Tag: () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94 .94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>,
  ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

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

export default function ModernReviewCard({ review }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user, userPlan } = useAuth();
  const navigate = useNavigate();
  const [creditDays, setCreditDays] = useState(null);
  // 来店時期と投稿日は別物。来店月が無いときに投稿日を「来店日」と誤表示しない。
  const postedAt = review.created_at || review.createdAt || review.timestamp || review.date || null;
  const postedDateValue = postedAt ? new Date(postedAt) : null;
  const postedDate = postedDateValue && !Number.isNaN(postedDateValue.getTime())
    ? postedDateValue.toLocaleDateString('ja-JP')
    : null;
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
    const key = process.env.VITE_SUPABASE_ANON_KEY;
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

  // ── セラピストへのリンク可否（snake/camel 両対応・manual_ は非リンク）──
  const cardShopId = review.shop_id || review.shopId || '';
  const cardTherapistId = review.therapist_id || review.therapistId || '';
  const therapistLabel = review.therapist_name || review.therapistName || 'セラピスト';
  const therapistLinkable =
    !!cardShopId && !!cardTherapistId && !/^manual_/i.test(cardTherapistId);

  // 6軸メトリクス（snake/camel両対応・DBは detailed_ratings）
  const dr = review.detailedRatings || review.detailed_ratings || {};
  const scores = [
    { label: "清潔感", value: Number(dr.cleanliness) || 0 },
    { label: "ルックス", value: Number(dr.looks) || 0 },
    { label: "スタイル", value: Number(dr.style) || 0 },
    { label: "接客", value: Number(dr.service) || 0 },
    { label: "マッサージ", value: Number(dr.massage) || 0 },
    { label: "密着", value: Number(dr.intimacy) || 0 },
  ];
  const hasScores = scores.some((s) => s.value > 0);
  const evidenceFacts = [visitMonth, review.course || null, totalLabel].filter(Boolean);

  // ウォーターマーク用テキスト（ログイン済みはメールの一部、未ログインはサイト名）
  const wmText = user?.email
    ? `${user.email.split('@')[0]} · mens-esthe.map`
    : 'mens-esthe.map';

  return (
    <article className="relative w-full max-w-3xl mx-auto mb-5">
      <div className="absolute inset-0 bg-slate-900/95 rounded-2xl border border-white/10 shadow-lg" />
      {/* ウォーターマーク */}
      <Watermark text={wmText} />

      <div className="relative p-4 sm:p-5 z-10">
        {/* 1. 証拠行: 来店月→コース→総額。無い項目は表示しない。 */}
        {evidenceFacts.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pb-3 mb-3 border-b border-white/10 text-xs font-medium text-slate-300">
            {evidenceFacts.map((fact, index) => (
              <React.Fragment key={`${fact}-${index}`}>
                {index > 0 && <span aria-hidden="true" className="text-slate-600">/</span>}
                <span>{fact}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* 2. 投稿種別・評価・投稿者 */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
          <span className="rounded-xl border border-pink-500/30 bg-pink-500/10 px-2.5 py-1 font-bold text-pink-200">実体験レポート</span>
          <span className="font-black text-white">評価 {Number(review.rating || 0).toFixed(1)}</span>
          <span className="text-slate-400">by {review.userName || review.user_name || '匿名'}</span>
          {postedDate && <span className="ml-auto text-slate-400">{postedDate}投稿</span>}
        </div>

        {/* 対象名。RESTのsnake_caseとmanual IDの扱いを維持する。 */}
        <div className="mb-4">
          {therapistLinkable ? (
            <Link
              to={`/shops/${cardShopId}/threads/${cardTherapistId}`}
              className="inline-flex min-h-11 items-center rounded-lg text-lg font-bold text-white hover:text-pink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
            >
              {therapistLabel}
            </Link>
          ) : (
            <h2 className="text-lg font-bold text-white leading-tight">{therapistLabel}</h2>
          )}
        </div>

        {/* 3. 6軸はモバイルも2行×3列で固定 */}
        {hasScores && (
          <div className="grid grid-cols-3 gap-x-3 gap-y-3 mb-5 rounded-2xl bg-slate-950/60 p-3 border border-white/5">
            {scores.map((score, i) => (
              <div key={i} className="min-w-0">
                <div className="mb-1 flex items-center justify-between gap-1 text-xs">
                  <span className="truncate font-medium text-slate-400">{score.label}</span>
                  <span className="font-bold text-slate-200">{Number(score.value).toFixed(1)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-pink-500" style={{ width: `${Math.min((score.value / 5) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. 本文 */}
        <div className="relative pt-4 border-t border-white/10">
          {canReadFull ? (
            <>
              <ReviewStoryContent
                content={review.content || ''}
                storySections={review.story_sections || review.storySections}
                className={`text-[15px] text-slate-200 leading-relaxed whitespace-pre-wrap ${!isExpanded && "line-clamp-4"}`}
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                onCopy={e => e.preventDefault()}
                onCut={e => e.preventDefault()}
                onContextMenu={e => e.preventDefault()}
              />
              {(review.content || "").length > 150 && (
                <button
                  onClick={() => {
                    // 「読みたくなった瞬間」の量を可視化＝W2Rの入口の需要指標。
                    // 従来は投稿ファネル側の計測しか無く、読む側は expand_home_review のみだった。
                    if (!isExpanded) trackEvent('expand_review', { therapist_id: review.therapistId || review.therapist_id });
                    setIsExpanded(!isExpanded);
                  }}
                  className="mt-2 inline-flex min-h-11 items-center rounded-lg text-xs font-bold text-pink-400 hover:text-pink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                >
                  {isExpanded ? "閉じる" : "続きを読む"}
                </button>
              )}
            </>
          ) : (
            /* ロック表示: 冒頭を少し読ませてから焦らす（メータード） */
            <div className="relative">
              {/* チラ見せ（冒頭をクリアに表示し、下にいくほどフェード） */}
              <div
                className="text-[15px] text-slate-300 leading-relaxed line-clamp-3 select-none pointer-events-none"
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
              <div className="mt-2 text-center px-5 py-4 bg-slate-950/90 rounded-2xl border border-pink-500/25">
                <p className="text-pink-300 font-bold text-xs mb-2">続き{Math.max(0, (review.content || '').length - 140)}文字は限定公開</p>
                <p className="text-white font-black text-sm mb-1 leading-tight">体験談を投稿すると<br/>この続きが読めます</p>
                <p className="text-slate-400 text-xs mb-3">1件投稿で<span className="text-pink-300 font-bold">最大7日間読み放題</span>（即時自動付与）</p>
                <Link
                  to="/post-review"
                  onClick={() => trackEvent('click_paywall_cta', { target: 'post_review' })}
                  className="inline-flex min-h-11 items-center rounded-2xl bg-pink-600 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-pink-900/40 transition hover:bg-pink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
                >
                  体験談を投稿して続きを読む →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* --- 4. TAGS (Footer) --- */}
        {review.tags?.length > 0 && (
          <div className="mt-5 pt-3 border-t border-white/5 flex flex-wrap gap-2">
              {review.tags.map((tag, i) => (
                <span key={i} className={`border px-3 py-1 rounded-xl text-xs font-bold ${tagStyle(tag)}`}>
                  {tag}
                </span>
              ))}
          </div>
        )}

      {/* いいね */}
      {/* ⚠️ 2026-08-12: 感謝バッジ(ThanksBadgeButton)とDM(DMButton)の導線を一時的に外した。
          オーナー確定事項 D-006「掲示板・チャット・感謝バッジは一時的に非表示」に従う。
          DB側（RLS・権限・トリガー）の安全化は 12_ で実施済みなので、
          再開したいときはこのブロックにボタンを戻すだけでよい。
          ※ DMButton / ThanksBadgeButton のコードは残してある（削除すると再開が面倒なため）。 */}
      <div className="flex justify-end items-center mt-2">
        <ReviewLikeButton reviewId={review.id} initialLikeCount={review.like_count || 0} />
      </div>

      </div>
    </article>
  );
}
