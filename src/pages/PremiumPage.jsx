import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { supabase } from "../lib/supabase";
import Header from "../components/Header.jsx";
import SeoHead from "../components/SeoHead.jsx";

export default function PremiumPage() {
  const navigate = useNavigate();
  const { user, userPlan } = useAuth();
  const isLoggedIn = !!user;
  const isPremium = userPlan === "premium" || userPlan === "vip";
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [isLoading, setIsLoading] = useState(false);

  const plans = {
    monthly: { name: "月額プラン", price: 2980, period: "月", save: null },
    yearly: { name: "年額プラン", price: 29800, period: "年", save: "6,960円お得" },
  };

  // 🌟 【本物仕様】決済ボタンを押した時の処理
  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      alert("プレミアム登録にはログインが必要です！");
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      // 🌟 ここでSupabaseの「自分のプロフィール」をpremiumに上書きする！
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          plan: 'premium', 
          updated_at: new Date() 
        });

      if (error) throw error;

      alert("🎉 プレミアム会員にアップグレードしました！すべてのクチコミが読み放題です！");
      
      // 画面をリロードして、システム全体に「この人はプレミアムだ！」と再認識させる
      window.location.reload(); 
      
    } catch (error) {
      console.error("アップグレードエラー:", error);
      alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 font-sans">
      <SeoHead
        title="プレミアムプラン"
        description="メンエスマップのプレミアムプランでセラピストの口コミ・体験談が読み放題。月額・年額プランで選べます。"
        path="/premium"
      />
      <Header />
      <div className="max-w-3xl mx-auto p-4 md:p-6 mt-10">
        <div className="bg-slate-900/50 backdrop-blur rounded-3xl p-8 md:p-12 border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.1)] text-center">
          
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/20">
            <span className="text-4xl">👑</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-4">プレミアム会員</h1>
          <p className="text-slate-400 mb-8 font-bold">
            過去のすべてのクチコミが読み放題。<br/>リアルな評価をチェックして、最高のキャストを見つけましょう。
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-4 mb-10">
            {Object.keys(plans).map(key => (
              <button 
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`p-6 rounded-2xl border-2 transition-all flex-1 ${
                  selectedPlan === key 
                    ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
                    : 'border-white/5 bg-slate-800/50 hover:border-white/20'
                }`}
              >
                <div className="text-white font-black text-lg mb-2">{plans[key].name}</div>
                <div className="text-yellow-400 font-black text-2xl">¥{plans[key].price.toLocaleString()} <span className="text-sm text-slate-400">/ {plans[key].period}</span></div>
                {plans[key].save && (
                  <div className="mt-2 inline-block bg-pink-600 text-white text-[10px] px-2 py-1 rounded font-bold">
                    {plans[key].save}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="text-center">
            {/* 🌟 ボタンに onClick={handleSubscribe} を接続！ */}
            <button 
              onClick={handleSubscribe}
              disabled={isLoading || isPremium} 
              className="w-full max-w-md mx-auto px-12 py-4 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 text-slate-900 text-lg font-black transition-all hover:scale-105 shadow-lg shadow-yellow-600/30 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? "処理中..." : isPremium ? "👑 既にプレミアム会員です" : `${plans[selectedPlan].name}に登録する`}
            </button>
            
            {!isLoggedIn && (
              <div className="mt-6">
                <p className="text-pink-400 text-sm font-bold mb-2">※登録にはログインが必要です</p>
                <button onClick={() => navigate('/login')} className="text-slate-400 hover:text-white underline text-sm font-bold">
                  ログイン・新規登録はこちら →
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
