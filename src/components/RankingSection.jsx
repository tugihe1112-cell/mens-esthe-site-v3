import React, { useMemo, useState } from 'react';
import { Link } from '../compat/router';
import { useShopData } from '../contexts/DataContext.jsx';
import LazyImage from './LazyImage.jsx';

// ランク入りに必要な最低口コミ件数（1件で1位＝ステマサイトのシグネチャを避ける）
const MIN_REVIEWS_FOR_RANKING = 3;

// 👑 カテゴリ定義
const RANKING_CATEGORIES = [
  { id: 'total',    label: '総合' },
  { id: 'looks',    label: 'ルックス' },
  { id: 'style',    label: 'スタイル' },
  { id: 'service',  label: '接客' },
  { id: 'massage',  label: '技術' },
  { id: 'intimacy', label: '密着度' },
];

export default function RankingSection() {
  const { shops, reviews } = useShopData(); // DataContextからデータを取得
  const [rankingTab, setRankingTab] = useState('total');

  // ----------------------------------------------------------------
  // 📊 ランキング集計エンジン (The Brain)
  // ----------------------------------------------------------------
  const topTherapists = useMemo(() => {
    // データ読み込み前のガード
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return [];
    if (!shops || !Array.isArray(shops)) return [];

    const stats = {};
    
    // 1. 全クチコミを走査
    reviews.forEach(r => {
      // ユニークキー生成（店舗ID + セラピスト名）
      // ※IDがない古いデータにも対応するため名前もキーに含める
      const key = `${r.shop_id}_${r.therapistName}`;
      
      if (!stats[key]) {
        stats[key] = {
          key,
          id: r.threadId || r.therapist_id, 
          name: r.therapistName,
          shopId: r.shop_id,
          total: 0, count: 0,
          looks: 0, style: 0, service: 0, massage: 0, intimacy: 0
        };
      }
      
      // 点数の加算
      stats[key].total += Number(r.rating || 0);
      stats[key].count += 1;

      // 部門別点数の加算 (データが存在する場合のみ)
      if (r.detailedRatings) {
         stats[key].looks += Number(r.detailedRatings.looks || r.rating);
         stats[key].style += Number(r.detailedRatings.style || r.rating);
         stats[key].service += Number(r.detailedRatings.service || r.rating);
         stats[key].massage += Number(r.detailedRatings.massage || r.rating);
         stats[key].intimacy += Number(r.detailedRatings.intensity || r.detailedRatings.intimacy || r.rating);
      } else {
         // 古いデータへのフォールバック（総合点を代入）
         const val = Number(r.rating || 0);
         stats[key].looks += val; stats[key].style += val;
         stats[key].service += val; stats[key].massage += val; stats[key].intimacy += val;
      }
    });

    // 2. 平均点の算出とリスト化
    const ranking = Object.values(stats).map(s => {
      // 店舗情報の結合
      const shop = shops.find(shop => shop.id === s.shopId || shop.group_id === s.shopId);
      
      // セラピスト画像の検索 (Shopデータ内のthreads配列から探す)
      let img = null;
      let age = null;
      if (shop && shop.threads) {
         const t = shop.threads.find(th => th.id == s.id || th.name === s.name);
         if (t) {
            img = t.image;
            age = t.age;
         }
      }

      return {
        ...s,
        avg_total: s.total / s.count,
        avg_looks: s.looks / s.count,
        avg_style: s.style / s.count,
        avg_service: s.service / s.count,
        avg_massage: s.massage / s.count,
        avg_intimacy: s.intimacy / s.count,
        shopName: shop ? shop.name : 'Unknown Shop',
        image: img, // 後でLazyImageがデフォルト画像処理をするのでnullでもOKだが
        age: age
      };
    });

    // 3. ソート（選択中のタブのスコアで並び替え）
    const sortKey = `avg_${rankingTab}`;
    // ⚠️ 2026-08: ランク入りの最低口コミ件数を導入。
    //   口コミ総数が十数件の段階では「1件・★5.0で全国1位」が成立してしまい、
    //   偽レビューサイトの典型的シグネチャになる（非課金中立を掲げる本サイトには最も損な自己表現）。
    //   /stats で「サンプル10店未満の料金帯は非掲載」としているのと同じ統計的良心を一覧UIにも適用する。
    const qualified = ranking.filter(s => s.count >= MIN_REVIEWS_FOR_RANKING);
    // 点数が高い順、同じなら口コミ数が多い順
    return qualified.sort((a, b) => b[sortKey] - a[sortKey] || b.count - a.count).slice(0, 5); // TOP5まで表示
  }, [reviews, shops, rankingTab]);

  // データがない場合は表示しない（あるいはスケルトンを表示）
  if (!shops || shops.length === 0) return null;

  return (
    <section className="relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-slate-700 pb-3">
        <div>
          <h2 className="font-mincho text-[26px] md:text-[32px] font-bold leading-[1.3] text-slate-50">部門別ランキング</h2>
          <p className="text-slate-400 text-sm mt-1">
            リアルな体験談に基づく、今もっとも熱いセラピスト
          </p>
        </div>

        {/* タブメニュー */}
        <div role="group" aria-label="ランキングの部門" className="flex divide-x divide-slate-700 rounded-sm border border-slate-700 overflow-x-auto no-scrollbar max-w-full">
          {RANKING_CATEGORIES.map(cat => (
             <button 
               key={cat.id} 
               onClick={() => setRankingTab(cat.id)}
               aria-pressed={rankingTab === cat.id}
               className={`min-h-11 whitespace-nowrap px-4 text-sm transition-colors ${
                 rankingTab === cat.id
                 ? 'bg-slate-800 font-bold text-slate-50'
                 : 'text-slate-400 hover:text-white'
               }`}
             >
               {cat.label}
             </button>
          ))}
        </div>
      </div>

      {/* ランキングリスト表示 */}
      <div className="grid">
         {topTherapists.map((item, index) => (
            <Link 
              key={item.key} 
              to={`/shops/${item.shopId}/threads/${item.id}`}
              className="group flex items-center gap-4 border-b border-slate-800 py-4 transition-colors"
            >
               {/* 順位（金・銀・銅の色はやめ、数字の書体で。上位3つだけ朱） */}
               <div className={`w-10 flex-shrink-0 text-center font-numeral text-[32px] font-semibold leading-none ${index < 3 ? 'text-pink-400' : 'text-slate-500'}`}>
                 {String(index + 1).padStart(2, '0')}
               </div>

               {/* 画像 */}
               <div className="w-16 h-16 overflow-hidden border border-slate-700 flex-shrink-0 relative">
                 <LazyImage src={item.image_url || item.image} alt={item.name} className="w-full h-full object-cover" />
               </div>

               {/* 情報 */}
               <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2">
                    <h3 className="font-mincho text-slate-50 font-bold text-lg truncate group-hover:text-pink-300 transition">
                      {item.name}
                    </h3>
                    {item.age && <span className="shrink-0 text-xs text-slate-400">{item.age}歳</span>}
                 </div>
                 <p className="text-xs text-slate-400 truncate mt-1">{item.shopName}</p>
               </div>

               {/* スコア（口コミ件数を必ず併記＝母数を隠さない） */}
               <div className="text-right hidden sm:block">
                 <div className="font-numeral text-3xl font-semibold text-slate-50 leading-none">
                   {item[`avg_${rankingTab}`].toFixed(1)}
                 </div>
                 <div className="text-xs text-slate-400 mt-1">口コミ{item.count}件</div>
               </div>
               {/* モバイルは省スペースで1行に */}
               <div className="text-right sm:hidden">
                 <div className="font-numeral text-2xl font-semibold text-slate-50 leading-none">
                   {item[`avg_${rankingTab}`].toFixed(1)}
                 </div>
                 <div className="text-xs text-slate-400 mt-0.5">{item.count}件</div>
               </div>
               
               <div aria-hidden="true" className="text-slate-600 group-hover:text-pink-400 transition-colors px-1">→</div>
            </Link>
         ))}
         
         {topTherapists.length === 0 && (
           <div className="border border-slate-700 bg-slate-900 p-6 md:p-8">
             <p className="text-pink-300 tracking-[0.2em] text-[11px] mb-3">口コミ募集中</p>
             <h3 className="font-mincho text-slate-50 font-bold text-xl mb-2">ランキングを一緒に作ろう</h3>
             <p className="text-slate-400 text-sm mb-6 leading-relaxed">
               体験談を投稿すると<span className="text-pink-400 font-bold">閲覧権が得られます</span>。<br/>
               あなたの口コミがランキングを動かします。
             </p>
             <Link
               to="/post-review"
               className="inline-flex min-h-11 items-center bg-pink-500 hover:bg-pink-400 text-slate-950 font-bold px-8 rounded-sm transition-colors active:scale-95 text-sm"
             >
               口コミを書く
             </Link>
           </div>
         )}
      </div>
    </section>
  );
}
