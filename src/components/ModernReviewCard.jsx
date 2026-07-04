import React, { useState, useEffect } from "react";
import { Link, useNavigate } from '../compat/router';
import ReviewLikeButton from './ReviewLikeButton.jsx';
import ThanksBadgeButton from './ThanksBadgeButton.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { trackEvent } from '../utils/analytics';

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

// --- ヘルパー関数 ---
const getScoreColor = (score) => {
  const num = Number(score);
  if (num >= 4.0) return "text-emerald-400";
  if (num >= 3.0) return "text-amber-400";
  return "text-rose-400";
};

const getBadgeStyle = (score) => {
  const num = Number(score);
  if (num >= 4.0) return "from-emerald-600 to-teal-600 shadow-emerald-900/40";
  if (num >= 3.0) return "from-amber-500 to-orange-600 shadow-amber-900/40";
  return "from-rose-600 to-red-700 shadow-rose-900/40";
};

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
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

  const startDM = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const uid = currentUser.id;
      const tid = toUserId;
      // 既存ルームを検索（user1/user2どちらでも）
      const res = await fetch(
        `${url}/rest/v1/chat_rooms?or=(and(user1_id.eq.${uid},user2_id.eq.${tid}),and(user1_id.eq.${tid},user2_id.eq.${uid}))&select=id`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      );
      const existing = await res.json();
      if (Array.isArray(existing) && existing.length > 0) {
        navigate(`/chat/${existing[0].id}`);
        return;
      }
      // 新規作成
      const createRes = await fetch(`${url}/rest/v1/chat_rooms`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user1_id: uid, user2_id: tid }),
      });
      const created = await createRes.json();
      if (Array.isArray(created) && created[0]) {
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
  const dateStr = review.timestamp ? new Date(review.timestamp).toLocaleDateString('ja-JP') : review.date || '日付不明';

  const isPremium = userPlan === 'premium' || userPlan === 'vip';

  // 閲覧日数を取得（ログイン済みのみ）
  useEffect(() => {
    if (!user) { setCreditDays(0); return; }
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    fetch(`${url}/rest/v1/user_credits?user_id=eq.${user.id}&select=credits_days,expires_at`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const { credits_days, expires_at } = data[0];
          const expired = expires_at && new Date(expires_at) < new Date();
          setCreditDays(expired ? 0 : (credits_days || 0));
        } else {
          setCreditDays(0);
        }
      })
      .catch(() => setCreditDays(0));
  }, [user]);

  // 閲覧権限: プレミアム OR 閲覧日数あり OR owner_manual口コミ OR 公開口コミ（各セラピストの1件目）
  const canReadFull = isPremium || (creditDays !== null && creditDays > 0) || review.user_id === 'owner_manual' || review.is_public === true;

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

  // ウォーターマーク用テキスト（ログイン済みはメールの一部、未ログインはサイト名）
  const wmText = user?.email
    ? `${user.email.split('@')[0]} · mens-esthe.map`
    : 'mens-esthe.map';

  return (
    <div className="group relative w-full max-w-2xl mx-auto mb-6 transition-all duration-300 hover:-translate-y-1">
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/90 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl" />
      {/* ウォーターマーク */}
      <Watermark text={wmText} />

      <div className="relative p-6 z-10">
        
        {/* --- 1. HERO HEADER (Subject Focused) --- */}
        <div className="flex justify-between items-start mb-5">
          <div>
            {/* SUBJECT: Therapist Name (Huge) */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                 <Link 
                   to={`/shops/${review.shopId}/threads/${review.therapistId}`}
                   className="hover:opacity-70 transition-opacity cursor-pointer block"
                 >
                   <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 tracking-tight leading-tight">
                   {review.therapist_name || review.therapistName || "セラピスト"}
                 </h2>
                 </Link>
              </div>
              
              {/* META: Reviewer (Tiny & Subdued) */}
              <div className="flex items-center gap-2 mt-1 ml-1">
                <div className="flex items-center gap-1.5 opacity-40 text-xs text-white">
                  <span className="w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center text-[8px]">👤</span>
                  <span className="font-normal">{review.userName || '匿名'}</span>
                </div>
                {review.user_id === 'owner_manual' && (
                  <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded px-1.5 py-0.5">運営取材レポート</span>
                )}
                <span className="text-[10px] text-slate-600">•</span>
                <span className="text-[10px] text-slate-500 font-mono">{dateStr}</span>
              </div>
            </div>
          </div>

          {/* RATING: Conclusion (Fixed Position) */}
          <div className={`flex flex-col items-center justify-center w-20 h-14 rounded-2xl bg-gradient-to-br ${getBadgeStyle(review.rating)} shadow-lg transform group-hover:scale-105 transition-transform flex-shrink-0 ml-4`}>
            <span className="text-2xl font-black text-white leading-none">
              {Number(review.rating || 0).toFixed(1)}
            </span>
            <span className="text-[9px] font-bold text-white/70 mt-0.5">★ 総合</span>
          </div>
        </div>

        {/* --- 2. METRICS (6軸バー・色分けemerald/amber/rose維持) --- */}
        {hasScores && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 mb-6">
            {scores.map((score, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[11px] font-bold w-14 text-slate-400 shrink-0">{score.label}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${getBadgeStyle(score.value)} transition-all duration-700`} style={{ width: `${Math.min((score.value / 5) * 100, 100)}%` }} />
                </div>
                <span className={`text-xs font-bold w-7 text-right ${getScoreColor(score.value)}`}>
                  {Number(score.value).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 来店情報（実体験の証拠を本文の直前に・信頼の即時演出） */}
        {review.course && (
          <div className="flex items-center gap-2 mb-3 text-[11px] bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <span className="text-slate-500 shrink-0">🧾</span>
            <span className="font-bold text-slate-400 shrink-0">来店情報</span>
            <span className="text-slate-200 font-bold">{review.course}</span>
            {dateStr && <span className="text-slate-500 ml-auto shrink-0">{dateStr}</span>}
          </div>
        )}

        {/* --- 3. CONTENT --- */}
        <div className="relative pt-4 border-t border-white/5">
          {canReadFull ? (
            <>
              <div
                className={`text-[15px] text-slate-200 leading-relaxed whitespace-pre-wrap ${!isExpanded && "line-clamp-4"}`}
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                onCopy={e => e.preventDefault()}
                onCut={e => e.preventDefault()}
                onContextMenu={e => e.preventDefault()}
              >
                {(review.content || "").split('\n').map((line, i) => {
                  if (line.includes('【') && line.includes('】')) {
                    return (
                      <div key={i} className="flex items-center gap-2 mt-4 mb-2 first:mt-0">
                        <span className="text-pink-400 text-[10px]"><Icons.ChevronRight /></span>
                        <span className="text-xs font-bold text-slate-300">{line.replace(/[【】]/g, '')}</span>
                      </div>
                    );
                  }
                  return <span key={i}>{line}{'\n'}</span>;
                })}
              </div>
              {(review.content || "").length > 150 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 text-xs font-bold text-pink-400 hover:text-pink-300 hover:underline flex items-center gap-1 focus:outline-none"
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
              <div className="mt-1 text-center px-5 py-4 bg-gradient-to-br from-purple-950/90 to-slate-900/90 rounded-2xl border border-purple-500/30 shadow-xl">
                <p className="text-purple-300 font-black text-[11px] tracking-widest mb-2">続き{Math.max(0, (review.content || '').length - 140)}文字は限定公開</p>
                <p className="text-white font-black text-sm mb-1 leading-tight">体験談を投稿すると<br/>この続きが読めます</p>
                <p className="text-slate-400 text-[11px] mb-3">1件投稿で<span className="text-purple-300 font-bold">最大7日間読み放題</span>（即時自動付与）</p>
                <Link
                  to="/post-review"
                  onClick={() => trackEvent('click_paywall_cta', { target: 'post_review' })}
                  className="inline-block bg-pink-600 hover:bg-pink-500 text-white text-xs font-black px-6 py-2.5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-pink-900/50"
                >
                  口コミを書く →
                </Link>
                {!user && (
                  <Link
                    to="/register"
                    onClick={() => trackEvent('click_paywall_cta', { target: 'register' })}
                    className="block mt-2 text-[11px] font-bold text-purple-300 hover:text-purple-200 hover:underline"
                  >
                    無料登録で3日間読み放題 →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- 4. TAGS (Footer) --- */}
        {review.tags?.length > 0 && (
          <div className="mt-5 pt-3 border-t border-white/5 flex flex-wrap gap-2">
              {review.tags.map((tag, i) => (
                <span key={i} className={`border px-3 py-1 rounded-full text-[11px] font-bold transition ${tagStyle(tag)}`}>
                  {tag}
                </span>
              ))}
          </div>
        )}

      {/* いいね・感謝バッジ・DM */}
      <div className="flex justify-between items-center mt-2">
        {/* DM ボタン（他者の口コミのみ・ログイン済み） */}
        {user && review.user_id && review.user_id !== user.id && review.user_id !== 'owner_manual' && review.user_id !== 'menesthe_rewritten' && review.user_id !== 'menesthe_import' ? (
          <DMButton toUserId={review.user_id} currentUser={user} navigate={navigate} />
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <ThanksBadgeButton reviewId={review.id} toUserId={review.user_id} initialCount={review.badge_count || 0} />
          <ReviewLikeButton reviewId={review.id} initialLikeCount={review.like_count || 0} />
        </div>
      </div>

      </div>
    </div>
  );
}
