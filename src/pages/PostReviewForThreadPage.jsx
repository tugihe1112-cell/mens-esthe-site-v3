// src/pages/PostReviewForThreadPage.jsx
// セラピスト指定投稿ページ (Safe Mode)

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useShopData } from "../contexts/DataContext.jsx";
import { useAppContext } from "../context/AppContext.tsx";
import SeoHead from "../components/SeoHead.jsx";

const ALLOWED_TAGS = ["スレンダー", "グラマー", "巨乳", "美脚", "小柄", "高身長", "可愛い系", "美人系", "清楚系", "ギャル系", "お姉さん系", "10代", "20代前半", "20代後半", "30代", "40代", "色白", "健康的", "ベテラン", "外国人"];

const TEMPLATES = {
  standard: [
    { label: "【① 予約時の対応】", placeholder: "例：スムーズだった、希望時間が取れた..." },
    { label: "【② お店の場所・アクセス】", placeholder: "例：迷わず行けた、看板がなくて隠れ家風..." },
    { label: "【③ ルームの雰囲気】", placeholder: "例：清潔感があった、香りが良かった、照明がエロい..." },
    { label: "【④ セラピストの第一印象】", placeholder: "例：写真通り可愛かった、愛想が良くて安心した..." },
    { label: "【⑤ 施術の流れ・内容】", placeholder: "例：密着度が高かった、マッサージが上手だった..." },
    { label: "【⑥ 終了後の感想】", placeholder: "例：また行きたい、〇〇な人におすすめ..." }
  ],
  emotional: [
    { label: "【💖 なぜ今日ここに来たか】", placeholder: "例：仕事で疲れて癒やされたかった、Xの写真に一目惚れして..." },
    { label: "【🚪 ドアが開いた瞬間の衝撃】", placeholder: "例：想像以上に可愛くて心臓が跳ねた、笑顔にやられた..." },
    { label: "【💕 施術中のドキドキ体験】", placeholder: "例：耳元での囁きがヤバかった、肌が触れ合う距離感が..." },
    { label: "【🔥 クライマックス・余韻】", placeholder: "例：帰りたくないと思うほど幸せだった..." },
    { label: "【✨ 最後に一言】", placeholder: "例：この子は絶対伸びる！隠しておきたいけど教えたい..." }
  ]
};

export default function PostReviewForThreadPage() {
  const { shopId, threadId } = useParams();
  const navigate = useNavigate();
  
  // データの取得（安全策: 存在しないプロパティがあっても落ちないようにする）
  const { shops, therapists, loading } = useShopData();
  const { submitExistingShopReview, currentUser } = useAppContext();

  // 店舗とセラピストの特定 (配列から検索する確実な方法)
  // ☁️ クラウドから直接データ取得（迷子防止）
  const [cloudShop, setCloudShop] = React.useState(null);
  const [cloudTherapist, setCloudTherapist] = React.useState(null);
  React.useEffect(() => {
    if (!shopId || !threadId) return;
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };
    fetch(`${url}/rest/v1/shops?id=eq.${shopId}`, {headers}).then(r=>r.json()).then(d=>d[0]&&setCloudShop(d[0]));
    fetch(`${url}/rest/v1/therapists?id=eq.${threadId}`, {headers}).then(r=>r.json()).then(d=>d[0]&&setCloudTherapist(d[0]));
  }, [shopId, threadId]);

  const shop = cloudShop || useMemo(() => shops?.find(s => s.id === shopId), [shops, shopId]);
  const therapist = cloudTherapist || useMemo(() => therapists?.find(t => t.id === threadId), [therapists, threadId]);

  const therapistName = therapist ? therapist.name : "不明なセラピスト";

  const [rating, setRating] = useState(0);
  const [detailedRatings, setDetailedRatings] = useState({ looks: 3, style: 3, intimacy: 3, service: 3, massage: 3 });
  
  const [activeTemplate, setActiveTemplate] = useState("standard");
  const [sectionValues, setSectionValues] = useState({});
  
  const [course, setCourse] = useState("");
  const [price, setPrice] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      // ログインチェック（必要なら有効化）
      // alert("口コミを投稿するにはログインが必要です");
      // navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleDetailedRatingChange = (key, value) => {
    setDetailedRatings(prev => ({ ...prev, [key]: Number(value) }));
  };

  const toggleTag = (tag) => {
    if (!selectedTags.includes(tag) && selectedTags.length >= 5) return alert("タグは最大5個まで選択できます");
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSectionChange = (index, value) => {
      setSectionValues(prev => ({ ...prev, [index]: value }));
  };

  const changeTemplate = (type) => {
      if (Object.keys(sectionValues).length > 0 && !window.confirm("入力内容がリセットされますが、テンプレートを変更しますか？")) return;
      setActiveTemplate(type);
      setSectionValues({});
  };

  const totalCharCount = Object.values(sectionValues).reduce((sum, text) => {
      return sum + (text || "").replace(/\s+/g, '').length;
  }, 0);

  const getWriterRank = (count) => {
    if (count >= 800) return { title: "👑 メンエス作家（レジェンド）", color: "text-red-500", bg: "bg-red-900/30 border-red-500", bar: "bg-gradient-to-r from-orange-500 to-red-600" };
    if (count >= 400) return { title: "📖 ストーリーテラー", color: "text-yellow-400", bg: "bg-yellow-900/30 border-yellow-500", bar: "bg-yellow-500" };
    if (count >= 100) return { title: "📝 標準レビュアー", color: "text-green-400", bg: "bg-green-900/30 border-green-500", bar: "bg-green-500" };
    return { title: "🐣 初心者レビュアー", color: "text-blue-400", bg: "bg-blue-900/30 border-blue-500", bar: "bg-blue-500" };
  };

  const rank = getWriterRank(totalCharCount);
  const progress = Math.min(100, (totalCharCount / 800) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return alert("総合評価を選択してください");
    if (totalCharCount < 10) return alert("口コミ内容は合計10文字以上でお願いします");

    setIsSubmitting(true);

    const templates = TEMPLATES[activeTemplate];
    let finalContent = "";
    templates.forEach((tpl, i) => {
        const val = sectionValues[i];
        if (val && val.trim().length > 0) {
            finalContent += `${tpl.label}\n${val}\n\n`;
        }
    });
    if (!finalContent.trim()) finalContent = "（内容なし）";
    const finalCourse = course ? `${course} ${price ? `(${price})` : ""}` : undefined;

    const reviewData = {
      shopId,
      threadId,
      therapistName,
      rating,
      detailedRatings,
      content: finalContent,
      tags: selectedTags,
      course: finalCourse,
      timestamp: new Date().toISOString()
    };

    // 投稿処理 (Contextにメソッドがない場合のフォールバック)
    if (submitExistingShopReview) {
      await submitExistingShopReview(reviewData);
    } else {
      console.log("Mock Submit:", reviewData);
      await new Promise(r => setTimeout(r, 1000));
    }
    
    setIsSubmitting(false);
    navigate(`/shops/${shopId}/threads/${threadId}`); // 戻り先をセラピスト詳細へ
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  if (!shop) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">店舗が見つかりません</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      <SeoHead title={`口コミ投稿 - ${therapistName}`} />
      
      <div className="max-w-2xl mx-auto px-4 pt-8">
        
        <div className="mb-8 text-center">
           <h1 className="text-2xl font-bold mb-2">口コミを投稿</h1>
           <div className="text-gray-400">
             <span className="font-bold text-white">{shop.name}</span> - <span className="text-pink-400 font-bold">{therapistName}</span> さんへ
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            
            <div className="mb-8 text-center">
              <label className="block text-sm font-bold text-gray-400 mb-2">総合評価 <span className="text-red-400">*</span></label>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setRating(star)} className={`text-4xl transition transform hover:scale-110 ${star <= rating ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "text-slate-600"}`}>★</button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-lg text-center border border-slate-700/50">
              <label className="block text-xs font-bold text-gray-400 mb-3 text-center">詳細スコア</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Object.keys(detailedRatings).map(key => (
                  <div key={key} className="text-center">
                    <div className="text-[10px] text-gray-400 mb-1">
                      {key === 'looks' ? 'ルックス' : key === 'style' ? 'スタイル' : key === 'intimacy' ? '密着度' : key === 'service' ? '接客' : 'マッサージ'}
                    </div>
                    <select value={detailedRatings[key]} onChange={(e) => handleDetailedRatingChange(key, e.target.value)} className="w-full bg-slate-800 text-white text-xs rounded border border-slate-600 px-1 py-1 outline-none focus:border-pink-500">
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 mb-6">
              <label className="block text-xs font-bold text-gray-400 mb-2">特徴タグ <span className="text-[10px] font-normal">(最大5つ)</span></label>
              <div className="flex flex-wrap gap-2">
                {ALLOWED_TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedTags.includes(tag) ? "bg-pink-600 border-pink-600 text-white shadow-md" : "bg-transparent border-slate-600 text-gray-400"}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
               <div className="col-span-2"><label className="block text-xs font-bold text-gray-400 mb-1">受けたコース</label><input type="text" name="course" value={course} onChange={(e) => setCourse(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white text-sm outline-none" placeholder="例: 90分 アロマ" /></div>
               <div><label className="block text-xs font-bold text-gray-400 mb-1">価格</label><input type="text" name="price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white text-sm outline-none" placeholder="例: 15000" /></div>
            </div>

            <div>
                 <div className="flex justify-between items-center mb-2">
                   <label className="block text-xs font-bold text-gray-400">口コミ内容</label>
                   <div className="flex gap-2">
                     <button type="button" onClick={() => changeTemplate('standard')} className={`text-[10px] px-2 py-1 rounded border transition ${activeTemplate === 'standard' ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-700 border-slate-600 text-gray-400 hover:text-white"}`}>📝 標準構成</button>
                     <button type="button" onClick={() => changeTemplate('emotional')} className={`text-[10px] px-2 py-1 rounded border transition ${activeTemplate === 'emotional' ? "bg-gradient-to-r from-pink-600 to-rose-600 border-pink-500 text-white" : "bg-slate-700 border-slate-600 text-gray-400 hover:text-white"}`}>🔥 没入型</button>
                   </div>
                 </div>
                 
                 <div className="bg-slate-900 p-2 space-y-2 rounded-lg border border-slate-700">
                     {TEMPLATES[activeTemplate].map((item, i) => (
                        <div key={i} className="group">
                            <div className="px-3 py-1 text-xs font-bold text-gray-400 select-none bg-slate-800/50 rounded-t-lg border-l-2 border-pink-500/50 ml-1 mr-1 mt-1">
                                {item.label}
                            </div>
                            <textarea value={sectionValues[i] || ""} onChange={(e) => handleSectionChange(i, e.target.value)} className="w-full px-4 py-2 bg-slate-900 text-white resize-none focus:outline-none focus:bg-slate-800/30 transition text-sm min-h-[60px] border-b border-slate-800 focus:border-pink-900/50" placeholder={item.placeholder} />
                        </div>
                     ))}
                 </div>
                 <div className="w-full h-1 bg-slate-700 mt-2 rounded-full overflow-hidden"><div className={`h-full ${rank.bar} transition-all duration-500 ease-out`} style={{ width: `${progress}%` }}></div></div>
                 <div className={`mt-2 p-2 rounded border ${rank.bg} flex items-center justify-between transition-all duration-500`}>
                   <div className="flex items-center gap-2"><span className={`text-sm font-bold ${rank.color} animate-pulse`}>{rank.title}</span><span className="text-xs text-gray-400">({totalCharCount}文字)</span></div>
                 </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition transform hover:-translate-y-1 ${isSubmitting ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-900/30"}`}>
            {isSubmitting ? "送信中..." : "口コミを投稿する"}
          </button>
        </form>
      </div>
    </div>
  );
}
