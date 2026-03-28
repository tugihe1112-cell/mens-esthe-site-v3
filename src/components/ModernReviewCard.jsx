import React, { useState } from "react";
import { Link } from "react-router-dom";

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

export default function ModernReviewCard({ review }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dateStr = review.timestamp ? new Date(review.timestamp).toLocaleDateString('ja-JP') : review.date || '日付不明';

  const scores = [
    { label: "ルックス", value: review.detailedRatings?.looks || 0, icon: <Icons.Eye /> },
    { label: "スタイル", value: review.detailedRatings?.style || 0, icon: <Icons.User /> },
    { label: "愛嬌・接客", value: review.detailedRatings?.service || 0, icon: <Icons.Heart /> },
    { label: "マッサージ", value: review.detailedRatings?.massage || 0, icon: <Icons.Hand /> },
    { label: "密着度", value: review.detailedRatings?.intimacy || 0, icon: <Icons.Activity /> },
  ];

  return (
    <div className="group relative w-full max-w-2xl mx-auto mb-6 transition-all duration-300 hover:-translate-y-1">
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/90 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl" />

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
                   {review.therapistName || "セラピスト"}
                 </h2>
                 </Link>
                 {review.course && (
                    <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded font-bold whitespace-nowrap self-center transform translate-y-1">
                      {review.course}
                    </span>
                 )}
              </div>
              
              {/* META: Reviewer (Tiny & Subdued) */}
              <div className="flex items-center gap-2 mt-1 ml-1">
                <div className="flex items-center gap-1.5 opacity-40 text-xs text-white">
                  <span className="w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center text-[8px]">👤</span>
                  <span className="font-normal">{review.userName || '匿名'}</span>
                </div>
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
            <div className="flex gap-0.5 mt-0.5">
               {[1,2,3,4,5].map(i => (
                 <span key={i} className={`text-[6px] ${i <= (review.rating || 0) ? "text-yellow-300" : "text-black/20"}`}>★</span>
               ))}
            </div>
          </div>
        </div>

        {/* --- 2. METRICS (Compact) --- */}
        {review.detailedRatings && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
            {scores.map((score, i) => (
              <div key={i} className="flex flex-col items-center justify-center bg-white/5 border border-white/5 rounded-lg py-2 transition-colors hover:bg-white/10 group/metric">
                <span className="text-slate-500 mb-1 group-hover/metric:text-pink-400 transition-colors">{score.icon}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{score.label}</span>
                <span className={`text-xs font-bold ${getScoreColor(score.value)}`}>
                  {Number(score.value).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* --- 3. CONTENT --- */}
        <div className="relative pt-4 border-t border-white/5">
          <div className={`text-[15px] text-slate-200 leading-relaxed whitespace-pre-wrap ${!isExpanded && "line-clamp-4"}`}>
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
        </div>

        {/* --- 4. TAGS (Footer) --- */}
        {review.tags?.length > 0 && (
          <div className="mt-5 pt-3 border-t border-white/5 flex flex-wrap gap-2">
              {review.tags.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded text-[10px] font-medium transition hover:text-pink-300 hover:border-pink-500/30">
                  <Icons.Tag />
                  {tag}
                </span>
              ))}
          </div>
        )}

      </div>
    </div>
  );
}
