import React from "react";
import { Link } from '../compat/router';
import Header from "../components/Header.jsx";
import SeoHead from "../components/SeoHead.jsx";
import { trackEvent } from '../utils/analytics';

/**
 * プレミアムプラン（準備中）
 *
 * ⚠️ 2026-08: 価格表（¥2,980/月・¥29,800/年）を削除した。
 *   決済は未実装で1件も課金していないうえ、戦略上の決定価格（¥980/月・¥9,800/年）と
 *   矛盾する誤ったアンカーを訪問者に見せていたため。
 *   いまの正しい導線は「口コミを書けば読み放題（W2R）」のみ。
 *   noindex にして検索から到達させない（薄い準備中ページで索引を汚さない）。
 */
export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 font-sans">
      <SeoHead
        title="有料プランについて"
        description="メンエスマップの有料プランは準備中です。いまは口コミを1件投稿すると、みんなの口コミが読み放題になります。"
        path="/premium"
        noindex
      />
      <Header />
      <div className="max-w-2xl mx-auto p-4 md:p-6 mt-10">
        <div className="bg-slate-900/60 backdrop-blur rounded-3xl p-8 md:p-12 border border-white/10 text-center">

          <div className="w-16 h-16 bg-slate-800 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🛠️</span>
          </div>

          <p className="text-slate-500 font-black text-[11px] tracking-widest mb-2">PREPARING</p>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-4">有料プランは現在準備中です</h1>

          <p className="text-slate-400 mb-8 font-bold leading-relaxed text-sm">
            いまは有料プランの受付をしていません。<br />
            口コミを1件投稿していただければ、みんなの口コミが読み放題になります。
          </p>

          {/* W2R（いま使える唯一の解放手段） */}
          <div className="bg-gradient-to-br from-purple-950/70 to-slate-900 border border-purple-500/25 rounded-2xl p-6 mb-8 text-left">
            <h2 className="text-white font-black text-base mb-3">口コミを書けば読み放題</h2>
            <ul className="space-y-2 text-sm text-slate-300 font-bold">
              <li className="flex gap-2"><span className="text-purple-400">✓</span> 200文字以上の体験談で <span className="text-purple-300">3日間</span> の閲覧権を即時付与</li>
              <li className="flex gap-2"><span className="text-purple-400">✓</span> 700文字以上なら <span className="text-purple-300">7日間</span> に延長</li>
              <li className="flex gap-2"><span className="text-purple-400">✓</span> 新規登録だけでも <span className="text-purple-300">3日間</span> 無料</li>
            </ul>
          </div>

          <Link
            to="/post-review"
            onClick={() => trackEvent('click_paywall_cta', { target: 'post_review' })}
            className="inline-block w-full max-w-md mx-auto px-12 py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-base font-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-pink-900/40"
          >
            口コミを書く →
          </Link>

          <Link
            to="/popular-reviews"
            className="block mt-4 text-sm font-bold text-slate-400 hover:text-white transition underline"
          >
            先にみんなの口コミを見てみる
          </Link>

          <p className="mt-8 text-[11px] text-slate-500 leading-relaxed">
            ※ メンエスマップは掲載店舗から広告費・掲載料を一切受け取っていません。<br />
            有料プランを開始する際は、事前にサイト上でご案内します。
          </p>

        </div>
      </div>
    </div>
  );
}
