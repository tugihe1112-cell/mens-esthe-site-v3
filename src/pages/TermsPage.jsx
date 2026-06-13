import React, { useEffect } from 'react';
import { useNavigate } from '../compat/router';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';

export default function TermsPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 font-sans">
      <SeoHead title="利用規約" />
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition font-bold text-sm">
          <span>←</span> 戻る
        </button>

        <h1 className="text-2xl md:text-3xl font-black text-white mb-8 border-b border-white/10 pb-4">利用規約</h1>

        <div className="bg-slate-900/50 backdrop-blur rounded-2xl border border-white/5 p-6 md:p-8 shadow-xl space-y-8 text-sm md:text-base leading-relaxed text-slate-300">
          <p>
            この利用規約（以下、「本規約」といいます。）は、当サイト（以下、「本サービス」といいます。）の利用条件を定めるものです。ご利用される皆様（以下、「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。
          </p>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第1条（適用および年齢制限）</h2>
            <p>1. 本規約は、ユーザーと本サービスの利用に関わる一切の関係に適用されるものとします。</p>
            <p>2. 本サービスは18歳未満（高校生含む）の方のアクセスおよび利用を固く禁じます。ユーザーは、本サービスを利用することにより、自身が18歳以上であることを保証したものとみなします。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第2条（クチコミ・投稿内容について）</h2>
            <p>1. ユーザーは、本サービスにおいて自ら投稿したクチコミ等の情報について、適法な権利を有していること、および第三者の権利を侵害していないことについて、本サービスに対し表明し、保証するものとします。</p>
            <p>2. 本サービスは、ユーザーが投稿した内容が以下のいずれかに該当すると判断した場合、事前の通知なく当該投稿を削除することができるものとします。</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>法令または公序良俗に違反する内容</li>
              <li>特定の個人や店舗を著しく誹謗中傷する内容</li>
              <li>虚偽の情報、または事実と著しく異なる内容</li>
              <li>その他、本サービスが不適切と判断した内容</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第3条（免責事項）</h2>
            <p>1. 本サービスは、掲載された店舗情報やクチコミの正確性、最新性、有用性等について一切の保証を行いません。</p>
            <p>2. 本サービスを通じてユーザーと店舗、またはユーザー同士の間で生じたトラブルや損害について、本サービスは一切の責任を負わないものとします。</p>
            <p>3. 本サービスは、システムのメンテナンスや障害等により、事前の予告なくサービスの提供を停止または中断することがあり、これによって生じた損害について責任を負いません。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第4条（プレミアムサービス・有料プラン）</h2>
            <p>1. 有料プランの利用料金および支払方法は、別途定める「特定商取引法に基づく表記」に従うものとします。</p>
            <p>2. ユーザーは、本サービスのマイページ等から所定の手続きを行うことで、いつでも有料プランの自動更新を停止することができます。ただし、すでに支払われた料金の返金は行いません。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第5条（規約の変更）</h2>
            <p>本サービスは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の本規約は、本サービス上に掲示された時点から効力を生じるものとします。</p>
          </section>
        </div>
      </div>
    </div>
  );
}
