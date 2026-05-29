import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useShopData } from '../contexts/DataContext.jsx';
import LazyImage from './LazyImage.jsx';

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
    // 点数が高い順、同じなら口コミ数が多い順
    return ranking.sort((a, b) => b[sortKey] - a[sortKey] || b.count - a.count).slice(0, 5); // TOP5まで表示
  }, [reviews, shops, rankingTab]);

  // データがない場合は表示しない（あるいはスケルトンを表示）
  if (!shops || shops.length === 0) return null;

  return (
    <section className="relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="text-yellow-500 drop-shadow-lg">🏆</span> 
            <span>部門別ランキング</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-2 pl-1">
            リアルな体験談に基づく、今もっとも熱いセラピスト
          </p>
        </div>

        {/* タブメニュー */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto no-scrollbar max-w-full">
          {RANKING_CATEGORIES.map(cat => (
             <button 
               key={cat.id} 
               onClick={() => setRankingTab(cat.id)}
               className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                 rankingTab === cat.id
                 ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/40'
                 : 'text-slate-400 hover:text-white hover:bg-white/5'
               }`}
             >
               {cat.label}
             </button>
          ))}
        </div>
      </div>

      {/* ランキングリスト表示 */}
      <div className="grid gap-4">
         {topTherapists.map((item, index) => (
            <Link 
              key={item.key} 
              to={`/shops/${item.shopId}/threads/${item.id}`}
              className="group flex items-center gap-4 bg-slate-900/40 p-4 rounded-3xl border border-white/5 hover:border-pink-500/50 hover:bg-slate-900/60 transition-all duration-300"
            >
               {/* 順位バッジ */}
               <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl font-black text-xl shadow-inner ${
                 index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-yellow-900/50' :
                 index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900' :
                 index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : 
                 'bg-slate-800 text-slate-500'
               }`}>
                 {index + 1}
               </div>

               {/* 画像 */}
               <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 relative group-hover:scale-105 transition duration-500">
                 <LazyImage src={item.image_url || item.image} alt={item.name} className="w-full h-full object-cover" />
               </div>

               {/* 情報 */}
               <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-lg truncate group-hover:text-pink-400 transition">
                      {item.name}
                    </h3>
                    {item.age && <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">Age {item.age}</span>}
                 </div>
                 <p className="text-xs text-slate-500 truncate mt-1">{item.shopName}</p>
               </div>

               {/* スコア */}
               <div className="text-right hidden sm:block">
                 <div className="text-2xl font-black text-pink-500 leading-none">
                   {item[`avg_${rankingTab}`].toFixed(1)}
                 </div>
                 <div className="text-[10px] text-slate-600 font-bold tracking-widest mt-1">SCORE</div>
               </div>
               
               <div className="text-slate-700 group-hover:text-pink-500 transition-colors px-2">›</div>
            </Link>
         ))}
         
         {topTherapists.length === 0 && (
           <div className="relative overflow-hidden rounded-3xl border border-pink-500/20 bg-gradient-to-br from-pink-950/40 to-purple-950/40 p-8 text-center">
             <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 pointer-events-none" />
             <p className="text-pink-400 font-black tracking-widest text-xs uppercase mb-3">口コミ募集中</p>
             <h3 className="text-white font-black text-xl mb-2">ランキングを一緒に作ろう</h3>
             <p className="text-slate-400 text-sm mb-6 leading-relaxed">
               体験談を投稿すると<span className="text-pink-400 font-bold">閲覧権が得られます</span>。<br/>
               あなたの口コミがランキングを動かします。
             </p>
             <Link
               to="/post-review"
               className="inline-block bg-pink-600 hover:bg-pink-500 text-white font-black px-8 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-900/40 text-sm"
             >
               口コミを書く
             </Link>
           </div>
         )}
      </div>
    </section>
  );
}
