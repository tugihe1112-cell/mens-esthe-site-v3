import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';

export default function LegalPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 font-sans">
      <SeoHead title="特定商取引法に基づく表記" />
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition font-bold text-sm">
          <span>←</span> 戻る
        </button>

        <h1 className="text-2xl md:text-3xl font-black text-white mb-8 border-b border-white/10 pb-4">
          特定商取引法に基づく表記
        </h1>

        <div className="bg-slate-900/50 backdrop-blur rounded-2xl border border-white/5 overflow-hidden shadow-xl">
          <dl className="divide-y divide-white/5 text-sm md:text-base">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] p-6 gap-2 md:gap-4 hover:bg-white/5 transition">
              <dt className="text-slate-400 font-bold">販売事業者</dt>
              <dd className="text-white font-medium">
                個人運営のため省略<br/>
                <span className="text-xs text-slate-500">※取引時にご請求があれば遅滞なく開示いたします。</span>
              </dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] p-6 gap-2 md:gap-4 hover:bg-white/5 transition">
              <dt className="text-slate-400 font-bold">所在地</dt>
              <dd className="text-white font-medium">省略（※ご請求があれば遅滞なく開示いたします）</dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] p-6 gap-2 md:gap-4 hover:bg-white/5 transition">
              <dt className="text-slate-400 font-bold">電話番号</dt>
              <dd className="text-white font-medium">省略（※ご請求があれば遅滞なく開示いたします）</dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] p-6 gap-2 md:gap-4 hover:bg-white/5 transition">
              <dt className="text-slate-400 font-bold">お問い合わせ</dt>
              <dd className="text-white font-medium">
                <Link to="/contact" className="text-pink-300 hover:text-pink-200 underline underline-offset-4">
                  お問い合わせフォーム
                </Link>
                よりご連絡ください。
              </dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] p-6 gap-2 md:gap-4 hover:bg-white/5 transition">
              <dt className="text-slate-400 font-bold">販売価格・支払時期等</dt>
              <dd className="text-white font-medium">各有料プランの購入ページに記載された金額・条件に準じます。</dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] p-6 gap-2 md:gap-4 hover:bg-white/5 transition">
              <dt className="text-slate-400 font-bold">返品・キャンセル</dt>
              <dd className="text-white font-medium">
                デジタルコンテンツという商品の性質上、決済完了後のキャンセル・返金はお受けできません。解約手続きはマイページよりいつでも可能です。
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
